import { buildPortalAuthUrl } from "@/lib/ni-auth";

export const REPLYFLOW_BASE_PATH = "/replyflow";

export function replyflowAppUrl(): string {
  if (process.env.NEXT_PUBLIC_REPLYFLOW_URL) {
    return process.env.NEXT_PUBLIC_REPLYFLOW_URL.replace(/\/$/, "");
  }
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(
    /\/$/,
    ""
  );
  return `${appUrl}${REPLYFLOW_BASE_PATH}`;
}

export function replyflowPath(path = "/"): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (normalized === "/") return REPLYFLOW_BASE_PATH;
  return `${REPLYFLOW_BASE_PATH}${normalized}`;
}

export function portalSignInUrl(returnTo?: string) {
  return buildPortalAuthUrl("signin", returnTo ?? `${replyflowAppUrl()}/dashboard`);
}

export function portalSignUpUrl(returnTo?: string) {
  return buildPortalAuthUrl("signup", returnTo ?? `${replyflowAppUrl()}/dashboard`);
}
