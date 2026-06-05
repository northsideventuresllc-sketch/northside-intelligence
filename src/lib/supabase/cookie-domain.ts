function resolveCookieDomain(host?: string | null): string | undefined {
  const configured =
    process.env.NEXT_PUBLIC_AUTH_COOKIE_DOMAIN ||
    (process.env.NODE_ENV === "production" ? ".northsideintelligence.com" : undefined);

  if (!configured) return undefined;

  if (!host) return configured;

  const hostname = host.split(":")[0].toLowerCase();

  if (hostname === "localhost" || hostname.endsWith(".localhost")) {
    return undefined;
  }

  // Preview deployments cannot use the production cookie domain.
  if (hostname.endsWith(".vercel.app")) {
    return undefined;
  }

  if (hostname === "northsideintelligence.com" || hostname.endsWith(".northsideintelligence.com")) {
    return configured;
  }

  return undefined;
}

/** Shared Supabase session cookies across *.northsideintelligence.com in production. */
export function supabaseCookieOptions(
  options?: Record<string, unknown>,
  host?: string | null
): Record<string, unknown> {
  const domain = resolveCookieDomain(host);
  if (!domain) return options ?? {};
  return { ...options, domain };
}
