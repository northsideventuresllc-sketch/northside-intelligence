import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const OPS_COOKIE = "ni_ops_token";
const PUBLIC_OPS_PATHS = ["/ops/login", "/api/ops/auth"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

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

  return updateSession(request);
}

export const config = {
  matcher: [
    "/ops/:path*",
    "/account/:path*",
    "/auth/:path*",
    "/api/auth/:path*",
  ],
};
