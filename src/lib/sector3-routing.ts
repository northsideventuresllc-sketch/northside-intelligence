import { SECTOR3_REGISTRY, type Sector3ToolSlug } from "@/lib/sector3-registry";

export interface Sector3RouteInfo {
  slug: Sector3ToolSlug;
  landingPath: string;
  dashboardPath: string;
  status: "LIVE" | "COMING SOON";
}

function entryToRoute(slug: Sector3ToolSlug): Sector3RouteInfo {
  const entry = SECTOR3_REGISTRY.find((t) => t.slug === slug);
  if (!entry) throw new Error(`Unknown Sector 3 tool: ${slug}`);
  const basePath = entry.appUrl
    ? new URL(entry.appUrl).pathname.replace(/\/$/, "") || `/${slug}`
    : `/${slug}`;
  return {
    slug,
    landingPath: basePath,
    dashboardPath: `${basePath}/dashboard`,
    status: entry.status,
  };
}

const routeBySlug = new Map(
  SECTOR3_REGISTRY.map((entry) => [entry.slug, entryToRoute(entry.slug)])
);

export function getSector3Route(slug: string): Sector3RouteInfo | null {
  if (!routeBySlug.has(slug as Sector3ToolSlug)) return null;
  return routeBySlug.get(slug as Sector3ToolSlug)!;
}

export function getLiveSector3Routes(): Sector3RouteInfo[] {
  return SECTOR3_REGISTRY.filter((t) => t.status === "LIVE").map((t) =>
    entryToRoute(t.slug)
  );
}

/** Landing paths for live Sector 3 tools (e.g. `/replyflow`). */
export function getSector3LandingPaths(): string[] {
  return getLiveSector3Routes().map((r) => r.landingPath);
}

export function getSector3DashboardPath(slug: string): string | null {
  const route = getSector3Route(slug);
  if (!route || route.status !== "LIVE") return null;
  return route.dashboardPath;
}

export function resolveSector3DashboardFromPath(pathname: string): string | null {
  const normalized = pathname.replace(/\/$/, "") || "/";
  for (const route of getLiveSector3Routes()) {
    if (normalized === route.landingPath) return route.dashboardPath;
  }
  return null;
}
