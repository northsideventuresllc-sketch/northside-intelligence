import "server-only";

import { createServiceClient } from "@/lib/supabase/server";

export interface UserStorePreferences {
  webTrackingEnabled: boolean;
  interestTags: string[];
  nicheWeights: Record<string, number>;
}

export async function getUserStorePreferences(
  userId: string
): Promise<UserStorePreferences | null> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("ni_store_user_preferences")
    .select("web_tracking_enabled, interest_tags, niche_weights")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;

  return {
    webTrackingEnabled: Boolean(data.web_tracking_enabled),
    interestTags: Array.isArray(data.interest_tags) ? (data.interest_tags as string[]) : [],
    nicheWeights:
      typeof data.niche_weights === "object" && data.niche_weights
        ? (data.niche_weights as Record<string, number>)
        : {},
  };
}

export async function getUserNicheWeights(userId: string): Promise<Record<string, number>> {
  const prefs = await getUserStorePreferences(userId);
  return prefs?.nicheWeights ?? {};
}

export async function setWebTrackingEnabled(
  userId: string,
  enabled: boolean
): Promise<UserStorePreferences> {
  const supabase = createServiceClient();
  const existing = await getUserStorePreferences(userId);

  const { error } = await supabase.from("ni_store_user_preferences").upsert({
    user_id: userId,
    web_tracking_enabled: enabled,
    interest_tags: existing?.interestTags ?? [],
    niche_weights: existing?.nicheWeights ?? {},
    updated_at: new Date().toISOString(),
  });

  if (error) throw new Error(error.message);

  return {
    webTrackingEnabled: enabled,
    interestTags: existing?.interestTags ?? [],
    nicheWeights: existing?.nicheWeights ?? {},
  };
}
