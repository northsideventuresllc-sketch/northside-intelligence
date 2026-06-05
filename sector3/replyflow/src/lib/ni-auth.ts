const PORTAL_URL =
  process.env.NEXT_PUBLIC_PORTAL_URL ?? "https://northsideintelligence.com";

const ALLOWED_RETURN_ORIGINS = [
  "https://northsideintelligence.com",
  "https://www.northsideintelligence.com",
  "https://replyflow.northsideintelligence.com",
  "https://replyflow-murex.vercel.app",
  "http://localhost:3000",
  "http://localhost:3001",
];

export type NiAuthMode = "signin" | "signup";

export function toolReturnUrl(path = "/dashboard"): string {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return `${base.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
}

export function buildPortalAuthUrl(mode: NiAuthMode, returnTo?: string): string {
  const path = mode === "signup" ? "/auth/signup" : "/auth/signin";
  const base = `${PORTAL_URL}${path}`;
  if (!returnTo) return base;
  return `${base}?returnTo=${encodeURIComponent(returnTo)}`;
}

export function portalSignInUrl(returnTo?: string) {
  return buildPortalAuthUrl("signin", returnTo ?? toolReturnUrl("/dashboard"));
}

export function portalSignUpUrl(returnTo?: string) {
  return buildPortalAuthUrl("signup", returnTo ?? toolReturnUrl("/dashboard"));
}
