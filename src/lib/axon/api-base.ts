/** Client/API URL — API routes stay at site root; pages use optional AXON vanity base. */
export function apiUrl(path: string, _basePath = ""): string {
  if (path.startsWith("/api/")) return path;
  const base = _basePath || process.env.NEXT_PUBLIC_AXON_BASE_PATH || "";
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}
