import type { ToolHandler } from "../types";

const MATCH_FIT = "https://match-fit.net";

// Calls Match Fit's public, nationwide-only coach search. No location filters by design.
export const handler: ToolHandler = async (_tool, params) => {
  const qs = new URLSearchParams();
  if (typeof params.specialty === "string" && params.specialty.trim()) qs.set("specialty", params.specialty.trim().slice(0, 100));
  const budget = Number(params.max_monthly_budget);
  if (Number.isFinite(budget) && budget > 0) qs.set("max_monthly_budget", String(budget));
  qs.set("limit", "20");

  try {
    const res = await fetch(`${MATCH_FIT}/api/public/trainers/search?${qs}`, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) return { status: "unavailable", message: "Match Fit coach search is not available right now." };
    const body = (await res.json()) as { trainers?: unknown[]; count?: number };
    return {
      status: "ok",
      data: { coaches: body.trainers ?? [], count: body.count ?? 0 },
      message: "Online coaches, nationwide. To book, call mf_book_coach with a coach username.",
    };
  } catch {
    return { status: "unavailable", message: "Match Fit coach search is not available right now." };
  }
};
