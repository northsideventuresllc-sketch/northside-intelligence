import "server-only";

import type { ItReportMetrics } from "@/lib/axon/axon-types";
import { createServiceClient } from "@/lib/supabase/server";

type AiRecommendation = ItReportMetrics["aiRecommendation"];

export interface ToolMetricSnapshot {
  signups: number;
  activeUsers: number;
  payingUsers: number;
  mrrUsd: number;
  churnPct: number;
  usageEvents: number;
  topFeatures: string[];
  aiRecommendation: AiRecommendation;
  rationale: string;
}

function recommend(input: {
  toolName: string;
  periodDays: number;
  payingUsers: number;
  mrrUsd: number;
  churnPct: number;
  usageEvents: number;
  activeUsers: number;
}): Pick<ToolMetricSnapshot, "aiRecommendation" | "rationale"> {
  const { toolName, periodDays, payingUsers, mrrUsd, churnPct, usageEvents, activeUsers } =
    input;

  if (payingUsers >= 20 && churnPct < 8 && mrrUsd >= 200) {
    return {
      aiRecommendation: "keep",
      rationale: `${toolName} shows healthy traction over ${periodDays} days (${payingUsers} paying, $${mrrUsd} MRR, ${churnPct}% churn). Recommend KEEP and lock for 365 days.`,
    };
  }

  if (payingUsers >= 5 || usageEvents >= 50 || activeUsers >= 15) {
    return {
      aiRecommendation: "trial",
      rationale: `${toolName} has early signals but not enough proof after ${periodDays} days (${payingUsers} paying, ${usageEvents} usage events). Recommend TRIAL (+30 days) for another report.`,
    };
  }

  return {
    aiRecommendation: "remove",
    rationale: `${toolName} underperformed over ${periodDays} days (${payingUsers} paying, ${activeUsers} active, $${mrrUsd} MRR). Recommend REMOVE unless strategic reasons override.`,
  };
}

/** Collect toolkit + Sector 3 usage metrics for an IT report card. */
export async function collectToolMetrics(input: {
  toolSlug: string;
  toolName: string;
  periodDays: number;
  priceUsd?: number | null;
}): Promise<ToolMetricSnapshot> {
  const supabase = createServiceClient();
  const since = new Date();
  since.setDate(since.getDate() - input.periodDays);
  const sinceIso = since.toISOString();

  const [{ data: toolkitRows }, { data: conversations }] = await Promise.all([
    supabase
      .from("ni_toolkit")
      .select("user_id, access_type, purchased_at, expires_at")
      .eq("tool_slug", input.toolSlug),
    supabase
      .from("sector3_conversations")
      .select("id, user_id, created_at, updated_at")
      .eq("tool_slug", input.toolSlug)
      .gte("updated_at", sinceIso),
  ]);

  const toolkit = toolkitRows ?? [];
  const convos = conversations ?? [];
  const signups = toolkit.filter(
    (row) => row.purchased_at && new Date(row.purchased_at) >= since
  ).length;

  const payingUsers = toolkit.filter((row) =>
    ["tool_subscription", "lifetime", "ni_plan"].includes(String(row.access_type))
  ).length;

  const activeUsers = new Set(convos.map((c) => c.user_id)).size;

  let usageEvents = convos.length;
  if (convos.length > 0) {
    const ids = convos.map((c) => c.id);
    const { count: messageCount } = await supabase
      .from("sector3_chat_messages")
      .select("id", { count: "exact", head: true })
      .in("conversation_id", ids)
      .gte("created_at", sinceIso);
    usageEvents = Math.max(messageCount ?? 0, convos.length);
  }

  const price = Number(input.priceUsd ?? 15) || 15;
  const subscriptionPayers = toolkit.filter(
    (row) => row.access_type === "tool_subscription"
  ).length;
  const mrrUsd = Math.round(subscriptionPayers * price);

  const expiredInWindow = toolkit.filter(
    (row) => row.expires_at && new Date(row.expires_at) >= since && new Date(row.expires_at) <= new Date()
  ).length;
  const churnBase = Math.max(payingUsers + expiredInWindow, 1);
  const churnPct = Math.round((expiredInWindow / churnBase) * 1000) / 10;

  const topFeatures =
    usageEvents > 0
      ? ["Chat sessions", "Conversation continuity", "Toolkit access"]
      : ["Awaiting usage data"];

  const decision = recommend({
    toolName: input.toolName,
    periodDays: input.periodDays,
    payingUsers,
    mrrUsd,
    churnPct,
    usageEvents,
    activeUsers,
  });

  return {
    signups,
    activeUsers,
    payingUsers,
    mrrUsd,
    churnPct,
    usageEvents,
    topFeatures,
    ...decision,
  };
}

export function toReportMetrics(input: {
  reportType: ItReportMetrics["reportType"];
  toolSlug: string;
  toolName: string;
  periodDays: number;
  snapshot: ToolMetricSnapshot;
}): ItReportMetrics {
  return {
    reportType: input.reportType,
    toolSlug: input.toolSlug,
    toolName: input.toolName,
    periodDays: input.periodDays,
    signups: input.snapshot.signups,
    activeUsers: input.snapshot.activeUsers,
    payingUsers: input.snapshot.payingUsers,
    mrrUsd: input.snapshot.mrrUsd,
    churnPct: input.snapshot.churnPct,
    usageEvents: input.snapshot.usageEvents,
    topFeatures: input.snapshot.topFeatures,
    aiRecommendation: input.snapshot.aiRecommendation,
    rationale: input.snapshot.rationale,
  };
}
