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

export async function insertPost(
  post: Omit<ContentPost, "id" | "created_at" | "updated_at">
): Promise<ContentPost> {
  const sb = createServiceClient();
  const { data, error } = await sb
    .from("content_machine_posts")
    .insert(post)
    .select("*")
    .single();

  if (error) throw error;
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
