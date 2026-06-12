/** Shared Supabase session cookies across *.northsideintelligence.com in production. */
export function supabaseCookieOptions(
  options?: Record<string, unknown>
): Record<string, unknown> {
  const domain =
    process.env.NEXT_PUBLIC_AUTH_COOKIE_DOMAIN ||
    (process.env.NODE_ENV === "production" ? ".northsideintelligence.com" : undefined);

  if (!domain) return options ?? {};
  return { ...options, domain };
}

/** OTP pending session cookie — same domain as Supabase auth cookies in production. */
export function pendingAuthCookieOptions(
  overrides?: Record<string, unknown>
): Record<string, unknown> {
  return supabaseCookieOptions({
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 10,
    ...overrides,
  });
}
