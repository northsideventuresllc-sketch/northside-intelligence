import "server-only";

import { createHmac, timingSafeEqual } from "crypto";
import type { NextRequest, NextResponse } from "next/server";

export const AXON_SESSION_COOKIE = "ni_axon_session";
const SESSION_MAX_AGE_SEC = 60 * 60 * 12; // 12 hours

function sessionSecret(): string | null {
  const secret = process.env.AXON_SESSION_SECRET?.trim() || process.env.NI_ADMIN_SECRET?.trim();
  return secret || null;
}

function signPayload(userId: string, expiresAt: number): string {
  const secret = sessionSecret();
  if (!secret) throw new Error("AXON session secret not configured");
  return createHmac("sha256", secret).update(`${userId}:${expiresAt}`).digest("hex");
}

export function createAxonSessionToken(userId: string): string {
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SEC;
  const signature = signPayload(userId, expiresAt);
  return `${userId}.${expiresAt}.${signature}`;
}

export function verifyAxonSessionToken(token: string, userId: string): boolean {
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [tokenUserId, expiresRaw, signature] = parts;
  if (tokenUserId !== userId) return false;
  const expiresAt = Number(expiresRaw);
  if (!Number.isFinite(expiresAt) || expiresAt < Math.floor(Date.now() / 1000)) return false;

  let expected: string;
  try {
    expected = signPayload(userId, expiresAt);
  } catch {
    return false;
  }

  try {
    return timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false;
  }
}

export function readAxonSessionFromRequest(request: NextRequest, userId: string): boolean {
  const token = request.cookies.get(AXON_SESSION_COOKIE)?.value;
  if (!token) return false;
  return verifyAxonSessionToken(token, userId);
}

export function readAxonSessionFromCookieValue(
  token: string | undefined,
  userId: string
): boolean {
  if (!token) return false;
  return verifyAxonSessionToken(token, userId);
}

export function setAxonSessionCookie(response: NextResponse, userId: string): void {
  const token = createAxonSessionToken(userId);
  response.cookies.set(AXON_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SEC,
  });
}

export function clearAxonSessionCookie(response: NextResponse): void {
  response.cookies.set(AXON_SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}
