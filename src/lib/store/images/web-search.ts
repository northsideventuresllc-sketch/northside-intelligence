import "server-only";

/**
 * Optional web image fallback when supplier image is missing or broken.
 * Set SERPAPI_API_KEY in env or ni_platform_secrets to enable.
 */
export async function searchWebProductImage(query: string): Promise<string | null> {
  const apiKey = process.env.SERPAPI_API_KEY?.trim();
  if (!apiKey || !query.trim()) return null;

  try {
    const params = new URLSearchParams({
      engine: "google_images",
      q: query.trim(),
      api_key: apiKey,
      num: "5",
      safe: "active",
    });
    const res = await fetch(`https://serpapi.com/search.json?${params.toString()}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;

    const json = (await res.json()) as {
      images_results?: Array<{ original?: string; thumbnail?: string }>;
    };
    for (const hit of json.images_results ?? []) {
      const candidate = hit.original ?? hit.thumbnail;
      if (candidate?.startsWith("http")) return candidate;
    }
    return null;
  } catch (err) {
    console.warn("[store/images] web search failed:", err);
    return null;
  }
}
