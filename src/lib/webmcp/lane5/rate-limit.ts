import { createHash } from "node:crypto";
/**
 * In-memory per-IP token bucket. Per-instance only — this does NOT share state across
 * Vercel lambda instances/regions, so the effective global ceiling is
 * (concurrent warm instances) x LIMIT per WINDOW_MS, not a hard global cap. Good enough
 * to blunt a single runaway client; not a substitute for an edge/WAF rate limiter.
 */

const WINDOW_MS = 60_000;
const LIMIT = 30;

type Bucket = { tokens: number; windowStart: number };

const buckets = new Map<string, Bucket>();

// Bound memory: forget IPs that haven't called in a while, checked opportunistically.
const MAX_TRACKED_IPS = 5_000;

export function rateLimitCheck(key: string): { allowed: boolean; retryAfterSeconds: number } {
  const now = Date.now();
  let bucket = buckets.get(key);

  if (!bucket || now - bucket.windowStart >= WINDOW_MS) {
    bucket = { tokens: LIMIT, windowStart: now };
    buckets.set(key, bucket);
  }

  if (buckets.size > MAX_TRACKED_IPS) {
    buckets.forEach((b, k) => {
      if (now - b.windowStart >= WINDOW_MS) buckets.delete(k);
    });
  }

  if (bucket.tokens <= 0) {
    const retryAfterSeconds = Math.max(1, Math.ceil((bucket.windowStart + WINDOW_MS - now) / 1000));
    return { allowed: false, retryAfterSeconds };
  }

  bucket.tokens -= 1;
  return { allowed: true, retryAfterSeconds: 0 };
}

export function clientKeyFromHeaders(headers: Headers): string {
  // Vercel sets x-vercel-forwarded-for / x-real-ip itself; prefer those over client-controllable values.
  const vercel = headers.get("x-vercel-forwarded-for");
  if (vercel) return vercel.split(",")[0]!.trim();
  const real = headers.get("x-real-ip");
  if (real) return real.trim();
  const fwd = headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return "unknown";
}

/** One-way hash of the client key, so metering rows never store a raw IP. */
export function clientKeyHash(headers: Headers): string {
  return createHash("sha256").update(`webmcp:${clientKeyFromHeaders(headers)}`).digest("hex").slice(0, 16);
}
