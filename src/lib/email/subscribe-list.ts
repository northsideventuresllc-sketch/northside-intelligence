import "server-only";

import { subscribeToKit } from "@/lib/kit/client";
import { createServiceClient } from "@/lib/supabase/server";

export interface SubscribeEmailListResult {
  subscribed: boolean;
  kitSubscriberId?: string;
  error?: string;
}

/** Subscribe a user to the NI email list (Kit) and update profile. */
export async function subscribeUserToEmailList(
  userId: string,
  email: string,
  firstName?: string | null
): Promise<SubscribeEmailListResult> {
  const admin = createServiceClient();
  const normalizedEmail = email.trim().toLowerCase();

  const { data: profile } = await admin
    .from("ni_portal_profiles")
    .select("email_list_subscribed, kit_subscriber_id")
    .eq("id", userId)
    .maybeSingle();

  if (profile?.email_list_subscribed) {
    return { subscribed: true, kitSubscriberId: profile.kit_subscriber_id ?? undefined };
  }

  const kitResult = await subscribeToKit({ email: normalizedEmail, firstName });
  if (kitResult.error) {
    return { subscribed: false, error: kitResult.error };
  }

  const now = new Date().toISOString();
  const { error: updateError } = await admin
    .from("ni_portal_profiles")
    .update({
      email_list_subscribed: true,
      email_list_subscribed_at: now,
      kit_subscriber_id: kitResult.subscriberId ?? null,
      updated_at: now,
    })
    .eq("id", userId);

  if (updateError) {
    return { subscribed: false, error: updateError.message };
  }

  return { subscribed: true, kitSubscriberId: kitResult.subscriberId };
}

export async function isUserOnEmailList(userId: string): Promise<boolean> {
  const admin = createServiceClient();
  const { data } = await admin
    .from("ni_portal_profiles")
    .select("email_list_subscribed")
    .eq("id", userId)
    .maybeSingle();
  return data?.email_list_subscribed === true;
}
