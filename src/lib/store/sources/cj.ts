import "server-only";

/**
 * CJ Dropshipping API integration.
 * Requires CJ_DROPSHIPPING_API_KEY — returns [] when not configured.
 * Docs: https://developers.cjdropshipping.com/
 */
export interface CjProductDraft {
  name: string;
  description: string;
  imageUrl: string;
  category: string;
  tags: string[];
  sourceProductId: string;
  supplierCostCents: number;
  estimatedDeliveryDays: number;
}

export async function fetchCjTrendingProducts(limit = 10): Promise<CjProductDraft[]> {
  const apiKey = process.env.CJ_DROPSHIPPING_API_KEY?.trim();
  if (!apiKey) return [];

  try {
    const res = await fetch("https://developers.cjdropshipping.com/api2.0/v1/product/list", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "CJ-Access-Token": apiKey,
      },
      body: JSON.stringify({
        pageNum: 1,
        pageSize: limit,
        productType: "ORDINARY_PRODUCT",
        orderBy: "sales",
      }),
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      console.warn("[store/cj] product list failed:", res.status);
      return [];
    }

    const json = (await res.json()) as {
      data?: {
        list?: Array<{
          pid?: string;
          productName?: string;
          productDescription?: string;
          productImage?: string;
          categoryName?: string;
          sellPrice?: number;
          deliveryTime?: string;
        }>;
      };
    };

    return (json.data?.list ?? []).map((item) => ({
      name: item.productName ?? "Trending Product",
      description: item.productDescription ?? "",
      imageUrl: item.productImage ?? "",
      category: (item.categoryName ?? "general").toLowerCase().replace(/\s+/g, "-"),
      tags: ["cj", "trending"],
      sourceProductId: item.pid ?? "",
      supplierCostCents: Math.round((item.sellPrice ?? 10) * 100),
      estimatedDeliveryDays: parseInt(item.deliveryTime ?? "12", 10) || 12,
    }));
  } catch (err) {
    console.warn("[store/cj] fetch error:", err);
    return [];
  }
}
