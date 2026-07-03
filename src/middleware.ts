import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { portalSignInUrl } from "@/lib/replyflow/auth";
import { updateSession } from "@/lib/supabase/middleware";
import { supabaseCookieOptions } from "@/lib/supabase/cookie-domain";

const OPS_COOKIE = "ni_ops_token";
const PUBLIC_OPS_PATHS = ["/ops/login", "/api/ops/auth"];

/** Portal routes that must not be rewritten on tool subdomains. */
const PORTAL_PATH_PREFIXES = [
  "/toolkit",
  "/account",
  "/admin",
  "/axon",
  "/auth",
  "/tools",
  "/store",
  "/legal",
  "/feedback",
  "/ops",
  "/api/billing",
  "/api/auth",
  "/api/account",
  "/api/store",
] as const;

function isPortalPath(pathname: string): boolean {
  return PORTAL_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

function portalOrigin(): string {
  return process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "https://www.northsideintelligence.com";
}

function redirectReplyFlowPortalPath(request: NextRequest): NextResponse | null {
  const host = request.headers.get("host") ?? "";
  if (!isReplyFlowHost(host)) return null;

  const { pathname, search } = request.nextUrl;
  if (!isPortalPath(pathname)) return null;

  return NextResponse.redirect(new URL(`${pathname}${search}`, portalOrigin()));
}

function isReplyFlowHost(host: string): boolean {
  return host.startsWith("replyflow.") || host.includes("replyflow-");
}

function isShopHost(host: string): boolean {
  return host.startsWith("shop.");
}

function rewriteShopSubdomain(request: NextRequest): NextResponse | null {
  const host = request.headers.get("host") ?? "";
  if (!isShopHost(host)) return null;

  const { pathname } = request.nextUrl;
  if (pathname.startsWith("/store") || pathname.startsWith("/api/store")) {
    return null;
  }

  const url = request.nextUrl.clone();
  if (pathname.startsWith("/api/")) {
    url.pathname = `/api/store${pathname.slice(4)}`;
  } else {
    url.pathname = pathname === "/" ? "/store" : `/store${pathname}`;
  }
  return NextResponse.rewrite(url);
}

function rewriteReplyFlowFavicon(request: NextRequest): NextResponse | null {
  const host = request.headers.get("host") ?? "";
  if (!isReplyFlowHost(host)) return null;

  const { pathname } = request.nextUrl;
  if (pathname !== "/favicon.ico" && pathname !== "/icon.svg") return null;

  const url = request.nextUrl.clone();
  url.pathname = "/replyflow/icon.svg";
  return NextResponse.rewrite(url);
}

function rewriteReplyFlowSubdomain(request: NextRequest): NextResponse | null {
  const host = request.headers.get("host") ?? "";
  if (!isReplyFlowHost(host)) return null;

  const { pathname } = request.nextUrl;
  if (pathname.startsWith("/replyflow") || pathname.startsWith("/api/replyflow")) {
    return null;
  }

  const url = request.nextUrl.clone();
  if (pathname.startsWith("/api/")) {
    url.pathname = `/api/replyflow${pathname.slice(4)}`;
  } else {
    url.pathname = pathname === "/" ? "/replyflow" : `/replyflow${pathname}`;
  }
  return NextResponse.rewrite(url);
}

async function guardReplyFlowDashboard(request: NextRequest): Promise<NextResponse | null> {
  const { pathname } = request.nextUrl;
  if (!pathname.startsWith("/replyflow/dashboard")) return null;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) return null;

  let response = NextResponse.next({ request });
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, supabaseCookieOptions(options))
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(portalSignInUrl());
  }

  return response;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const axonPublicMatch = pathname.match(/^\/axon-([a-z0-9_]+)(\/.*)?$/i);
  if (axonPublicMatch && !pathname.includes("/api/")) {
    const username = axonPublicMatch[1]!.toLowerCase();
    const rest = axonPublicMatch[2] ?? "";
    const url = request.nextUrl.clone();
    url.pathname = `/axon/u/${username}${rest}`;
    return NextResponse.rewrite(url);
  }

  const faviconRewrite = rewriteReplyFlowFavicon(request);
  if (faviconRewrite) return faviconRewrite;

  const shopRewrite = rewriteShopSubdomain(request);
  if (shopRewrite) return shopRewrite;

  const portalRedirect = redirectReplyFlowPortalPath(request);
  if (portalRedirect) return portalRedirect;

  const subdomainRewrite = rewriteReplyFlowSubdomain(request);
  if (subdomainRewrite) return subdomainRewrite;

  if (pathname.startsWith("/replyflow/login") || pathname.startsWith("/replyflow/signup")) {
    return NextResponse.next();
  }

  const dashboardGuard = await guardReplyFlowDashboard(request);
  if (dashboardGuard) return dashboardGuard;

  if (pathname.startsWith("/ops")) {
    if (PUBLIC_OPS_PATHS.some((p) => pathname.startsWith(p))) {
      return NextResponse.next();
    }

    const adminSecret = process.env.NI_ADMIN_SECRET;
    const token = request.cookies.get(OPS_COOKIE)?.value;

    if (!adminSecret || token !== adminSecret) {
      const loginUrl = new URL("/ops/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
  }

  const host = request.headers.get("host") ?? "";
  const needsSessionRefresh =
    pathname.startsWith("/account") ||
    pathname.startsWith("/toolkit") ||
    pathname.startsWith("/store") ||
    pathname.startsWith("/services") ||
    pathname.startsWith("/tools") ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/billing") ||
    pathname.startsWith("/api/store") ||
    pathname.startsWith("/api/services") ||
    pathname.startsWith("/replyflow") ||
    pathname.startsWith("/grantbot") ||
    isReplyFlowHost(host);

  if (!needsSessionRefresh) {
    return NextResponse.next();
  }

  return updateSession(request);
}

export const config = {
  matcher: [
    "/favicon.ico",
    "/icon.svg",
    "/ops/:path*",
    "/account/:path*",
    "/toolkit/:path*",
    "/store/:path*",
    "/tools/:path*",
    "/api/store/:path*",
    "/api/billing/:path*",
    "/auth/:path*",
    "/api/auth/:path*",
    "/replyflow/dashboard/:path*",
    "/replyflow/login",
    "/replyflow/signup",
    "/grantbot/:path*",
    "/((?!_next/static|_next/image).*)",
  ],
};
