import { createServiceClient } from "@/lib/supabase/server";
import type {
  MarketingSkeleton,
  MarketingAngle,
  SkeletonSignalType,
} from "./types";

function arr<T>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : [];
}

function rowToSkeleton(data: Record<string, unknown>): MarketingSkeleton {
  return {
    id: data.id as string,
    product_slug: data.product_slug as string,
    sector: data.sector as string,
    brand: (data.brand as MarketingSkeleton["brand"]) ?? "ni",
    version: (data.version as number) ?? 1,
    status: (data.status as MarketingSkeleton["status"]) ?? "active",
    value_props: arr<MarketingAngle>(data.value_props),
    hooks: arr<MarketingAngle>(data.hooks),
    channels: arr(data.channels),
    audiences: arr<MarketingAngle>(data.audiences),
    offers: arr<MarketingAngle>(data.offers),
    winning_angles: arr<string>(data.winning_angles),
    losing_angles: arr<string>(data.losing_angles),
    trend_notes: arr(data.trend_notes),
    goals: (data.goals as MarketingSkeleton["goals"]) ?? {},
    last_adapted_at: (data.last_adapted_at as string) ?? null,
    last_research_at: (data.last_research_at as string) ?? null,
  };
}

export async function loadSkeleton(
  productSlug: string
): Promise<MarketingSkeleton | null> {
  const sb = createServiceClient();
  const { data, error } = await sb
    .from("ni_marketing_skeletons")
    .select("*")
    .eq("product_slug", productSlug)
    .maybeSingle();
  if (error) throw error;
  return data ? rowToSkeleton(data) : null;
}

export async function loadActiveSkeletons(): Promise<MarketingSkeleton[]> {
  const sb = createServiceClient();
  const { data, error } = await sb
    .from("ni_marketing_skeletons")
    .select("*")
    .eq("status", "active");
  if (error) throw error;
  return (data ?? []).map(rowToSkeleton);
}

/** Persist skeleton mutation: bumps version + writes append-only history row. */
export async function saveSkeletonAdaptation(
  skeleton: MarketingSkeleton,
  changeSummary: string,
  changedBy = "marketing-skeleton-adapt"
): Promise<void> {
  const sb = createServiceClient();
  const nextVersion = skeleton.version + 1;

  const { error: updateError } = await sb
    .from("ni_marketing_skeletons")
    .update({
      version: nextVersion,
      value_props: skeleton.value_props,
      hooks: skeleton.hooks,
      channels: skeleton.channels,
      audiences: skeleton.audiences,
      offers: skeleton.offers,
      winning_angles: skeleton.winning_angles,
      losing_angles: skeleton.losing_angles,
      trend_notes: skeleton.trend_notes.slice(-30),
      last_adapted_at:
        changedBy === "marketing-skeleton-adapt"
          ? new Date().toISOString()
          : skeleton.last_adapted_at,
      last_research_at:
        changedBy === "marketing-trend-research"
          ? new Date().toISOString()
          : skeleton.last_research_at,
      updated_at: new Date().toISOString(),
    })
    .eq("product_slug", skeleton.product_slug);
  if (updateError) throw updateError;

  const { error: historyError } = await sb
    .from("ni_marketing_skeleton_history")
    .insert({
      product_slug: skeleton.product_slug,
      version: nextVersion,
      change_summary: changeSummary,
      changed_by: changedBy,
      snapshot: {
        value_props: skeleton.value_props,
        hooks: skeleton.hooks,
        winning_angles: skeleton.winning_angles,
        losing_angles: skeleton.losing_angles,
      },
    });
  if (historyError) throw historyError;
}

/** Record an attributable marketing signal (revenue, signup, engagement…). */
export async function recordSkeletonSignal(args: {
  productSlug: string;
  signalType: SkeletonSignalType;
  angleId?: string;
  value?: number;
  detail?: Record<string, unknown>;
}): Promise<void> {
  const sb = createServiceClient();
  const { error } = await sb.from("ni_marketing_skeleton_signals").insert({
    product_slug: args.productSlug,
    signal_type: args.signalType,
    angle_id: args.angleId ?? null,
    value: args.value ?? 1,
    detail: args.detail ?? {},
  });
  if (error) throw error;
}
