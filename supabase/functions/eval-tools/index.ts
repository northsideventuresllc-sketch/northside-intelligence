import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { readPlatformSecret } from "../_shared/platform-secrets.ts";
import { logArm3Weekly } from "../_shared/arm3-weekly-log.ts";
import { checkVercelProjectDeployed } from "../_shared/vercel-check.ts";
import {
  authorizeServiceRoleRequest,
  createServiceRoleClient,
} from "../_shared/service-role-auth.ts";

interface ScaffoldedTool {
  slug: string;
  name: string;
  created_at: string;
}

interface EvalOutcome {
  slug: string;
  name: string;
  status: "live" | "stale";
  projectExists: boolean;
  isDeployed: boolean;
  deploymentUrl?: string;
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

  const vercelToken = await readPlatformSecret("VERCEL_TOKEN");
  if (!vercelToken) {
    return new Response(
      JSON.stringify({ error: "VERCEL_TOKEN is not configured" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  const supabase = createServiceRoleClient(supabaseUrl, auth.token);
  const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data: tools, error: toolsError } = await supabase
    .from("arm3_tools")
    .select("slug, name, created_at")
    .eq("status", "scaffolded")
    .lt("created_at", cutoff);

  if (toolsError) {
    return new Response(
      JSON.stringify({ error: "Tool query failed", detail: toolsError }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  if (!tools?.length) {
    await logArm3Weekly(supabase, {
      logType: "eval",
      summary: "No scaffolded tools older than 7 days",
      detail: { status: "idle", run_date: runDate },
    });

    return new Response(
      JSON.stringify({ success: true, evals: [], status: "idle" }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }

  const outcomes: EvalOutcome[] = [];

  for (const tool of tools as ScaffoldedTool[]) {
    let deployStatus;
    try {
      deployStatus = await checkVercelProjectDeployed(vercelToken, tool.slug);
    } catch (error) {
      await logArm3Weekly(supabase, {
        logType: "eval",
        toolSlug: tool.slug,
        summary: `Vercel check failed for ${tool.slug}`,
        detail: {
          status: "error",
          run_date: runDate,
          error: error instanceof Error ? error.message : String(error),
        },
        actionRequired: true,
        actionFor: "JB",
      });
      continue;
    }

    const nextStatus = deployStatus.isDeployed ? "live" : "stale";

    const { error: updateError } = await supabase
      .from("arm3_tools")
      .update({ status: nextStatus })
      .eq("slug", tool.slug);

    if (updateError) {
      continue;
    }

    if (nextStatus === "live" && deployStatus.deploymentUrl) {
      await supabase
        .from("arm3_opportunities")
        .update({ vercel_url: deployStatus.deploymentUrl })
        .eq("sector3_slug", tool.slug);
    }

    await logArm3Weekly(supabase, {
      logType: "eval",
      toolSlug: tool.slug,
      summary: `${tool.name}: ${nextStatus.toUpperCase()} (project exists: ${deployStatus.projectExists}, deployed: ${deployStatus.isDeployed})`,
      detail: {
        status: nextStatus,
        run_date: runDate,
        project_exists: deployStatus.projectExists,
        is_deployed: deployStatus.isDeployed,
        deployment_url: deployStatus.deploymentUrl ?? null,
        created_at: tool.created_at,
      },
      actionRequired: nextStatus === "stale",
      actionFor: nextStatus === "stale" ? "JB" : null,
    });

    outcomes.push({
      slug: tool.slug,
      name: tool.name,
      status: nextStatus,
      projectExists: deployStatus.projectExists,
      isDeployed: deployStatus.isDeployed,
      deploymentUrl: deployStatus.deploymentUrl,
    });
  }

  return new Response(JSON.stringify({ success: true, evals: outcomes }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
