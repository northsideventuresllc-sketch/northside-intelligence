import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { portalSignInUrl } from "@/lib/replyflow/auth";
import { updateSession } from "@/lib/supabase/middleware";
import { supabaseCookieOptions } from "@/lib/supabase/cookie-domain";

const OPS_COOKIE = "ni_ops_token";
const PUBLIC_OPS_PATHS = ["/ops/login", "/api/ops/auth"];

function isReplyFlowHost(host: string): boolean {
  return host.startsWith("replyflow.") || host.includes("replyflow-");
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

  const faviconRewrite = rewriteReplyFlowFavicon(request);
  if (faviconRewrite) return faviconRewrite;

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
    pathname.startsWith("/tools") ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/billing") ||
    pathname.startsWith("/replyflow") ||
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
    "/tools/:path*",
    "/api/billing/:path*",
    "/auth/:path*",
    "/api/auth/:path*",
    "/replyflow/dashboard/:path*",
    "/replyflow/login",
    "/replyflow/signup",
    "/((?!_next/static|_next/image).*)",
  ],
};
