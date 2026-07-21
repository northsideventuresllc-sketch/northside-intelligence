import { resolvePlatformSecret } from "@/lib/platform-secrets";
import { loadActiveSkeletons, saveSkeletonAdaptation } from "./db";

/**
 * 2x/week trend research pass (SerpAPI).
 *
 * One focused query per active product; top organic results are distilled into
 * trend_notes on the skeleton so the content machine + outreach drafts can pull
 * current angles. Also mirrored to NI-Brain Learnings for AXON.
 */
const QUERY_BY_SLUG: Record<string, string> = {
  "match-fit": "personal trainer client acquisition trends what works",
  replyflow: "small business customer service automation trends",
  grantbot: "creator artist grants trends application tips",
  signaldesk: "market signal monitoring tools trends",
  gapscan: "competitive gap analysis SMB trends",
  bridgeai: "SMB AI adoption workflow trends",
  "ni-store": "trending dropship products viral tiktok",
  "ni-services": "SMB AI consulting demand trends workflow automation",
};

interface SerpResult {
  title?: string;
  link?: string;
  snippet?: string;
}

async function serpSearch(query: string, apiKey: string): Promise<SerpResult[]> {
  const url = `https://serpapi.com/search.json?engine=google&num=5&q=${encodeURIComponent(query)}&api_key=${apiKey}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(20000) });
  if (!res.ok) throw new Error(`SerpAPI ${res.status}`);
  const json = (await res.json()) as { organic_results?: SerpResult[] };
  return (json.organic_results ?? []).slice(0, 5);
}

async function mirrorToLearnings(lines: string[]): Promise<void> {
  if (lines.length === 0) return;
  const { createServiceClient } = await import("@/lib/supabase/server");
  const sb = createServiceClient();
  await sb.from("Learnings").insert(
    lines.map((learning) => ({
      learning,
      source: "marketing-trend-research",
      category: "marketing",
      date: new Date().toISOString(),
    }))
  );
}

export async function runTrendResearch(): Promise<{
  researched: string[];
  skipped: string[];
}> {
  const apiKey = await resolvePlatformSecret(
    "SERPAPI_API_KEY",
    process.env.SERPAPI_API_KEY,
    (v) => !v?.trim()
  );
  if (!apiKey) throw new Error("SERPAPI_API_KEY unavailable");

  const skeletons = await loadActiveSkeletons();
  const researched: string[] = [];
  const skipped: string[] = [];
  const learningLines: string[] = [];
  const today = new Date().toISOString().slice(0, 10);

  for (const skeleton of skeletons) {
    const query = QUERY_BY_SLUG[skeleton.product_slug];
    if (!query) {
      skipped.push(skeleton.product_slug);
      continue;
    }

    try {
      const results = await serpSearch(query, apiKey);
      if (results.length === 0) {
        skipped.push(skeleton.product_slug);
        continue;
      }

      const notes = results
        .filter((r) => r.title && r.snippet)
        .map((r) => ({
          date: today,
          note: `${r.title}: ${r.snippet}`.slice(0, 400),
          source_url: r.link,
        }));

      const next = {
        ...skeleton,
        trend_notes: [...skeleton.trend_notes, ...notes],
      };
      await saveSkeletonAdaptation(
        next,
        `trend-research: +${notes.length} notes ("${query}")`,
        "marketing-trend-research"
      );

      learningLines.push(
        `[LEARNED] trend-research ${skeleton.product_slug}: ${notes[0]?.note.slice(0, 180)}`
      );
      researched.push(skeleton.product_slug);
    } catch {
      skipped.push(skeleton.product_slug);
    }
  }

  await mirrorToLearnings(learningLines);
  return { researched, skipped };
}
