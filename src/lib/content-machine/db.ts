import { randomUUID } from "node:crypto";
import { createServiceClient } from "@/lib/supabase/server";
import { WEEKDAY_THEMES } from "./weekday-themes";
import type { BrandProfile, ContentPost, FewShot, ToneRule } from "./types";

function parseJsonArray<T>(value: unknown, fallback: T[]): T[] {
  if (Array.isArray(value)) return value as T[];
  return fallback;
}

export async function loadBrandProfile(slug: string): Promise<BrandProfile | null> {
  const sb = createServiceClient();
  const { data, error } = await sb
    .from("content_machine_brand_profiles")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return {
    id: data.id,
    slug: data.slug,
    name: data.name,
    venture: data.venture,
    voice_rules: parseJsonArray(data.voice_rules, []),
    banned_phrases: parseJsonArray(data.banned_phrases, []),
    cta_paths: (data.cta_paths as Record<string, string>) ?? {},
    brand_colors: (data.brand_colors as BrandProfile["brand_colors"]) ?? {
      dark: "#07080C",
      accent: "#FF7E00",
    },
    skeleton: parseJsonArray(data.skeleton, WEEKDAY_THEMES),
  };
}

export async function loadToneRules(brandSlug: string): Promise<ToneRule[]> {
  const sb = createServiceClient();
  const { data, error } = await sb
    .from("content_machine_tone_rules")
    .select("*")
    .eq("brand_slug", brandSlug)
    .eq("active", true)
    .order("weight", { ascending: false })
    .limit(20);

  if (error) throw error;
  return (data ?? []) as ToneRule[];
}

export async function loadFewShots(args: {
  brandSlug: string;
  postType: string;
  targetGroup: string;
}): Promise<FewShot | null> {
  const sb = createServiceClient();
  const { data, error } = await sb
    .from("content_machine_few_shots")
    .select("*")
    .eq("brand_slug", args.brandSlug)
    .eq("post_type", args.postType)
    .eq("target_group", args.targetGroup)
    .eq("active", true)
    .order("approved_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return {
    id: data.id,
    brand_slug: data.brand_slug,
    post_type: data.post_type,
    target_group: data.target_group,
    platform: data.platform,
    caption: data.caption,
    visual_prompt: data.visual_prompt,
    hashtags: parseJsonArray(data.hashtags, []),
  };
}

export async function loadRecentLearnings(limit = 3): Promise<string[]> {
  const sb = createServiceClient();
  const since = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await sb
    .from("Learnings")
    .select("learning")
    .gte("date", since)
    .order("date", { ascending: false })
    .limit(limit);

  if (error) return [];
  return (data ?? []).map((r) => r.learning as string).filter(Boolean);
}

/**
 * CM7-D8-CHUNK (2026-08-31): precheck for generateBatchSlot() so a resumed/rerun
 * invocation doesn't spend an LLM call regenerating a slot that already landed.
 * Best-effort only — NOT the source of correctness against duplicates. For
 * brand_slug='match-fit' the real guard is the content_machine_brand_guard
 * Postgres trigger's own week_start/day_index/post_type check-then-insert (see
 * the swallowed-insert comment in insertPost() below), which still no-ops a
 * genuine duplicate even if this precheck is stale or its query fails.
 */
export async function findExistingDailyPost(args: {
  brandSlug: string;
  dayIndex: number;
  postType: string;
}): Promise<boolean> {
  const sb = createServiceClient();

  if (args.brandSlug === "match-fit") {
    // Match Fit inserts never land in content_machine_posts — the brand guard
    // trigger redirects them into match_fit_content_calendar_posts, keyed on
    // week_start/day_index/post_type. day_index is always "today's" weekday
    // index (getDefaultThemeDayIndex), so post_date for today's row is today's
    // UTC date — check that directly instead of re-deriving week_start.
    const today = new Date().toISOString().slice(0, 10);
    const { data, error } = await sb
      .from("match_fit_content_calendar_posts")
      .select("id")
      .eq("post_date", today)
      .eq("post_type", args.postType)
      .is("deleted_at", null)
      .limit(1)
      .maybeSingle();
    if (error) return false; // fail open — worst case we regenerate; the trigger still blocks a real duplicate row
    return Boolean(data);
  }

  const since = new Date();
  since.setUTCHours(0, 0, 0, 0);
  const { data, error } = await sb
    .from("content_machine_posts")
    .select("id")
    .eq("brand_slug", args.brandSlug)
    .eq("day_index", args.dayIndex)
    .eq("post_type", args.postType)
    .gte("created_at", since.toISOString())
    .limit(1)
    .maybeSingle();
  if (error) return false;
  return Boolean(data);
}

export async function insertPost(
  post: Omit<ContentPost, "id" | "created_at" | "updated_at">
): Promise<ContentPost> {
  const sb = createServiceClient();
  const { data, error } = await sb
    .from("content_machine_posts")
    .insert(post)
    .select("*")
    .maybeSingle();

  if (error) throw error;

  // Health Scan 2026-07-31 — ROOT CAUSE of the daily batch cron failing every
  // run since 2026-07-28 (nv-vault runs 30361262219, 30453677275, 30542345408).
  // trg_content_machine_brand_guard is a BEFORE INSERT trigger that, for
  // brand_slug='match-fit', copies the row into match_fit_content_calendar_posts
  // and RETURNS NULL — deliberately, because Match Fit content never lives in
  // the NI Content Machine. A swallowed insert affects 0 rows, so
  // INSERT ... RETURNING came back empty and .single() raised PGRST116, which
  // aborted generateDailyBatch's loop after the FIRST post type. DEFAULT_BRAND_SLUG
  // is "match-fit", so every batch hit it and only ~1 of 4 posts was ever written.
  // A swallowed row is a successful redirect, not a failure: synthesise the record
  // so the caller's loop completes all four post types.
  if (!data) {
    const now = new Date().toISOString();
    return {
      ...post,
      id: randomUUID(),
      created_at: now,
      updated_at: now,
    } as ContentPost;
  }

  return data as ContentPost;
}

export async function updatePost(
  id: string,
  patch: Partial<ContentPost>
): Promise<ContentPost> {
  const sb = createServiceClient();
  const { data, error } = await sb
    .from("content_machine_posts")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw error;
  return data as ContentPost;
}

export async function logSignal(args: {
  postId?: string;
  brandSlug: string;
  signalType: string;
  originalText?: string;
  editedText?: string;
  meta?: Record<string, unknown>;
}): Promise<void> {
  const sb = createServiceClient();
  const { error } = await sb.from("content_machine_signals").insert({
    post_id: args.postId ?? null,
    brand_slug: args.brandSlug,
    signal_type: args.signalType,
    original_text: args.originalText ?? null,
    edited_text: args.editedText ?? null,
    meta: args.meta ?? {},
  });
  if (error) throw error;
}

export async function getPendingBatch(brandSlug: string): Promise<ContentPost[]> {
  const sb = createServiceClient();
  const { data, error } = await sb
    .from("content_machine_posts")
    .select("*")
    .eq("brand_slug", brandSlug)
    .eq("status", "pending_approval")
    .order("post_type");

  if (error) throw error;
  return (data ?? []) as ContentPost[];
}

export async function getScheduledPosts(brandSlug: string): Promise<ContentPost[]> {
  const sb = createServiceClient();
  const { data, error } = await sb
    .from("content_machine_posts")
    .select("*")
    .eq("brand_slug", brandSlug)
    .eq("status", "scheduled")
    .order("scheduled_at");

  if (error) throw error;
  return (data ?? []) as ContentPost[];
}
