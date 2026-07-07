import { updatePost } from "./db";
import type { ContentPost, PostStatus } from "./types";

const VALID_TRANSITIONS: Record<PostStatus, PostStatus[]> = {
  draft: ["pending_approval", "rejected"],
  pending_approval: ["approved", "rejected", "draft"],
  approved: ["scheduled", "rejected"],
  scheduled: ["published", "approved"],
  published: [],
  rejected: ["draft"],
};

export function canTransition(from: PostStatus, to: PostStatus): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

export async function approvePost(postId: string): Promise<ContentPost> {
  return updatePost(postId, { status: "approved" });
}

export async function rejectPost(postId: string): Promise<ContentPost> {
  return updatePost(postId, { status: "rejected" });
}

export async function schedulePost(args: {
  postId: string;
  scheduledAt: string;
  platforms?: string[];
}): Promise<ContentPost> {
  return updatePost(args.postId, {
    status: "scheduled",
    scheduled_at: args.scheduledAt,
    ...(args.platforms ? { platforms: args.platforms } : {}),
  });
}

export async function markPublished(postId: string): Promise<ContentPost> {
  return updatePost(postId, {
    status: "published",
    published_at: new Date().toISOString(),
  });
}

export async function approveBatch(batchId: string): Promise<ContentPost[]> {
  const { createServiceClient } = await import("@/lib/supabase/server");
  const sb = createServiceClient();
  const { data, error } = await sb
    .from("content_machine_posts")
    .update({ status: "approved", updated_at: new Date().toISOString() })
    .eq("batch_id", batchId)
    .eq("status", "pending_approval")
    .select("*");

  if (error) throw error;
  return (data ?? []) as ContentPost[];
}

export function buildScheduleSlots(
  posts: ContentPost[],
  baseDate = new Date()
): Array<{ postId: string; scheduledAt: string }> {
  const slots = [9, 12, 15, 18];
  return posts.map((post, i) => {
    const slot = new Date(baseDate);
    slot.setHours(slots[i % slots.length], 0, 0, 0);
    return { postId: post.id, scheduledAt: slot.toISOString() };
  });
}

export async function scheduleApprovedBatch(
  batchId: string,
  baseDate = new Date()
): Promise<ContentPost[]> {
  const { createServiceClient } = await import("@/lib/supabase/server");
  const sb = createServiceClient();
  const { data: posts, error } = await sb
    .from("content_machine_posts")
    .select("*")
    .eq("batch_id", batchId)
    .eq("status", "approved")
    .order("post_type");

  if (error) throw error;
  if (!posts?.length) return [];

  const slots = buildScheduleSlots(posts as ContentPost[], baseDate);
  const scheduled: ContentPost[] = [];

  for (const slot of slots) {
    const post = await schedulePost({
      postId: slot.postId,
      scheduledAt: slot.scheduledAt,
    });
    scheduled.push(post);
  }

  return scheduled;
}
