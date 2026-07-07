import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { readPlatformSecret } from "../_shared/platform-secrets.ts";
import { logArm3Weekly } from "../_shared/arm3-weekly-log.ts";
import { scaffoldSector3Repo } from "../_shared/github-scaffold.ts";
import {
  authorizeServiceRoleRequest,
  createServiceRoleClient,
} from "../_shared/service-role-auth.ts";

interface Arm3Opportunity {
  id: number;
  name: string;
  description: string | null;
  sector3_slug: string | null;
  estimated_margin_pct: number | null;
  market_signal: string | null;
}

function deriveSlug(opportunity: Arm3Opportunity): string {
  if (opportunity.sector3_slug?.trim()) {
    return opportunity.sector3_slug.trim().toLowerCase();
  }
  return opportunity.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 32);
}

Deno.serve(async (req) => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const runDate = new Date().toISOString();

  if (!supabaseUrl) {
    return new Response(
      JSON.stringify({ error: "Missing Supabase configuration" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  const auth = await authorizeServiceRoleRequest(
    supabaseUrl,
    req.headers.get("Authorization")
  );
  if (!auth.ok) {
    return new Response("Unauthorized", { status: 401 });
  }

  const supabase = createServiceRoleClient(supabaseUrl, auth.token);

  const { data: opportunity, error: oppError } = await supabase
    .from("arm3_opportunities")
    .select("id, name, description, sector3_slug, estimated_margin_pct, market_signal")
    .eq("status", "approved")
    .is("launched_at", null)
    .order("priority_score", { ascending: false })
    .limit(1)
    .maybeSingle<Arm3Opportunity>();

  if (oppError) {
    return new Response(
      JSON.stringify({ error: "Opportunity query failed", detail: oppError }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  if (!opportunity) {
    await logArm3Weekly(supabase, {
      logType: "pipeline",
      summary: "no approved tools",
      detail: { status: "idle", run_date: runDate },
    });

    return new Response(
      JSON.stringify({ success: true, status: "no_approved_tools" }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }

  const slug = deriveSlug(opportunity);
  const githubPat = await readPlatformSecret("GITHUB_PAT");

  if (!githubPat) {
    return new Response(
      JSON.stringify({ error: "GITHUB_PAT is not configured" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  const { error: toolInsertError } = await supabase.from("arm3_tools").insert({
    slug,
    name: opportunity.name,
    description: opportunity.description,
    status: "building",
    source_opportunity_id: opportunity.id,
    demand_signal: opportunity.market_signal,
    estimated_margin_pct: opportunity.estimated_margin_pct,
    pricing_model: "freemium",
    price_usd: 15,
  });

  if (toolInsertError) {
    return new Response(
      JSON.stringify({
        error: "Failed to insert arm3_tools",
        detail: toolInsertError,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  let scaffold;
  try {
    scaffold = await scaffoldSector3Repo(githubPat, {
      slug,
      displayName: opportunity.name,
      description: opportunity.description,
    });
  } catch (error) {
    await supabase.from("arm3_tools").update({ status: "failed" }).eq("slug", slug);

    await logArm3Weekly(supabase, {
      logType: "pipeline",
      toolSlug: slug,
      summary: `scaffold failed: ${error instanceof Error ? error.message : "unknown error"}`,
      detail: {
        status: "failed",
        run_date: runDate,
        opportunity_id: opportunity.id,
      },
      actionRequired: true,
      actionFor: "JB",
    });

    return new Response(
      JSON.stringify({
        error: "GitHub scaffold failed",
        detail: error instanceof Error ? error.message : String(error),
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  const launchedAt = new Date().toISOString();
  const githubRepo = scaffold.repoFullName;

  await supabase
    .from("arm3_opportunities")
    .update({
      launched_at: launchedAt,
      github_repo: githubRepo,
      sector3_slug: slug,
    })
    .eq("id", opportunity.id);

  await supabase
    .from("arm3_tools")
    .update({ status: "scaffolded" })
    .eq("slug", slug);

  await logArm3Weekly(supabase, {
    logType: "pipeline",
    toolSlug: slug,
    summary: `Tool scaffolded: ${opportunity.name} (${slug})`,
    detail: {
      status: "scaffolded",
      run_date: runDate,
      github_repo: githubRepo,
      commit_sha: scaffold.commitSha,
      files_pushed: scaffold.filesPushed,
    },
  });

  return new Response(
    JSON.stringify({
      success: true,
      status: "scaffolded",
      tool_slug: slug,
      github_repo: githubRepo,
      run_date: runDate,
    }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
});
