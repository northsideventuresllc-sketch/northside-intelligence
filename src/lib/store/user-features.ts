import "server-only";

import { createNotification } from "@/lib/notifications/service";
import { createServiceClient } from "@/lib/supabase/server";
import { formatRetailPriceRange } from "@/lib/store/catalog/format-price";

const HISTORY_RETENTION_DAYS = 365;

import type {
  PriceWatchItem,
  SearchHistoryItem,
  WishlistItem,
} from "@/lib/store/user-features-types";

function mapHistory(row: Record<string, unknown>): SearchHistoryItem {
  return {
    id: String(row.id),
    productSlug: String(row.product_slug),
    productName: String(row.product_name),
    imageUrl: row.image_url ? String(row.image_url) : null,
    retailPriceCents: row.retail_price_cents != null ? Number(row.retail_price_cents) : null,
    viewedAt: String(row.viewed_at),
  };
}

function mapWishlist(row: Record<string, unknown>): WishlistItem {
  return {
    id: String(row.id),
    productSlug: String(row.product_slug),
    productName: String(row.product_name),
    imageUrl: row.image_url ? String(row.image_url) : null,
    retailPriceCents: row.retail_price_cents != null ? Number(row.retail_price_cents) : null,
    variantId: row.variant_id ? String(row.variant_id) : null,
    createdAt: String(row.created_at),
  };
}

function mapPriceWatch(row: Record<string, unknown>): PriceWatchItem {
  return {
    id: String(row.id),
    productSlug: String(row.product_slug),
    productName: String(row.product_name),
    variantId: row.variant_id ? String(row.variant_id) : null,
    baselineRetailCents: Number(row.baseline_retail_cents),
    lastKnownRetailCents: Number(row.last_known_retail_cents),
    active: Boolean(row.active),
    createdAt: String(row.created_at),
  };
}

export async function recordSearchHistory(
  userId: string,
  item: {
    catalogId?: string | null;
    productSlug: string;
    productName: string;
    imageUrl?: string | null;
    retailPriceCents?: number | null;
  }
): Promise<void> {
  const admin = createServiceClient();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - HISTORY_RETENTION_DAYS);

  await admin.from("ni_store_search_history").upsert(
    {
      user_id: userId,
      catalog_id: item.catalogId ?? null,
      product_slug: item.productSlug,
      product_name: item.productName.slice(0, 200),
      image_url: item.imageUrl ?? null,
      retail_price_cents: item.retailPriceCents ?? null,
      viewed_at: new Date().toISOString(),
    },
    { onConflict: "user_id,product_slug" }
  );

  await admin
    .from("ni_store_search_history")
    .delete()
    .eq("user_id", userId)
    .lt("viewed_at", cutoff.toISOString());
}

export async function listSearchHistory(userId: string): Promise<SearchHistoryItem[]> {
  const admin = createServiceClient();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - HISTORY_RETENTION_DAYS);

  const { data } = await admin
    .from("ni_store_search_history")
    .select("*")
    .eq("user_id", userId)
    .gte("viewed_at", cutoff.toISOString())
    .order("viewed_at", { ascending: false })
    .limit(100);

  return (data ?? []).map((row) => mapHistory(row as Record<string, unknown>));
}

export async function deleteSearchHistoryItem(
  userId: string,
  historyId: string
): Promise<boolean> {
  const admin = createServiceClient();
  const { error } = await admin
    .from("ni_store_search_history")
    .delete()
    .eq("id", historyId)
    .eq("user_id", userId);
  return !error;
}

export async function clearSearchHistory(userId: string): Promise<void> {
  const admin = createServiceClient();
  await admin.from("ni_store_search_history").delete().eq("user_id", userId);
}

export async function addToWishlist(
  userId: string,
  item: {
    catalogId?: string | null;
    productSlug: string;
    productName: string;
    imageUrl?: string | null;
    retailPriceCents?: number | null;
    variantId?: string | null;
  }
): Promise<WishlistItem | null> {
  const admin = createServiceClient();
  const { data, error } = await admin
    .from("ni_store_wishlist")
    .upsert(
      {
        user_id: userId,
        catalog_id: item.catalogId ?? null,
        product_slug: item.productSlug,
        product_name: item.productName.slice(0, 200),
        image_url: item.imageUrl ?? null,
        retail_price_cents: item.retailPriceCents ?? null,
        variant_id: item.variantId ?? null,
      },
      { onConflict: "user_id,product_slug,variant_id" }
    )
    .select("*")
    .single();

  if (error || !data) return null;
  return mapWishlist(data as Record<string, unknown>);
}

export async function removeFromWishlist(
  userId: string,
  wishlistId: string
): Promise<boolean> {
  const admin = createServiceClient();
  const { error } = await admin
    .from("ni_store_wishlist")
    .delete()
    .eq("id", wishlistId)
    .eq("user_id", userId);
  return !error;
}

export async function listWishlist(userId: string): Promise<WishlistItem[]> {
  const admin = createServiceClient();
  const { data } = await admin
    .from("ni_store_wishlist")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(100);

  return (data ?? []).map((row) => mapWishlist(row as Record<string, unknown>));
}

export async function isOnWishlist(
  userId: string,
  productSlug: string,
  variantId?: string | null
): Promise<boolean> {
  const admin = createServiceClient();
  let query = admin
    .from("ni_store_wishlist")
    .select("id")
    .eq("user_id", userId)
    .eq("product_slug", productSlug);

  if (variantId) {
    query = query.eq("variant_id", variantId);
  } else {
    query = query.is("variant_id", null);
  }

  const { data } = await query.maybeSingle();
  return Boolean(data);
}

export async function addPriceWatch(
  userId: string,
  item: {
    catalogId?: string | null;
    productSlug: string;
    productName: string;
    variantId?: string | null;
    retailPriceCents: number;
  }
): Promise<PriceWatchItem | null> {
  const admin = createServiceClient();
  const { data, error } = await admin
    .from("ni_store_price_watches")
    .upsert(
      {
        user_id: userId,
        catalog_id: item.catalogId ?? null,
        product_slug: item.productSlug,
        product_name: item.productName.slice(0, 200),
        variant_id: item.variantId ?? null,
        baseline_retail_cents: item.retailPriceCents,
        last_known_retail_cents: item.retailPriceCents,
        active: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,product_slug,variant_id" }
    )
    .select("*")
    .single();

  if (error || !data) return null;
  return mapPriceWatch(data as Record<string, unknown>);
}

export async function removePriceWatch(
  userId: string,
  watchId: string
): Promise<boolean> {
  const admin = createServiceClient();
  const { error } = await admin
    .from("ni_store_price_watches")
    .update({ active: false, updated_at: new Date().toISOString() })
    .eq("id", watchId)
    .eq("user_id", userId);
  return !error;
}

export async function listPriceWatches(userId: string): Promise<PriceWatchItem[]> {
  const admin = createServiceClient();
  const { data } = await admin
    .from("ni_store_price_watches")
    .select("*")
    .eq("user_id", userId)
    .eq("active", true)
    .order("created_at", { ascending: false })
    .limit(50);

  return (data ?? []).map((row) => mapPriceWatch(row as Record<string, unknown>));
}

export async function checkPriceWatchesAndNotify(): Promise<number> {
  const admin = createServiceClient();
  const { data: watches } = await admin
    .from("ni_store_price_watches")
    .select("*")
    .eq("active", true)
    .limit(200);

  if (!watches?.length) return 0;

  const { getCatalogProductBySlug } = await import("@/lib/store/catalog/products");
  let notified = 0;

  for (const watch of watches) {
    const row = await getCatalogProductBySlug(String(watch.product_slug));
    if (!row) continue;

    const variantId = watch.variant_id ? String(watch.variant_id) : null;
    let currentCents = row.retailPriceCents;
    if (variantId && row.variants.length) {
      const variant = row.variants.find((v) => v.id === variantId);
      if (variant) currentCents = variant.retailPriceCents;
    }

    const lastKnown = Number(watch.last_known_retail_cents);
    if (currentCents === lastKnown) continue;

    const priceDropped = currentCents < lastKnown;
    const priceChanged = currentCents !== lastKnown;

    await admin
      .from("ni_store_price_watches")
      .update({
        last_known_retail_cents: currentCents,
        updated_at: new Date().toISOString(),
      })
      .eq("id", watch.id);

    if (!priceChanged) continue;

    const lastNotified = watch.last_notified_at ? new Date(String(watch.last_notified_at)) : null;
    const hoursSinceNotify = lastNotified
      ? (Date.now() - lastNotified.getTime()) / (1000 * 60 * 60)
      : 999;
    if (hoursSinceNotify < 24) continue;

    const { data: profile } = await admin
      .from("ni_portal_profiles")
      .select("email")
      .eq("id", watch.user_id)
      .maybeSingle();

    const productName = String(watch.product_name);
    const prevLabel = formatRetailPriceRange(lastKnown, null, null);
    const currLabel = formatRetailPriceRange(currentCents, null, null);

    const title = priceDropped
      ? `Price Drop: ${productName}`
      : `Price Update: ${productName}`;
    const body = priceDropped
      ? `${productName} dropped from ${prevLabel} to ${currLabel}. Check Smart Store for deals.`
      : `${productName} changed from ${prevLabel} to ${currLabel}.`;

    await createNotification({
      userId: String(watch.user_id),
      category: "price_alert",
      title,
      body,
      link: `/store/p/${watch.product_slug}`,
      sendEmail: true,
      userEmail: profile?.email ? String(profile.email) : null,
      metadata: {
        productSlug: watch.product_slug,
        previousCents: lastKnown,
        currentCents,
        priceDropped,
      },
    });

    await admin
      .from("ni_store_price_watches")
      .update({ last_notified_at: new Date().toISOString() })
      .eq("id", watch.id);

    notified++;
  }

  return notified;
}
