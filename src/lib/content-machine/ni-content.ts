import "server-only";

import { createServiceClient } from "@/lib/supabase/server";
import type { ContentPost, PostStatus } from "./types";

export const NI_BRAND_SLUG = "ni";

/** Never NI's own brand — the one slug this data layer must never touch. */
const MATCH_FIT_BRAND_SLUG = "match-fit";

/**
 * NIP-CONTENT-ENGINE data layer. Deliberately thin: the generator, quality gate
 * and free-tier Gemini path are shared with Match Fit — only the brand differs.
 *
 * FIXED 2026-08-13 (NI Repo Agent): this used to hard-filter brand_slug="ni"
 * only, so the 7-product launch batch (bridgeai, gapscan, grantbot, replyflow,
 * signaldesk, ni-store, ni-webdesign — Decision #832) was invisible in this
 * queue and could not be approved/rejected/edited through it, even though the
 * posts existed in content_machine_posts. Every NI-family brand now shows up
 * here; Match Fit stays explicitly excluded as a safety boundary.
 */
export async function listNiPosts(limit = 60): Promise<ContentPost[]> {
  const sb = createServiceClient();
  const { data, error } = await sb
    .from("content_machine_posts")
    .select("*")
    .neq("brand_slug", MATCH_FIT_BRAND_SLUG)
    .neq("status", "rejected")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return (data ?? []) as ContentPost[];
}

export async function setNiPostStatus(id: string, status: PostStatus): Promise<void> {
  const sb = createServiceClient();
  const { error } = await sb
    .from("content_machine_posts")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id)
    .neq("brand_slug", MATCH_FIT_BRAND_SLUG);

  if (error) throw new Error(error.message);
}

export async function updateNiPostCaption(id: string, caption: string): Promise<void> {
  const sb = createServiceClient();
  const { error } = await sb
    .from("content_machine_posts")
    .update({ caption, updated_at: new Date().toISOString() })
    .eq("id", id)
    .neq("brand_slug", MATCH_FIT_BRAND_SLUG);

  if (error) throw new Error(error.message);
}
