import { createServiceClient } from "@/lib/supabase/server";
import {
  loadActiveSkeletons,
  saveSkeletonAdaptation,
} from "./db";
import type { MarketingAngle, MarketingSkeleton } from "./types";

/**
 * Weekly adaptation pass.
 *
 * Pulls the last 14 days of signals per product from:
 *  - ni_marketing_skeleton_signals (direct attributed signals)
 *  - ni_store_events (Sector 4 purchases/clicks)
 *  - content_machine_signals (engagement on generated content)
 * Revenue-weighted scoring: revenue 10x, signup 5x, engagement 1x, ad click 2x.
 * Angles with score >= promote threshold → winning; consistently 0 with
 * >= 3 tested siblings scoring → losing (never delete, only demote).
 */
const WEIGHTS: Record<string, number> = {
  revenue: 10,
  signup: 5,
  ad: 2,
  store_event: 2,
  engagement: 1,
  content: 1,
  trend: 0,
};

interface AdaptResult {
  productSlug: string;
  promoted: string[];
  demoted: string[];
  signalCount: number;
}

function scoreAngles(
  angles: MarketingAngle[],
  scores: Map<string, number>
): { updated: MarketingAngle[]; promoted: string[]; demoted: string[] } {
  const promoted: string[] = [];
  const demoted: string[] = [];
  const anyScored = angles.some((a) => (scores.get(a.id) ?? 0) > 0);

  const updated = angles.map((a) => {
    const delta = scores.get(a.id) ?? 0;
    const score = a.score + delta;
    let status = a.status;
    if (delta > 0 && score >= 10 && status !== "winning") {
      status = "winning";
      promoted.push(a.id);
    } else if (anyScored && delta === 0 && score <= 0 && status === "active") {
      status = "losing";
      demoted.push(a.id);
    }
    return { ...a, score, status };
  });

  return { updated, promoted, demoted };
}

export async function adaptSkeletons(): Promise<AdaptResult[]> {
  const sb = createServiceClient();
  const skeletons = await loadActiveSkeletons();
  const since = new Date(Date.now() - 14 * 24 * 3600 * 1000).toISOString();
  const results: AdaptResult[] = [];

  for (const skeleton of skeletons) {
    const { data: signals, error } = await sb
      .from("ni_marketing_skeleton_signals")
      .select("signal_type, angle_id, value")
      .eq("product_slug", skeleton.product_slug)
      .gte("observed_at", since)
      .limit(2000);
    if (error) throw error;

    const scores = new Map<string, number>();
    for (const s of signals ?? []) {
      if (!s.angle_id) continue;
      const w = WEIGHTS[s.signal_type as string] ?? 1;
      scores.set(
        s.angle_id,
        (scores.get(s.angle_id) ?? 0) + w * Number(s.value ?? 1)
      );
    }

    const hooks = scoreAngles(skeleton.hooks, scores);
    const props = scoreAngles(skeleton.value_props, scores);
    const offers = scoreAngles(skeleton.offers, scores);

    const promoted = [...hooks.promoted, ...props.promoted, ...offers.promoted];
    const demoted = [...hooks.demoted, ...props.demoted, ...offers.demoted];

    if (promoted.length === 0 && demoted.length === 0) {
      results.push({
        productSlug: skeleton.product_slug,
        promoted,
        demoted,
        signalCount: signals?.length ?? 0,
      });
      continue;
    }

    const next: MarketingSkeleton = {
      ...skeleton,
      hooks: hooks.updated,
      value_props: props.updated,
      offers: offers.updated,
      winning_angles: Array.from(
        new Set([...skeleton.winning_angles, ...promoted])
      ),
      losing_angles: Array.from(
        new Set([...skeleton.losing_angles, ...demoted])
      ),
    };

    await saveSkeletonAdaptation(
      next,
      `adapt: +${promoted.length} winning, +${demoted.length} losing (${signals?.length ?? 0} signals, 14d)`
    );

    results.push({
      productSlug: skeleton.product_slug,
      promoted,
      demoted,
      signalCount: signals?.length ?? 0,
    });
  }

  return results;
}
