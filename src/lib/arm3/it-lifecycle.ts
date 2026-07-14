import "server-only";

import type { ItExecutiveSummary } from "@/lib/axon/axon-types";
import { addNotification } from "@/lib/axon/axon-preferences";
import { resolveMasterOperatorId } from "@/lib/axon/master-operator";
import { parseReportToolSlug } from "@/lib/arm3/it-report-id";
import { scheduleSubscriberCutoff } from "@/lib/arm3/it-removal";
import { createServiceClient } from "@/lib/supabase/server";

export { parseReportToolSlug } from "@/lib/arm3/it-report-id";

type JbDecision = "keep" | "adjust" | "scrap";

async function recordJbDecision(
  toolSlug: string,
  decision: JbDecision,
  notes: string
): Promise<void> {
  const supabase = createServiceClient();
  const evalWeek = new Date().toISOString().slice(0, 10);

  const { data: existing } = await supabase
    .from("arm3_tool_evals")
    .select("id")
    .eq("tool_slug", toolSlug)
    .eq("eval_week", evalWeek)
    .maybeSingle();

  if (existing?.id) {
    await supabase
      .from("arm3_tool_evals")
      .update({
        jb_decision: decision,
        verdict: decision === "scrap" ? "scrap" : decision === "keep" ? "keep" : "adjust",
        notes,
      })
      .eq("id", existing.id);
    return;
  }

  await supabase.from("arm3_tool_evals").insert({
    tool_slug: toolSlug,
    eval_week: evalWeek,
    jb_decision: decision,
    verdict: decision === "scrap" ? "scrap" : decision === "keep" ? "keep" : "adjust",
    notes,
  });
}

export function buildExecutiveSummaryFromOpportunity(input: {
  name: string;
  description: string | null;
  market_signal: string | null;
  estimated_margin_pct: number | null;
  previewUrl: string;
}): ItExecutiveSummary {
  const monthly = 15;
  return {
    title: input.name,
    description: input.description ?? "Sector 3 intelligence tool.",
    targetAudience: "Small business owners and solopreneurs (B2B + B2C)",
    subscriptionPriceUsd: monthly,
    lifetimeOfferPriceUsd: Math.round(monthly * 8),
    lifetimeOfferNote: "Limited-time permanent purchase offer at launch",
    useCases: [
      input.market_signal ?? "Automate repetitive workflows",
      "Save hours per week on core business tasks",
      "Integrate with NI toolkit and AXON memory",
    ],
    estimatedRevenueEoyUsd: Math.round((input.estimated_margin_pct ?? 80) * 50),
    revenueAssumptions: "Conservative 100 paying subs by EOY at listed price",
    marketingStrategy:
      "NI content machine + founder LinkedIn + toolkit cross-sell + limited launch promo.",
    rolloutPlan:
      "Preview week → JB approval → portal listing → AXON tool skeleton → 90-day performance gate.",
    competitors: ["Generic AI wrappers", "Vertical SaaS incumbents"],
    differentiation:
      "NI-native integration, neurodivergent-friendly UX, and AXON adaptive memory layer.",
    previewUrl: input.previewUrl,
  };
}

export async function pushItLaunchNotification(input: {
  launchId: string;
  opportunityId: number;
  toolSlug: string;
  summary: ItExecutiveSummary;
}) {
  const operatorId = await resolveMasterOperatorId();
  if (!operatorId) return null;

  return addNotification(
    {
      source: "ARM3 Pipeline",
      title: `IT Launch Review: ${input.summary.title}`,
      body: "New Sector 3 IT is ready for preview review. Approve to go live on NI Portal.",
      urgent: true,
      itType: "it_launch",
      itPayload: {
        launchId: input.launchId,
        opportunityId: input.opportunityId,
        toolSlug: input.toolSlug,
        summary: input.summary,
      },
      links: [{ label: "Open Preview", url: input.summary.previewUrl }],
    },
    operatorId
  );
}

export async function pushItReportNotification(input: {
  reportId: string;
  metrics: import("@/lib/axon/axon-types").ItReportMetrics;
}) {
  const operatorId = await resolveMasterOperatorId();
  if (!operatorId) return null;

  const label =
    input.metrics.reportType === "archive_revival"
      ? "Archive Revival Candidate"
      : input.metrics.reportType === "trial_extension"
        ? "Trial Extension Report"
        : "90-Day IT Report";

  return addNotification(
    {
      source: "ARM3 Pipeline",
      title: `${label}: ${input.metrics.toolName}`,
      body: input.metrics.rationale,
      urgent: false,
      itType: "it_report",
      itPayload: {
        reportId: input.reportId,
        metrics: input.metrics,
      },
    },
    operatorId
  );
}

export async function approveItLaunch(launchId: string, operatorId: string) {
  const supabase = createServiceClient();
  const launchIdNum = Number(launchId.replace(/\D/g, "")) || Number(launchId);

  const { data: launch, error } = await supabase
    .from("arm3_it_launch_notifications")
    .select("id, opportunity_id, tool_slug, status")
    .eq("id", launchIdNum)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!launch || launch.status === "approved") {
    return { ok: true, already: true };
  }

  const now = new Date().toISOString();

  await supabase
    .from("arm3_it_launch_notifications")
    .update({ status: "approved", updated_at: now })
    .eq("id", launch.id);

  await supabase
    .from("arm3_opportunities")
    .update({ review_status: "approved", launched_at: now })
    .eq("id", launch.opportunity_id);

  await supabase
    .from("arm3_tools")
    .update({
      status: "live",
      lifecycle_phase: "production",
      production_launched_at: now,
      axon_build_ready: true,
    })
    .eq("slug", launch.tool_slug);

  const { data: masters } = await supabase
    .from("ni_portal_profiles")
    .select("id")
    .eq("is_master_account", true);

  for (const master of masters ?? []) {
    const { error: tkError } = await supabase.from("ni_toolkit").upsert(
      {
        user_id: master.id,
        tool_slug: launch.tool_slug,
        access_type: "lifetime",
        expires_at: null,
        purchased_at: now,
        updated_at: now,
      },
      { onConflict: "user_id,tool_slug" }
    );
    if (tkError) throw new Error(tkError.message);
  }

  return { ok: true, toolSlug: launch.tool_slug, operatorId };
}

export async function denyItLaunch(launchId: string) {
  const supabase = createServiceClient();
  const launchIdNum = Number(launchId.replace(/\D/g, "")) || Number(launchId);

  const { data: launch } = await supabase
    .from("arm3_it_launch_notifications")
    .select("id, opportunity_id, tool_slug")
    .eq("id", launchIdNum)
    .maybeSingle();

  if (!launch) return { ok: false, error: "not_found" };

  const now = new Date().toISOString();
  await supabase
    .from("arm3_it_launch_notifications")
    .update({ status: "denied", updated_at: now })
    .eq("id", launch.id);

  await supabase
    .from("arm3_opportunities")
    .update({ review_status: "denied" })
    .eq("id", launch.opportunity_id);

  await supabase
    .from("arm3_tools")
    .update({ lifecycle_phase: "archived", status: "scrapped" })
    .eq("slug", launch.tool_slug);

  return { ok: true };
}

export async function keepItReport(reportId: string, toolSlug?: string) {
  const supabase = createServiceClient();
  const slug = (toolSlug?.trim() || parseReportToolSlug(reportId)).toLowerCase();
  const lockUntil = new Date();
  lockUntil.setDate(lockUntil.getDate() + 365);

  const { data: tool } = await supabase
    .from("arm3_tools")
    .select("slug")
    .eq("slug", slug)
    .maybeSingle();
  if (!tool) return { ok: false, error: "not_found" };

  await supabase
    .from("arm3_tools")
    .update({
      lifecycle_phase: "production",
      lifecycle_locked_until: lockUntil.toISOString(),
      trial_extension_until: null,
      removal_scheduled_at: null,
      status: "live",
    })
    .eq("slug", slug);

  await recordJbDecision(slug, "keep", "KEEP — locked 365 days");

  return { ok: true, lockedUntil: lockUntil.toISOString(), toolSlug: slug };
}

export async function trialItReport(reportId: string, days = 30, toolSlug?: string) {
  const supabase = createServiceClient();
  const slug = (toolSlug?.trim() || parseReportToolSlug(reportId)).toLowerCase();
  const until = new Date();
  until.setDate(until.getDate() + days);

  const { data: tool } = await supabase
    .from("arm3_tools")
    .select("slug")
    .eq("slug", slug)
    .maybeSingle();
  if (!tool) return { ok: false, error: "not_found" };

  await supabase
    .from("arm3_tools")
    .update({
      trial_extension_until: until.toISOString(),
      lifecycle_phase: "trial",
      lifecycle_locked_until: null,
      status: "live",
    })
    .eq("slug", slug);

  await recordJbDecision(slug, "adjust", `TRIAL extension +${days} days`);

  return { ok: true, trialUntil: until.toISOString(), toolSlug: slug };
}

export async function removeItReport(reportId: string, toolSlug?: string) {
  const supabase = createServiceClient();
  const slug = (toolSlug?.trim() || parseReportToolSlug(reportId)).toLowerCase();

  const { data: tool } = await supabase
    .from("arm3_tools")
    .select("slug, name, description, status, lifecycle_locked_until, price_usd")
    .eq("slug", slug)
    .maybeSingle();

  if (!tool) return { ok: false, error: "not_found" };

  if (tool.lifecycle_locked_until && new Date(tool.lifecycle_locked_until) > new Date()) {
    return {
      ok: false,
      error: "locked_until_expires",
      lockedUntil: tool.lifecycle_locked_until,
    };
  }

  const now = new Date().toISOString();
  await supabase.from("arm3_archived_tools").upsert(
    {
      tool_slug: tool.slug,
      name: tool.name,
      description: tool.description,
      snapshot: tool,
      removed_at: now,
      revival_eligible: true,
    },
    { onConflict: "tool_slug" }
  );

  await supabase
    .from("arm3_tools")
    .update({
      lifecycle_phase: "archived",
      status: "scrapped",
      removal_scheduled_at: now,
      lifecycle_locked_until: null,
      trial_extension_until: null,
    })
    .eq("slug", slug);

  const cutoff = await scheduleSubscriberCutoff(slug);
  await recordJbDecision(
    slug,
    "scrap",
    `REMOVE — subscriber cutoff scheduled (${cutoff.scheduled} delayed, ${cutoff.revokedImmediate} immediate)`
  );

  return { ok: true, archived: tool.slug, cutoff };
}

export async function reviveArchivedTool(slug: string, trialDays: 30 | 90) {
  const supabase = createServiceClient();
  const until = new Date();
  until.setDate(until.getDate() + trialDays);
  const now = new Date().toISOString();
  const normalized = slug.trim().toLowerCase();

  const { data: archived } = await supabase
    .from("arm3_archived_tools")
    .select("tool_slug, name")
    .eq("tool_slug", normalized)
    .maybeSingle();

  if (!archived) return { ok: false, error: "not_found" };

  await supabase
    .from("arm3_tools")
    .update({
      lifecycle_phase: "trial",
      status: "live",
      trial_extension_until: until.toISOString(),
      removal_scheduled_at: null,
      lifecycle_locked_until: null,
    })
    .eq("slug", normalized);

  await supabase.from("arm3_archived_tools").delete().eq("tool_slug", normalized);

  const { data: masters } = await supabase
    .from("ni_portal_profiles")
    .select("id")
    .eq("is_master_account", true);

  for (const master of masters ?? []) {
    await supabase.from("ni_toolkit").upsert(
      {
        user_id: master.id,
        tool_slug: normalized,
        access_type: "lifetime",
        expires_at: null,
        purchased_at: now,
        updated_at: now,
      },
      { onConflict: "user_id,tool_slug" }
    );
  }

  return { ok: true, trialUntil: until.toISOString(), toolSlug: normalized };
}
