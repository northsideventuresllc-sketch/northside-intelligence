import {
  masterAccountHasProductAccess,
  isMasterAccountFlag,
} from "@/lib/billing/master-account";
import {
  getNiTierConfig,
  getToolSlotLimit,
  normalizeNiTier,
  tierHasUnlimitedToolAccess,
  type NiTier,
} from "@/lib/billing/ni-tiers";
import { createServiceClient } from "@/lib/supabase/server";

export type ToolkitAccessType = "lifetime" | "tool_subscription" | "ni_plan";

export interface ToolkitEntry {
  id: string;
  toolSlug: string;
  accessType: ToolkitAccessType;
  expiresAt: string | null;
  purchasedAt: string;
  stripeSubscriptionId: string | null;
}

export interface UserBillingState {
  niTier: NiTier;
  billingInterval: "monthly" | "annual" | null;
  currentPeriodEnd: string | null;
  stripeCustomerId: string | null;
  niStripeSubscriptionId: string | null;
  isMasterAccount: boolean;
  toolkit: ToolkitEntry[];
  ownedToolSlugs: string[];
  toolSlotsUsed: number;
  toolSlotLimit: number | null;
  hasNiPaidPlan: boolean;
}

interface ToolkitRow {
  id: string;
  tool_slug: string;
  access_type: ToolkitAccessType;
  expires_at: string | null;
  purchased_at: string;
  stripe_subscription_id: string | null;
}

interface SubscriptionRow {
  tier: NiTier;
  billing_interval: "monthly" | "annual" | null;
  current_period_end: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
}

export async function expireStaleEntitlements(): Promise<void> {
  const supabase = createServiceClient();
  await supabase.rpc("expire_ni_entitlements");
}

export async function getUserBillingState(userId: string): Promise<UserBillingState> {
  await expireStaleEntitlements();

  const supabase = createServiceClient();

  const [{ data: sub }, { data: toolkitRows }, { data: profile }] = await Promise.all([
    supabase
      .from("ni_subscriptions")
      .select("tier, billing_interval, current_period_end, stripe_customer_id, stripe_subscription_id")
      .eq("id", userId)
      .maybeSingle(),
    supabase
      .from("ni_toolkit")
      .select("id, tool_slug, access_type, expires_at, purchased_at, stripe_subscription_id")
      .eq("user_id", userId)
      .order("purchased_at", { ascending: false }),
    supabase
      .from("ni_portal_profiles")
      .select("is_master_account")
      .eq("id", userId)
      .maybeSingle(),
  ]);

  const isMasterAccount = isMasterAccountFlag(profile?.is_master_account);

  const subscription = (sub ?? { tier: "free" }) as SubscriptionRow;
  const niTier = normalizeNiTier(subscription.tier);
  const tierConfig = getNiTierConfig(niTier);
  const toolkit = ((toolkitRows ?? []) as ToolkitRow[]).map((row) => ({
    id: row.id,
    toolSlug: row.tool_slug,
    accessType: row.access_type,
    expiresAt: row.expires_at,
    purchasedAt: row.purchased_at,
    stripeSubscriptionId: row.stripe_subscription_id ?? null,
  }));

  const ownedToolSlugs = toolkit.map((t) => t.toolSlug);
  const niPlanSlots = toolkit.filter((t) => t.accessType === "ni_plan").length;

  return {
    niTier,
    billingInterval: subscription.billing_interval ?? null,
    currentPeriodEnd: subscription.current_period_end ?? null,
    stripeCustomerId: subscription.stripe_customer_id ?? null,
    niStripeSubscriptionId: subscription.stripe_subscription_id ?? null,
    isMasterAccount,
    toolkit,
    ownedToolSlugs,
    toolSlotsUsed: niPlanSlots,
    toolSlotLimit: isMasterAccount ? null : tierConfig.toolSlots,
    hasNiPaidPlan: isMasterAccount || niTier !== "free",
  };
}

export function userOwnsTool(state: UserBillingState, toolSlug: string): boolean {
  if (masterAccountHasProductAccess(state.isMasterAccount, toolSlug)) return true;
  return state.ownedToolSlugs.includes(toolSlug);
}

export function userHasUnlimitedToolAccess(state: UserBillingState, toolSlug: string): boolean {
  if (masterAccountHasProductAccess(state.isMasterAccount, toolSlug)) return true;
  if (tierHasUnlimitedToolAccess(state.niTier)) return true;
  const entry = state.toolkit.find((t) => t.toolSlug === toolSlug);
  if (!entry) return false;
  if (entry.accessType === "lifetime") return true;
  if (entry.accessType === "tool_subscription" || entry.accessType === "ni_plan") {
    if (!entry.expiresAt) return true;
    return new Date(entry.expiresAt) > new Date();
  }
  return false;
}

export function shouldHideToolSubscriptions(state: UserBillingState, toolSlug: string): boolean {
  if (masterAccountHasProductAccess(state.isMasterAccount, toolSlug)) return true;
  if (tierHasUnlimitedToolAccess(state.niTier)) return true;
  const entry = state.toolkit.find((t) => t.toolSlug === toolSlug);
  if (!entry) return false;
  return entry.accessType === "ni_plan" || entry.accessType === "lifetime";
}

export function canAddNiPlanTool(state: UserBillingState): boolean {
  if (state.isMasterAccount) return false;
  if (state.niTier === "free") return false;
  if (tierHasUnlimitedToolAccess(state.niTier)) return true;
  const limit = getToolSlotLimit(state.niTier);
  if (limit === null) return true;
  return state.toolSlotsUsed < limit;
}

export async function ensureNiSubscriptionRow(userId: string): Promise<void> {
  const supabase = createServiceClient();
  await supabase.from("ni_subscriptions").upsert({ id: userId, tier: "free" }, { onConflict: "id" });
}

export async function grantToolkitAccess(params: {
  userId: string;
  toolSlug: string;
  accessType: ToolkitAccessType;
  expiresAt?: string | null;
  stripeSubscriptionId?: string | null;
}): Promise<void> {
  const supabase = createServiceClient();
  const { error } = await supabase.from("ni_toolkit").upsert(
    {
      user_id: params.userId,
      tool_slug: params.toolSlug,
      access_type: params.accessType,
      expires_at: params.expiresAt ?? null,
      stripe_subscription_id: params.stripeSubscriptionId ?? null,
      purchased_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,tool_slug" }
  );
  if (error) throw new Error(error.message);
}

export async function revokeToolkitTool(userId: string, toolSlug: string): Promise<void> {
  const supabase = createServiceClient();
  const { error } = await supabase
    .from("ni_toolkit")
    .delete()
    .eq("user_id", userId)
    .eq("tool_slug", toolSlug);
  if (error) throw new Error(error.message);
}

export async function setNiSubscription(params: {
  userId: string;
  tier: NiTier;
  billingInterval?: BillingInterval | null;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string | null;
  currentPeriodEnd?: string | null;
}): Promise<void> {
  const supabase = createServiceClient();
  const { error } = await supabase.from("ni_subscriptions").upsert(
    {
      id: params.userId,
      tier: params.tier,
      billing_interval: params.billingInterval ?? null,
      stripe_customer_id: params.stripeCustomerId,
      stripe_subscription_id: params.stripeSubscriptionId ?? null,
      current_period_end: params.currentPeriodEnd ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" }
  );
  if (error) throw new Error(error.message);
}

type BillingInterval = "monthly" | "annual";
