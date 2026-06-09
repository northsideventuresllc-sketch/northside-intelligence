import { PORTAL_URL } from "@/lib/sector3-registry";

/** Origins allowed for post-auth redirects (Sector 3 tools + portal). */
export const ALLOWED_RETURN_ORIGINS = [
  "https://northsideintelligence.com",
  "https://www.northsideintelligence.com",
  "https://replyflow.northsideintelligence.com",
  "https://replyflow-murex.vercel.app",
  "https://northsideintelligence.com/replyflow",
  "https://www.northsideintelligence.com/replyflow",
  "https://grantbot.northsideintelligence.com",
  "http://localhost:3000",
  "http://localhost:3001",
] as const;

export type NiAuthMode = "signin" | "signup";

export function isAllowedReturnTo(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ALLOWED_RETURN_ORIGINS.some(
      (origin) => parsed.origin === origin || parsed.href.startsWith(`${origin}/`)
    );
  } catch {
    return false;
  }
}

export function sanitizeReturnTo(returnTo: string | null | undefined): string | null {
  if (!returnTo?.trim()) return null;
  const value = returnTo.trim();
  if (value.startsWith("/") && !value.startsWith("//")) {
    return value;
  }
  if (isAllowedReturnTo(value)) return value;
  return null;
}

export function buildPortalAuthUrl(mode: NiAuthMode, returnTo?: string | null): string {
  const path = mode === "signup" ? "/auth/signup" : "/auth/signin";
  const base = `${PORTAL_URL}${path}`;
  const safe = sanitizeReturnTo(returnTo);
  if (!safe) return base;
  return `${base}?returnTo=${encodeURIComponent(safe)}`;
}

export function resolvePostAuthRedirect(returnTo: string | null | undefined): string {
  const safe = sanitizeReturnTo(returnTo);
  return safe ?? "/";
}
