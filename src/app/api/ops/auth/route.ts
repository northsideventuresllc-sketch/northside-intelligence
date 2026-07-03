import { createHash, timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { mintOpsSessionToken, OPS_COOKIE, OPS_SESSION_TTL_SEC } from "@/lib/ops/session";

function safeSecretCompare(provided: string, expected: string): boolean {
  const a = createHash("sha256").update(provided).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: OPS_SESSION_TTL_SEC,
};

export async function POST(request: NextRequest) {
  const adminSecret = process.env.NI_ADMIN_SECRET;
  const sessionSecret = process.env.OPS_SESSION_SECRET;

  if (!adminSecret) {
    return NextResponse.json(
      { error: "Server misconfigured: NI_ADMIN_SECRET not set" },
      { status: 500 }
    );
  }

  if (!sessionSecret) {
    return NextResponse.json(
      { error: "Server misconfigured: OPS_SESSION_SECRET not set" },
      { status: 500 }
    );
  }

  let body: { password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const password = body.password?.trim() ?? "";
  if (!password || !safeSecretCompare(password, adminSecret)) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  let token: string;
  try {
    token = await mintOpsSessionToken();
  } catch {
    return NextResponse.json(
      { error: "Server misconfigured: OPS_SESSION_SECRET not set" },
      { status: 500 }
    );
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set(OPS_COOKIE, token, cookieOptions);
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.set(OPS_COOKIE, "", { ...cookieOptions, maxAge: 0 });
  return response;
}
