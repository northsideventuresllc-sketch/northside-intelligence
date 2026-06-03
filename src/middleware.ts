import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const OPS_COOKIE = "ni_ops_token";
const PUBLIC_OPS_PATHS = ["/ops/login", "/api/ops/auth"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith("/ops")) {
    return NextResponse.next();
  }

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

export const config = {
  matcher: ["/ops/:path*"],
};
