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
  const previewUrl = `https://${slug}-preview.vercel.app`;

  const executiveSummary = {
    title: opportunity.name,
    description: opportunity.description ?? "Sector 3 intelligence tool.",
    targetAudience: "Small business owners and solopreneurs (B2B + B2C)",
    subscriptionPriceUsd: 15,
    lifetimeOfferPriceUsd: 120,
    lifetimeOfferNote: "Limited-time permanent purchase offer at launch",
    useCases: [
      opportunity.market_signal ?? "Automate repetitive workflows",
      "Save hours per week on core business tasks",
      "Integrate with NI toolkit and AXON memory",
    ],
    estimatedRevenueEoyUsd: Math.round((opportunity.estimated_margin_pct ?? 80) * 50),
    revenueAssumptions: "Conservative 100 paying subs by EOY at listed price",
    marketingStrategy:
      "NI content machine + founder LinkedIn + toolkit cross-sell + limited launch promo.",
    rolloutPlan:
      "Preview week → JB approval → portal listing → AXON tool skeleton → 90-day performance gate.",
    competitors: ["Generic AI wrappers", "Vertical SaaS incumbents"],
    differentiation:
      "NI-native integration, neurodivergent-friendly UX, and AXON adaptive memory layer.",
    previewUrl,
  };

  await supabase
    .from("arm3_opportunities")
    .update({
      github_repo: githubRepo,
      sector3_slug: slug,
      review_status: "pending_review",
      preview_vercel_url: previewUrl,
      executive_summary: executiveSummary,
    })
    .eq("id", opportunity.id);

  await supabase
    .from("arm3_tools")
    .update({ status: "scaffolded", lifecycle_phase: "preview" })
    .eq("slug", slug);

  const { data: launchRow, error: launchError } = await supabase
    .from("arm3_it_launch_notifications")
    .insert({
      opportunity_id: opportunity.id,
      tool_slug: slug,
      payload: executiveSummary,
      status: "pending",
    })
    .select("id")
    .single();

  if (launchError) {
    console.error("arm3_it_launch_notifications insert failed", launchError);
  }

  const launchId = launchRow?.id ? String(launchRow.id) : `preview-${slug}`;

  const { data: masterProfile } = await supabase
    .from("ni_portal_profiles")
    .select("username")
    .eq("is_master_account", true)
    .not("username", "is", null)
    .limit(1)
    .maybeSingle();

  const operatorId = masterProfile?.username?.trim().toLowerCase();
  if (operatorId) {
    const { data: axonProfile } = await supabase
      .from("axon_operator_profiles")
      .select("context_data")
      .eq("operator_id", operatorId)
      .maybeSingle();

    const contextData = (axonProfile?.context_data ?? {}) as Record<string, unknown>;
    const prefs = (contextData.preferences ?? {}) as Record<string, unknown>;
    const inbox = Array.isArray(prefs.notificationsInbox) ? prefs.notificationsInbox : [];
    const notifId = `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

    const notification = {
      id: notifId,
      source: "ARM3 Pipeline",
      title: `IT Launch Review: ${opportunity.name}`,
      body: "New Sector 3 IT is ready for preview review. Approve to go live on NI Portal.",
      urgent: true,
      read: false,
      created_at: launchedAt,
      itType: "it_launch",
      itPayload: {
        launchId,
        opportunityId: opportunity.id,
        toolSlug: slug,
        summary: executiveSummary,
      },
      links: [{ label: "Open Preview", url: previewUrl }],
    };

    const nextPrefs = {
      ...prefs,
      notificationsInbox: [notification, ...inbox].slice(0, 100),
    };

    await supabase.from("axon_operator_profiles").upsert({
      operator_id: operatorId,
      context_data: { ...contextData, preferences: nextPrefs },
      updated_at: launchedAt,
    });

    if (launchRow?.id) {
      await supabase
        .from("arm3_it_launch_notifications")
        .update({ axon_notification_id: notifId })
        .eq("id", launchRow.id);
    }
  }

  await logArm3Weekly(supabase, {
    logType: "pipeline",
    toolSlug: slug,
    summary: `Tool scaffolded (preview): ${opportunity.name} (${slug})`,
    detail: {
      status: "preview_pending_review",
      run_date: runDate,
      github_repo: githubRepo,
      commit_sha: scaffold.commitSha,
      files_pushed: scaffold.filesPushed,
    },
  });

  return new Response(
    JSON.stringify({
      success: true,
      status: "preview_pending_review",
      tool_slug: slug,
      github_repo: githubRepo,
      run_date: runDate,
    }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
});
