import "server-only";

export function parseCjImageList(raw: unknown): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw.map(String).filter((url) => url.startsWith("http"));
  }
  if (typeof raw === "string") {
    const trimmed = raw.trim();
    if (trimmed.startsWith("http")) return [trimmed];
    try {
      const parsed = JSON.parse(trimmed) as unknown;
      if (Array.isArray(parsed)) {
        return parsed.map(String).filter((url) => url.startsWith("http"));
      }
    } catch {
      return [];
    }
  }
  return [];
}

export async function isImageUrlReachable(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { method: "HEAD", next: { revalidate: 86400 } });
    const type = res.headers.get("content-type") ?? "";
    return res.ok && type.startsWith("image/");
  } catch {
    return false;
  }
}

export async function pickFirstReachableImage(candidates: string[]): Promise<string | null> {
  const unique = Array.from(new Set(candidates.map((c) => c.trim()).filter(Boolean)));
  for (const url of unique) {
    if (await isImageUrlReachable(url)) return url;
  }
  return unique[0] ?? null;
}
