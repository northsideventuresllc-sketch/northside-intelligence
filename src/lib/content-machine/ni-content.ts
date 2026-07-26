import "server-only";

import { createServiceClient } from "@/lib/supabase/server";
import type { ContentPost, PostStatus } from "./types";

export const NI_BRAND_SLUG = "ni";

/**
 * NIP-CONTENT-ENGINE data layer. Deliberately thin: the generator, quality gate
 * and free-tier Gemini path are shared with Match Fit — only the brand differs.
 */
export async function listNiPosts(limit = 60): Promise<ContentPost[]> {
  const sb = createServiceClient();
  const { data, error } = await sb
    .from("content_machine_posts")
    .select("*")
    .eq("brand_slug", NI_BRAND_SLUG)
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
    .eq("brand_slug", NI_BRAND_SLUG);

  if (error) throw new Error(error.message);
}

export async function updateNiPostCaption(id: string, caption: string): Promise<void> {
  const sb = createServiceClient();
  const { error } = await sb
    .from("content_machine_posts")
    .update({ caption, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("brand_slug", NI_BRAND_SLUG);

  if (error) throw new Error(error.message);
}
