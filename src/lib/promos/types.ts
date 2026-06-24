export const PROMO_TYPES = [
  "store_discount",
  "tool_free_months",
  "feature_access",
  "manual",
] as const;

export type PromoType = (typeof PROMO_TYPES)[number];

export const MAX_AUTO_DISCOUNT_PERCENT = 15;

export interface UserPromo {
  id: string;
  userId: string;
  promoType: PromoType;
  title: string;
  description: string;
  promoCode: string | null;
  discountPercent: number | null;
  freeMonths: number | null;
  toolSlug: string | null;
  featureSlug: string | null;
  storeProductSlug: string | null;
  expiresAt: string;
  claimedAt: string | null;
  isManual: boolean;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface PromoGenerationContext {
  userId: string;
  tier: string;
  segmentSlugs: string[];
  ownedToolSlugs: string[];
  storeOrderCount: number;
  toolSessionCount30d: number;
  paidMonths: number;
}

export const FEATURE_PROMOS = [
  { slug: "technical_view", title: "Technical View Access", description: "Unlock detailed technical output on your next tool session." },
  { slug: "priority_support", title: "Priority Support Week", description: "Get faster response on support requests this week." },
  { slug: "early_access", title: "Early Access Preview", description: "Be first to try upcoming NI features before public launch." },
] as const;

export function mapPromoRow(row: Record<string, unknown>): UserPromo {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    promoType: row.promo_type as PromoType,
    title: String(row.title),
    description: String(row.description),
    promoCode: row.promo_code ? String(row.promo_code) : null,
    discountPercent: row.discount_percent != null ? Number(row.discount_percent) : null,
    freeMonths: row.free_months != null ? Number(row.free_months) : null,
    toolSlug: row.tool_slug ? String(row.tool_slug) : null,
    featureSlug: row.feature_slug ? String(row.feature_slug) : null,
    storeProductSlug: row.store_product_slug ? String(row.store_product_slug) : null,
    expiresAt: String(row.expires_at),
    claimedAt: row.claimed_at ? String(row.claimed_at) : null,
    isManual: Boolean(row.is_manual),
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    createdAt: String(row.created_at),
  };
}
