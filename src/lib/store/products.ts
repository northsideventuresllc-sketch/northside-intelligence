import "server-only";

import { createServiceClient } from "@/lib/supabase/server";

export interface StoreProduct {
  id: string;
  slug: string;
  name: string;
  description: string;
  priceCents: number;
  currency: string;
  imageUrl: string | null;
  cjProductId: string | null;
  stripePriceId: string | null;
  isMock: boolean;
  sortOrder: number;
}

function mapRow(row: Record<string, unknown>): StoreProduct {
  return {
    id: String(row.id),
    slug: String(row.slug),
    name: String(row.name),
    description: String(row.description ?? ""),
    priceCents: Number(row.price_cents),
    currency: String(row.currency ?? "usd"),
    imageUrl: (row.image_url as string) ?? null,
    cjProductId: (row.cj_product_id as string) ?? null,
    stripePriceId: (row.stripe_price_id as string) ?? null,
    isMock: Boolean(row.is_mock),
    sortOrder: Number(row.sort_order ?? 0),
  };
}

export async function listActiveStoreProducts(): Promise<StoreProduct[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("ni_store_products")
    .select("*")
    .eq("active", true)
    .order("sort_order", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []).map(mapRow);
}

export async function getStoreProductBySlug(slug: string): Promise<StoreProduct | null> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("ni_store_products")
    .select("*")
    .eq("slug", slug)
    .eq("active", true)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? mapRow(data) : null;
}
