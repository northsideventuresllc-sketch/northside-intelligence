import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient, type SupabaseClient } from "jsr:@supabase/supabase-js@2";
import { readPlatformSecret } from "../_shared/platform-secrets.ts";

const RESEND_API_URL = "https://api.resend.com/emails";

type Verdict = "keep" | "adjust" | "scrap";

interface Arm3Tool {
  slug: string;
  name: string;
  price_usd: number | null;
  category: string | null;
  target_user: string | null;
  estimated_margin_pct: number | null;
}

interface EvalResult {
  slug: string;
  name: string;
  score: number;
  verdict: Verdict;
  revenueUsd: number;
  payingUsers: number;
}

interface ToolEvalRow {
  tool_slug: string;
  score: number;
  verdict: string;
  revenue_usd: number | null;
  paying_users: number | null;
}

interface PatternSignalInput {
  signal_type: string;
  value: string;
  weight: number;
}

interface ProfileUsageRow {
  replies_used_this_month?: number | null;
  grants_used_this_month?: number | null;
}

function sumProfileUsage(rows: ProfileUsageRow[] | null): number {
  if (!rows?.length) return 0;
  return rows.reduce((sum, row) => {
    const numericValues = Object.values(row).filter(
      (value): value is number => typeof value === "number"
    );
    const first = numericValues[0] ?? 0;
    return sum + first;
  }, 0);
}

Deno.serve(async (req) => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    return new Response(
      JSON.stringify({ error: "Missing Supabase configuration" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  const authHeader = req.headers.get("Authorization");
  if (authHeader !== `Bearer ${serviceRoleKey}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const evalWeek = new Date().toISOString().split("T")[0];

  const { data: tools, error: toolsError } = await supabase
    .from("arm3_tools")
    .select("slug, name, price_usd, category, target_user, estimated_margin_pct")
    .eq("status", "live");

  if (toolsError || !tools?.length) {
    return new Response(
      JSON.stringify({ error: "No live tools found", detail: toolsError }),
      { status: 404, headers: { "Content-Type": "application/json" } }
    );
  }

  const evalResults: EvalResult[] = [];

  for (const tool of tools as Arm3Tool[]) {
    const slug = tool.slug;
    const profilesTable = `${slug}_profiles`;

    const { count: totalSignups, error: signupError } = await supabase
      .from(profilesTable)
      .select("*", { count: "exact", head: true });

    if (signupError) {
      continue;
    }

    const { count: payingUsers, error: payingError } = await supabase
      .from("ni_toolkit")
      .select("*", { count: "exact", head: true })
      .eq("tool_slug", slug)
      .in("access_type", ["tool_subscription", "lifetime", "ni_plan"]);

    if (payingError) {
      continue;
    }

    const revenueUsd = (payingUsers ?? 0) * (Number(tool.price_usd) || 15);

    const { data: profileData, error: profileError } = await supabase
      .from(profilesTable)
      .select("replies_used_this_month, grants_used_this_month");

    if (profileError) {
      continue;
    }

    const usageEvents = sumProfileUsage(profileData as ProfileUsageRow[] | null);

    const conversionRate = totalSignups
      ? (payingUsers ?? 0) / totalSignups
      : 0;
    const score = Math.min(
      100,
      Math.round(
        conversionRate * 40 +
          Math.min(revenueUsd / 500, 1) * 30 +
          Math.min((totalSignups ?? 0) / 100, 1) * 20 +
          Math.min(usageEvents / 200, 1) * 10
      )
    );

    let verdict: Verdict;
    if (score >= 50) verdict = "keep";
    else if (score >= 25) verdict = "adjust";
    else verdict = "scrap";

    const { error: evalInsertError } = await supabase
      .from("arm3_tool_evals")
      .insert({
        tool_slug: slug,
        eval_week: evalWeek,
        signups_total: totalSignups ?? 0,
        signups_this_week: 0,
        usage_events: usageEvents,
        paying_users: payingUsers ?? 0,
        revenue_usd: revenueUsd,
        score,
        verdict,
        emailed_at: new Date().toISOString(),
      });

    if (evalInsertError) {
      continue;
    }

    await supabase.from("arm3_weekly_logs").insert({
      week_of: evalWeek,
      log_type: "eval",
      tool_slug: slug,
      summary: `Score: ${score}/100 | Verdict: ${verdict.toUpperCase()} | Signups: ${totalSignups} | Paying: ${payingUsers} | Revenue: $${revenueUsd}`,
      detail: {
        totalSignups,
        payingUsers,
        revenueUsd,
        usageEvents,
        score,
        verdict,
      },
      action_required: verdict !== "keep",
      action_for: verdict !== "keep" ? "JB" : null,
    });

    evalResults.push({
      slug,
      name: tool.name,
      score,
      verdict,
      revenueUsd,
      payingUsers: payingUsers ?? 0,
    });
  }

  await runPatternLearner(supabase, evalResults);

  const resendKey = await readPlatformSecret("RESEND_API_KEY");
  if (resendKey && evalResults.length > 0) {
    const rows = [...evalResults]
      .sort((a, b) => b.score - a.score)
      .map(
        (t) => `
        <tr>
          <td>${t.name}</td>
          <td>${t.score}/100</td>
          <td style="color:${t.verdict === "keep" ? "green" : t.verdict === "adjust" ? "orange" : "red"}">${t.verdict.toUpperCase()}</td>
          <td>$${t.revenueUsd}</td>
          <td>${t.payingUsers}</td>
        </tr>
      `
      )
      .join("");

    await fetch(RESEND_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "NI System <system@northsideintelligence.com>",
        to: ["jb@northsideventuresgroup.com"],
        subject: `📊 Sector 3 Weekly Eval — ${evalWeek}`,
        html: `
          <h2>Sector 3 Weekly Eval</h2>
          <p>Week of ${evalWeek}</p>
          <table border="1" cellpadding="8" style="border-collapse:collapse;width:100%">
            <thead>
              <tr><th>Tool</th><th>Score</th><th>Verdict</th><th>Revenue</th><th>Paying Users</th></tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
          <hr/>
          <p>Reply with your decisions (keep/adjust/scrap) and the system will update <code>arm3_tool_evals.jb_decision</code> and adjust future build priorities.</p>
          <p style="color:#888;font-size:12px">NI Sector 3 Eval Engine · ${new Date().toISOString()}</p>
        `,
      }),
    });
  }

  return new Response(JSON.stringify({ success: true, evals: evalResults }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});

async function runPatternLearner(
  supabase: SupabaseClient,
  _evalResults: EvalResult[]
): Promise<void> {
  const { data: allEvals } = await supabase
    .from("arm3_tool_evals")
    .select("tool_slug, score, verdict, revenue_usd, paying_users")
    .not("verdict", "eq", "pending");

  if (!allEvals?.length) return;

  const { data: allTools } = await supabase
    .from("arm3_tools")
    .select("slug, category, target_user, price_usd, estimated_margin_pct");

  const toolMap = Object.fromEntries(
    (allTools ?? []).map((t) => [(t as Arm3Tool).slug, t as Arm3Tool])
  );

  const evalRows = allEvals as ToolEvalRow[];
  const winners = evalRows.filter(
    (e) => e.verdict === "keep" && e.score >= 60
  );
  const losers = evalRows.filter((e) => e.verdict === "scrap");

  const signals: PatternSignalInput[] = [];

  const categoryScores: Record<string, number[]> = {};
  for (const e of evalRows) {
    const tool = toolMap[e.tool_slug];
    if (!tool?.category) continue;
    if (!categoryScores[tool.category]) categoryScores[tool.category] = [];
    categoryScores[tool.category].push(e.score);
  }

  for (const [cat, scores] of Object.entries(categoryScores)) {
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    signals.push({
      signal_type: "winning_category",
      value: cat,
      weight: avg / 100,
    });
  }

  const winnerPrices = winners
    .map((e) => Number(toolMap[e.tool_slug]?.price_usd ?? 0))
    .filter(Boolean);

  if (winnerPrices.length) {
    const avgPrice =
      winnerPrices.reduce((a, b) => a + b, 0) / winnerPrices.length;
    signals.push({
      signal_type: "winning_price_range",
      value: `$${Math.round(avgPrice - 5)}–$${Math.round(avgPrice + 5)}/mo`,
      weight: 0.8,
    });
  }

  const scrapCategories = losers
    .map((e) => toolMap[e.tool_slug]?.category)
    .filter((cat): cat is string => Boolean(cat));

  for (const cat of [...new Set(scrapCategories)]) {
    signals.push({
      signal_type: "scrap_pattern",
      value: `Avoid: ${cat}`,
      weight: 0.9,
    });
  }

  for (const signal of signals) {
    await supabase.from("arm3_pattern_signals").upsert(
      { ...signal, updated_at: new Date().toISOString() },
      { onConflict: "signal_type,value" }
    );
  }

  const { data: opportunities } = await supabase
    .from("arm3_opportunities")
    .select("id, notes, estimated_margin_pct, priority_score")
    .is("launched_at", null)
    .eq("status", "approved");

  if (!opportunities?.length) return;

  for (const opp of opportunities) {
    const notes = String(opp.notes ?? "").toLowerCase();
    let boost = 0;

    for (const signal of signals) {
      if (
        signal.signal_type === "winning_category" &&
        notes.includes(signal.value.toLowerCase())
      ) {
        boost += signal.weight * 10;
      }
      if (
        signal.signal_type === "scrap_pattern" &&
        notes.includes(signal.value.toLowerCase())
      ) {
        boost -= signal.weight * 15;
      }
    }

    if (boost !== 0) {
      const currentScore = Number(opp.priority_score ?? 50);
      await supabase
        .from("arm3_opportunities")
        .update({
          priority_score: Math.max(0, Math.min(100, currentScore + boost)),
        })
        .eq("id", opp.id);
    }
  }
}
