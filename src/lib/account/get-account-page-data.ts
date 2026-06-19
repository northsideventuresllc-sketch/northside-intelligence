import { getUserBillingState } from "@/lib/billing/entitlements";
import { createServerAuthClient } from "@/lib/supabase/server-auth";

export async function getAccountPageData() {
  const supabase = await createServerAuthClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile } = await supabase
    .from("ni_portal_profiles")
    .select(
      "full_name, email, username, two_factor_enabled, account_type, business_name, business_website, business_size"
    )
    .eq("id", user.id)
    .maybeSingle();

  const billingState = await getUserBillingState(user.id);

  const displayName =
    profile?.full_name ?? user.user_metadata?.full_name ?? user.email?.split("@")[0] ?? "Member";

  return {
    user,
    profile,
    displayName,
    initialProfile: {
      email: profile?.email ?? user.email ?? "",
      fullName: profile?.full_name ?? null,
      username: profile?.username ?? null,
      twoFactorEnabled: profile?.two_factor_enabled ?? true,
      accountType: (profile?.account_type ?? "personal") as "personal" | "business",
      businessName: profile?.business_name ?? null,
      businessWebsite: profile?.business_website ?? null,
      businessSize: profile?.business_size ?? null,
    },
    billing: {
      niTier: billingState.niTier,
      billingInterval: billingState.billingInterval,
      hasStripeCustomer: !!billingState.stripeCustomerId,
      toolkitCount: billingState.toolkit.length,
      isMasterAccount: billingState.isMasterAccount,
      niStripeSubscriptionId: billingState.niStripeSubscriptionId,
      toolSubscriptions: billingState.toolkit
        .filter(
          (entry) => entry.accessType === "tool_subscription" && entry.stripeSubscriptionId
        )
        .map((entry) => ({
          toolSlug: entry.toolSlug,
          stripeSubscriptionId: entry.stripeSubscriptionId!,
        })),
      currentPeriodEnd: billingState.currentPeriodEnd,
    },
  };
}

export type AccountPageData = NonNullable<Awaited<ReturnType<typeof getAccountPageData>>>;
