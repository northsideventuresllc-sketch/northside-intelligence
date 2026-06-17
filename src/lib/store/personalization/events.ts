import "server-only";

import { createServiceClient } from "@/lib/supabase/server";

export type StoreEventType = "view" | "click" | "search" | "purchase" | "carousel_impression";

export interface StoreEventInput {
  eventType: StoreEventType;
  catalogId?: string;
  searchQuery?: string;
  sessionId?: string;
  metadata?: Record<string, unknown>;
}

const TAG_BOOST: Record<string, number> = {
  view: 0.5,
  carousel_impression: 0.3,
  click: 2,
  search: 1.5,
  purchase: 8,
};

export async function recordStoreEvent(
  userId: string | null,
  input: StoreEventInput
): Promise<void> {
  const supabase = createServiceClient();
  const { error } = await supabase.from("ni_store_events").insert({
    user_id: userId,
    session_id: input.sessionId ?? null,
    event_type: input.eventType,
    catalog_id: input.catalogId ?? null,
    search_query: input.searchQuery?.trim() || null,
    metadata: input.metadata ?? {},
  });

  if (error) throw new Error(error.message);

  if (userId && input.catalogId) {
    await updateNicheFromEvent(userId, input.catalogId, input.eventType);
  }

  if (userId && input.searchQuery?.trim()) {
    await updateNicheFromSearch(userId, input.searchQuery.trim());
  }
}

async function updateNicheFromEvent(
  userId: string,
  catalogId: string,
  eventType: StoreEventType
): Promise<void> {
  const supabase = createServiceClient();
  const { data: product } = await supabase
    .from("ni_store_catalog")
    .select("category, tags")
    .eq("id", catalogId)
    .maybeSingle();

  if (!product) return;

  const boost = TAG_BOOST[eventType] ?? 1;
  const tags = [
    String(product.category),
    ...(Array.isArray(product.tags) ? (product.tags as string[]) : []),
  ];

  const { data: prefs } = await supabase
    .from("ni_store_user_preferences")
    .select("niche_weights, interest_tags")
    .eq("user_id", userId)
    .maybeSingle();

  const weights = { ...((prefs?.niche_weights as Record<string, number>) ?? {}) };
  const interestTags = new Set<string>(
    Array.isArray(prefs?.interest_tags) ? (prefs.interest_tags as string[]) : []
  );

  for (const tag of tags) {
    weights[tag] = (weights[tag] ?? 0) + boost;
    interestTags.add(tag);
  }

  await supabase.from("ni_store_user_preferences").upsert({
    user_id: userId,
    niche_weights: weights,
    interest_tags: Array.from(interestTags).slice(0, 50),
    updated_at: new Date().toISOString(),
  });
}

async function updateNicheFromSearch(userId: string, query: string): Promise<void> {
  const supabase = createServiceClient();
  const tokens = query
    .toLowerCase()
    .split(/\s+/)
    .filter((t) => t.length > 2)
    .slice(0, 8);

  const { data: prefs } = await supabase
    .from("ni_store_user_preferences")
    .select("niche_weights, interest_tags")
    .eq("user_id", userId)
    .maybeSingle();

  const weights = { ...((prefs?.niche_weights as Record<string, number>) ?? {}) };
  const interestTags = new Set<string>(
    Array.isArray(prefs?.interest_tags) ? (prefs.interest_tags as string[]) : []
  );

  for (const token of tokens) {
    weights[token] = (weights[token] ?? 0) + TAG_BOOST.search;
    interestTags.add(token);
  }

  await supabase.from("ni_store_user_preferences").upsert({
    user_id: userId,
    niche_weights: weights,
    interest_tags: Array.from(interestTags).slice(0, 50),
    updated_at: new Date().toISOString(),
  });
}
