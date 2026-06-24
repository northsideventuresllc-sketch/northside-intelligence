import "server-only";

import { INTELLIGENCE_TOOLS } from "@/lib/constants";
import { createNotification } from "@/lib/notifications/service";
import { getUserSegmentSlugs, loadUserSignals } from "@/lib/promos/segments";
import {
  FEATURE_PROMOS,
  MAX_AUTO_DISCOUNT_PERCENT,
  type PromoGenerationContext,
  type PromoType,
  mapPromoRow,
  type UserPromo,
} from "@/lib/promos/types";
import { createServiceClient } from "@/lib/supabase/server";

const TOOL_SLUGS = INTELLIGENCE_TOOLS.map((t) => t.slug);

function tierDiscountCap(tier: string): number {
  switch (tier) {
    case "power":
      return MAX_AUTO_DISCOUNT_PERCENT;
    case "pro":
      return 12;
    case "core":
      return 10;
    default:
      return 8;
  }
}

function tierFreeMonthsCap(tier: string): number {
  switch (tier) {
    case "power":
      return 3;
    case "pro":
      return 2;
    default:
      return 1;
  }
}

function generatePromoCode(prefix: string): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let suffix = "";
  for (let i = 0; i < 6; i++) {
    suffix += chars[Math.floor(Math.random() * chars.length)];
  }
  return `${prefix}-${suffix}`;
}

function pickToolForPromo(ctx: PromoGenerationContext): string {
  const notOwned = TOOL_SLUGS.filter((s) => !ctx.ownedToolSlugs.includes(s));
  const pool = notOwned.length > 0 ? notOwned : TOOL_SLUGS;
  return pool[Math.floor(Math.random() * pool.length)];
}

function buildPromoForUser(ctx: PromoGenerationContext): {
  promoType: PromoType;
  title: string;
  description: string;
  promoCode: string;
  discountPercent: number | null;
  freeMonths: number | null;
  toolSlug: string | null;
  featureSlug: string | null;
  storeProductSlug: string | null;
} {
  const hasStoreEngagement = ctx.storeOrderCount > 0 || ctx.segmentSlugs.includes("store_engaged");
  const isHighTier = ["pro", "power"].includes(ctx.tier);
  const isActive = ctx.toolSessionCount30d >= 3;

  // Weight promo types by user context and margin safety
  const roll = Math.random();
  const discountCap = tierDiscountCap(ctx.tier);
  const freeMonthsCap = tierFreeMonthsCap(ctx.tier);

  if (hasStoreEngagement && roll < 0.35) {
    const discount = Math.min(discountCap, 5 + Math.floor(Math.random() * (discountCap - 4)));
    return {
      promoType: "store_discount",
      title: "Smart Store Savings",
      description: `Save ${discount}% on your next Smart Store order. Limited time offer tailored for you.`,
      promoCode: generatePromoCode("STORE"),
      discountPercent: discount,
      freeMonths: null,
      toolSlug: null,
      featureSlug: null,
      storeProductSlug: null,
    };
  }

  if (roll < 0.65 || isHighTier) {
    const toolSlug = pickToolForPromo(ctx);
    const toolName =
      INTELLIGENCE_TOOLS.find((t) => t.slug === toolSlug)?.name ?? toolSlug;
    const freeMonths = 1 + Math.floor(Math.random() * freeMonthsCap);
    return {
      promoType: "tool_free_months",
      title: `${freeMonths} Month${freeMonths > 1 ? "s" : ""} Unlimited — ${toolName}`,
      description: `Get ${freeMonths} month${freeMonths > 1 ? "s" : ""} of unlimited ${toolName} access at no extra cost.`,
      promoCode: generatePromoCode("TOOL"),
      discountPercent: null,
      freeMonths,
      toolSlug,
      featureSlug: null,
      storeProductSlug: null,
    };
  }

  const feature = FEATURE_PROMOS[Math.floor(Math.random() * FEATURE_PROMOS.length)];
  return {
    promoType: "feature_access",
    title: feature.title,
    description: isActive
      ? feature.description
      : `${feature.description} A little push to help you explore what's new.`,
    promoCode: generatePromoCode("FEAT"),
    discountPercent: null,
    freeMonths: null,
    toolSlug: null,
    featureSlug: feature.slug,
    storeProductSlug: null,
  };
}

/** Generate weekly promos for all users who don't have an active unclaimed promo. */
export async function generateWeeklyPromos(): Promise<{ generated: number; skipped: number }> {
  const admin = createServiceClient();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const now = new Date().toISOString();

  const { data: profiles } = await admin
    .from("ni_portal_profiles")
    .select("id, email, email_list_subscribed");

  let generated = 0;
  let skipped = 0;

  for (const profile of profiles ?? []) {
    const { data: existing } = await admin
      .from("ni_promos")
      .select("id")
      .eq("user_id", profile.id)
      .is("claimed_at", null)
      .gt("expires_at", now)
      .limit(1);

    if (existing?.length) {
      skipped++;
      continue;
    }

    const signals = await loadUserSignals(profile.id);
    const segmentSlugs = await getUserSegmentSlugs(profile.id);

    const ctx: PromoGenerationContext = {
      userId: profile.id,
      tier: signals.tier,
      segmentSlugs,
      ownedToolSlugs: signals.ownedToolSlugs,
      storeOrderCount: signals.storeOrderCount,
      toolSessionCount30d: signals.toolSessionCount30d,
      paidMonths: signals.paidMonths,
    };

    const promo = buildPromoForUser(ctx);

    const { data: inserted, error } = await admin
      .from("ni_promos")
      .insert({
        user_id: profile.id,
        promo_type: promo.promoType,
        title: promo.title,
        description: promo.description,
        promo_code: promo.promoCode,
        discount_percent: promo.discountPercent,
        free_months: promo.freeMonths,
        tool_slug: promo.toolSlug,
        feature_slug: promo.featureSlug,
        store_product_slug: promo.storeProductSlug,
        expires_at: expiresAt,
        is_manual: false,
        metadata: { tier: signals.tier, segments: segmentSlugs },
      })
      .select("*")
      .single();

    if (error || !inserted) continue;

    generated++;

    await createNotification({
      userId: profile.id,
      category: "promo",
      title: "New Promo Available",
      body: promo.title,
      link: "/promos",
      userEmail: profile.email,
      metadata: { promoId: inserted.id },
    });
  }

  return { generated, skipped };
}

export async function listActivePromosForUser(userId: string): Promise<UserPromo[]> {
  const admin = createServiceClient();
  const now = new Date().toISOString();

  const { data } = await admin
    .from("ni_promos")
    .select("*")
    .eq("user_id", userId)
    .is("claimed_at", null)
    .gt("expires_at", now)
    .order("expires_at", { ascending: true });

  return (data ?? []).map((row) => mapPromoRow(row as Record<string, unknown>));
}

export async function notifyExpiringPromos(): Promise<number> {
  const admin = createServiceClient();
  const in48h = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
  const now = new Date().toISOString();

  const { data: expiring } = await admin
    .from("ni_promos")
    .select("id, user_id, title, expires_at")
    .is("claimed_at", null)
    .gt("expires_at", now)
    .lt("expires_at", in48h);

  let notified = 0;
  for (const promo of expiring ?? []) {
    const { data: profile } = await admin
      .from("ni_portal_profiles")
      .select("email")
      .eq("id", promo.user_id)
      .maybeSingle();
    const expiresDate = new Date(String(promo.expires_at)).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    await createNotification({
      userId: String(promo.user_id),
      category: "promo",
      title: "Promo Expiring Soon",
      body: `"${promo.title}" expires on ${expiresDate}. Claim it before it's gone.`,
      link: "/promos",
      userEmail: profile?.email ?? null,
      metadata: { promoId: promo.id },
    });
    notified++;
  }

  return notified;
}
