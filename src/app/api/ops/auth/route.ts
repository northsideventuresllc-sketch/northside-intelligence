import { NextRequest, NextResponse } from "next/server";

const OPS_COOKIE = "ni_ops_token";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export async function POST(request: NextRequest) {
  const adminSecret = process.env.NI_ADMIN_SECRET;

  if (!adminSecret) {
    return NextResponse.json(
      { error: "Server misconfigured: NI_ADMIN_SECRET not set" },
      { status: 500 }
    );
  }

  let body: { password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const password = body.password?.trim();
  if (!password || password !== adminSecret) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set(OPS_COOKIE, adminSecret, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });

  return response;
}
