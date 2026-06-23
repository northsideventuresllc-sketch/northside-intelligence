import { buildPortalAuthUrl } from "@/lib/ni-auth";
import { PORTAL_URL } from "@/lib/sector3-registry";
import type { Sector3ToolRuntimeConfig } from "./types";

export function createSector3ToolAuth(config: Sector3ToolRuntimeConfig) {
  const envKey = `NEXT_PUBLIC_${config.slug.toUpperCase()}_URL`;

  function appUrl(): string {
    const dedicated = process.env[envKey];
    if (dedicated) return dedicated.replace(/\/$/, "");
    const app = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
    if (app && !app.includes("localhost")) {
      return `${app}${config.basePath}`;
    }
    return `${PORTAL_URL}${config.basePath}`;
  }

  function path(route = "/"): string {
    const normalized = route.startsWith("/") ? route : `/${route}`;
    if (normalized === "/") return config.basePath;
    return `${config.basePath}${normalized}`;
  }

  function portalSignInUrl(returnTo?: string) {
    return buildPortalAuthUrl("signin", returnTo ?? `${appUrl()}/dashboard`);
  }

  function portalSignUpUrl(returnTo?: string) {
    return buildPortalAuthUrl("signup", returnTo ?? `${appUrl()}/dashboard`);
  }

  return { appUrl, path, portalSignInUrl, portalSignUpUrl };
}
