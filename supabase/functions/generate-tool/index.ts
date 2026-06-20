import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { readPlatformSecret } from "../_shared/platform-secrets.ts";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const RESEND_API_URL = "https://api.resend.com/emails";

interface Arm3Opportunity {
  id: number;
  name: string;
  description: string | null;
  market_signal: string | null;
  estimated_margin_pct: number | null;
  build_complexity: string | null;
}

interface PatternSignal {
  signal_type: string;
  value: string;
  weight: number | null;
}

interface ToolSpec {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  core_feature: string;
  input_type: string;
  output_type: string;
  tone_options: string[];
  free_tier_cap: string;
  supabase_table: string;
  subdomain: string;
  github_repo: string;
  category: string;
  target_user: string;
  cursor_build_priority: string[];
}

function isToolSpec(value: unknown): value is ToolSpec {
  if (!value || typeof value !== "object") return false;
  const spec = value as Record<string, unknown>;
  return (
    typeof spec.slug === "string" &&
    typeof spec.name === "string" &&
    typeof spec.description === "string" &&
    typeof spec.category === "string" &&
    typeof spec.target_user === "string"
  );
}

Deno.serve(async (req) => {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response("Unauthorized", { status: 401 });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    return new Response(
      JSON.stringify({ error: "Missing Supabase configuration" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  const anthropicApiKey = await readPlatformSecret("ANTHROPIC_API_KEY");

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const { data: opportunity, error: oppError } = await supabase
    .from("arm3_opportunities")
    .select("*")
    .eq("status", "approved")
    .is("launched_at", null)
    .order("priority_score", { ascending: false })
    .limit(1)
    .single<Arm3Opportunity>();

  if (oppError || !opportunity) {
    return new Response(
      JSON.stringify({
        error: "No approved opportunities found",
        detail: oppError,
      }),
      { status: 404, headers: { "Content-Type": "application/json" } }
    );
  }

  const { data: patterns } = await supabase
    .from("arm3_pattern_signals")
    .select("signal_type, value, weight")
    .order("weight", { ascending: false })
    .limit(10);

  const patternContext =
    patterns && patterns.length > 0
      ? `\n\nLearned patterns from past tools:\n${(patterns as PatternSignal[])
          .map((p) => `- [${p.signal_type}] ${p.value}`)
          .join("\n")}`
      : "";

  if (!anthropicApiKey) {
    return new Response(
      JSON.stringify({ error: "ANTHROPIC_API_KEY is not configured" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  const claudeRes = await fetch(ANTHROPIC_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": anthropicApiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 1000,
      messages: [
        {
          role: "user",
          content: `You are the autonomous tool generator for NORTHSiDE Intelligence (NI) Sector 3.

Generate a complete tool spec for the following opportunity:

Name: ${opportunity.name}
Description: ${opportunity.description ?? ""}
Market signal: ${opportunity.market_signal ?? ""}
Target user: ${opportunity.name}
Estimated margin: ${opportunity.estimated_margin_pct ?? 0}%
Build complexity: ${opportunity.build_complexity ?? "unknown"}
${patternContext}

RULES:
- The tool must follow the NI Sector 3 template (Next.js, Supabase, Stripe, Claude AI, Vercel)
- Auth: shared NI portal account (northsideintelligence.com/auth)
- Supabase table prefix: use the tool slug (e.g. outreachhq_profiles)
- Pricing: free tier (capped) + $15/mo subscription + $99 lifetime option
- The tool name must be marketable as a standalone product — short, punchy, no generic AI names
- If the suggested name can be improved for marketability, suggest a better one

Respond ONLY in this JSON format (no markdown, no explanation):
{
  "slug": "lowercase-no-spaces",
  "name": "Product Name",
  "tagline": "One sentence. Punchy. Benefit-first.",
  "description": "2-3 sentences on what it does and who it's for.",
  "core_feature": "The single main thing the AI does",
  "input_type": "What the user pastes or enters",
  "output_type": "What the tool generates",
  "tone_options": ["option1", "option2", "option3"],
  "free_tier_cap": "e.g. 10 uses/month",
  "supabase_table": "slug_profiles",
  "subdomain": "slug.northsideintelligence.com",
  "github_repo": "northsideventuresllc-sketch/slug",
  "category": "Automation | Intelligence | Productivity | Orchestration",
  "target_user": "Who this is built for",
  "cursor_build_priority": ["task1", "task2", "task3"]
}`,
        },
      ],
    }),
  });

  if (!claudeRes.ok) {
    return new Response(
      JSON.stringify({ error: "Claude API failed", status: claudeRes.status }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  const claudeData = (await claudeRes.json()) as {
    content?: Array<{ text?: string }>;
  };
  const rawText = claudeData.content?.[0]?.text ?? "";

  let toolSpec: ToolSpec;
  try {
    const parsed: unknown = JSON.parse(rawText);
    if (!isToolSpec(parsed)) {
      throw new Error("Invalid tool spec shape");
    }
    toolSpec = parsed;
  } catch {
    return new Response(
      JSON.stringify({ error: "Failed to parse Claude response", raw: rawText }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  const { error: toolError } = await supabase.from("arm3_tools").upsert(
    {
      name: toolSpec.name,
      slug: toolSpec.slug,
      description: toolSpec.description,
      status: "building",
      category: toolSpec.category,
      target_user: toolSpec.target_user,
      pricing_model: "freemium",
      price_usd: 15,
      estimated_margin_pct: opportunity.estimated_margin_pct,
      demand_signal: opportunity.market_signal,
      notes: JSON.stringify(toolSpec),
    },
    { onConflict: "slug" }
  );

  if (toolError) {
    return new Response(
      JSON.stringify({ error: "Failed to write arm3_tools", detail: toolError }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  await supabase.from("Learnings").insert({
    learning: `[SECTOR3] Tool queued for build: ${toolSpec.name} (${toolSpec.slug}). Opportunity: ${opportunity.name}.`,
    source: "sector3-generator",
    category: "STACK",
    project: "NI Sector 3",
  });

  const resendKey = await readPlatformSecret("RESEND_API_KEY");
  if (resendKey) {
    const buildTasks = toolSpec.cursor_build_priority
      .map((task) => `<li>${task}</li>`)
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
        subject: `🚀 New Sector 3 Tool Queued: ${toolSpec.name}`,
        html: `
          <h2>${toolSpec.name}</h2>
          <p><strong>Tagline:</strong> ${toolSpec.tagline}</p>
          <p><strong>Description:</strong> ${toolSpec.description}</p>
          <p><strong>Core feature:</strong> ${toolSpec.core_feature}</p>
          <p><strong>Target user:</strong> ${toolSpec.target_user}</p>
          <p><strong>Free tier cap:</strong> ${toolSpec.free_tier_cap}</p>
          <p><strong>Subdomain:</strong> ${toolSpec.subdomain}</p>
          <p><strong>GitHub repo to create:</strong> ${toolSpec.github_repo}</p>
          <hr/>
          <p><strong>Next Cursor build tasks:</strong></p>
          <ol>${buildTasks}</ol>
          <hr/>
          <p style="color:#888;font-size:12px">Sent by NI Sector 3 autonomous pipeline · ${new Date().toISOString()}</p>
        `,
      }),
    });
  }

  await supabase
    .from("arm3_opportunities")
    .update({ launched_at: new Date().toISOString() })
    .eq("id", opportunity.id);

  return new Response(JSON.stringify({ success: true, tool: toolSpec }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
