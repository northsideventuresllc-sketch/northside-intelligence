/** Public AXON URL: northsideintelligence.com/axon-{username} */
export function axonPublicPath(username: string, suffix = ""): string {
  const slug = username.trim().toLowerCase();
  const base = `/axon-${slug}`;
  if (!suffix) return base;
  return suffix.startsWith("/") ? `${base}${suffix}` : `${base}/${suffix}`;
}

export function axonInternalPath(username: string, suffix = ""): string {
  const slug = username.trim().toLowerCase();
  const base = `/axon/u/${slug}`;
  if (!suffix) return base;
  return suffix.startsWith("/") ? `${base}${suffix}` : `${base}/${suffix}`;
}

export function parseAxonPublicPath(pathname: string): { username: string; rest: string } | null {
  const match = pathname.match(/^\/axon-([a-z0-9_]+)(\/.*)?$/i);
  if (!match) return null;
  return {
    username: match[1]!.toLowerCase(),
    rest: match[2] ?? "",
  };
}

export function apiUrl(path: string, username: string): string {
  return `${axonPublicPath(username)}${path.startsWith("/") ? path : `/${path}`}`;
}
