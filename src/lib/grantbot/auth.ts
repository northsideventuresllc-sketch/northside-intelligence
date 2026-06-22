import { buildPortalAuthUrl } from "@/lib/ni-auth";
import { PORTAL_URL } from "@/lib/sector3-registry";

export const GRANTBOT_BASE_PATH = "/grantbot";

export function grantbotAppUrl(): string {
  if (process.env.NEXT_PUBLIC_GRANTBOT_URL) {
    return process.env.NEXT_PUBLIC_GRANTBOT_URL.replace(/\/$/, "");
  }
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  if (appUrl && !appUrl.includes("localhost")) {
    return `${appUrl}${GRANTBOT_BASE_PATH}`;
  }
  return `${PORTAL_URL}${GRANTBOT_BASE_PATH}`;
}

export function grantbotPath(path = "/"): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (normalized === "/") return GRANTBOT_BASE_PATH;
  return `${GRANTBOT_BASE_PATH}${normalized}`;
}

export function portalSignInUrl(returnTo?: string) {
  return buildPortalAuthUrl("signin", returnTo ?? `${grantbotAppUrl()}/dashboard`);
}

export function portalSignUpUrl(returnTo?: string) {
  return buildPortalAuthUrl("signup", returnTo ?? `${grantbotAppUrl()}/dashboard`);
}
