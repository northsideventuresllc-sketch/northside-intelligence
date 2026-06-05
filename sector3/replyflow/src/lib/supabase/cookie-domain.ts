export function supabaseCookieOptions(
  options?: Record<string, unknown>
): Record<string, unknown> {
  const domain =
    process.env.NEXT_PUBLIC_AUTH_COOKIE_DOMAIN ||
    (process.env.NODE_ENV === "production" ? ".northsideintelligence.com" : undefined);

  if (!domain) return options ?? {};
  return { ...options, domain };
}
