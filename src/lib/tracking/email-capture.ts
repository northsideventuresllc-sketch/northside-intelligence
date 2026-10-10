/**
 * Workstream 10 (client-readiness sweep): 72-hour visitor email capture.
 *
 * The moment a visitor enters their email anywhere on the property
 * (waitlists, service quote requests, portal signup, feedback forms, store
 * order tracking, store checkout), the receiving API route calls
 * `recordEmailCapture()` and a client helper fires the Meta `Lead` event via
 * the existing pixel (`trackEvent` in @/components/MetaPixel).
 *
 * Retention contract (disclosed in ToS/Privacy by Workstream 11):
 *  - Stored minimum: email + sha256 hash + source page/tool + captured_at.
 *    No passwords, no message bodies, nothing else.
 *  - Every row expires exactly 72h after capture (`expires_at`).
 *  - GET /api/cron/email-capture-cleanup (hourly Vercel cron) deletes every
 *    row with expires_at < now(). Storage is never indefinite.
 *  - Re-entering the same email refreshes the 72h window from the latest
 *    capture; retention never exceeds 72h from last capture.
 *
 * This module never throws: a capture failure is logged and swallowed so the
 * primary flow (signup, quote, checkout, …) can never break because of it.
 */
import { createHash } from "crypto";
import { createServiceClient } from "@/lib/supabase/server";

/** Retention window in hours. JB scoped this to 72h — do not extend. */
export const EMAIL_CAPTURE_TTL_HOURS = 72;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_EMAIL_LEN = 320;
const MAX_SOURCE_LEN = 200;

/** Normalize + validate. Returns null for anything that isn't a sane email. */
export function normalizeEmailCapture(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const v = raw.trim().toLowerCase();
  if (!v || v.length > MAX_EMAIL_LEN || !EMAIL_RE.test(v)) return null;
  return v;
}

/** sha256 of the normalized email — used for dedupe, never as a substitute. */
export function hashEmailCapture(normalizedEmail: string): string {
  return createHash("sha256").update(normalizedEmail).digest("hex");
}

function expiryIso(fromMs: number): string {
  return new Date(fromMs + EMAIL_CAPTURE_TTL_HOURS * 3600 * 1000).toISOString();
}

function cleanSource(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const v = raw.trim().slice(0, MAX_SOURCE_LEN);
  return v || null;
}

export interface EmailCaptureInput {
  email: string;
  /** e.g. "/axon" — request path or page path, optional. */
  sourcePage?: string;
  /** e.g. "axon_waitlist" — which entry point captured it, required. */
  sourceTool: string;
}

/**
 * Record (or refresh) a 72h email capture. Safe to call from any API route:
 * failures are logged, never thrown.
 */
export async function recordEmailCapture(
  input: EmailCaptureInput
): Promise<{ ok: boolean }> {
  try {
    const email = normalizeEmailCapture(input.email);
    const sourceTool = cleanSource(input.sourceTool) ?? "unknown";
    if (!email) return { ok: false };

    const supabase = createServiceClient();
    const email_hash = hashEmailCapture(email);
    const nowIso = new Date().toISOString();
    const source_page = cleanSource(input.sourcePage);

    // Dedupe: same email still inside its 72h window → refresh the window
    // from this capture instead of writing a duplicate row.
    const { data: existing } = await supabase
      .from("email_captures")
      .select("id")
      .eq("email_hash", email_hash)
      .gt("expires_at", nowIso)
      .limit(1)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase
        .from("email_captures")
        .update({
          captured_at: nowIso,
          expires_at: expiryIso(Date.now()),
          source_page,
          source_tool: sourceTool,
        })
        .eq("id", existing.id);
      if (error) {
        console.error("[email-capture] refresh failed:", error.message);
        return { ok: false };
      }
      return { ok: true };
    }

    const { error } = await supabase.from("email_captures").insert({
      email,
      email_hash,
      source_page,
      source_tool: sourceTool,
    });
    if (error) {
      console.error("[email-capture] insert failed:", error.message);
      return { ok: false };
    }
    return { ok: true };
  } catch (err) {
    console.error(
      "[email-capture] failed:",
      err instanceof Error ? err.message : err
    );
    return { ok: false };
  }
}

/**
 * Delete every capture older than 72h. Called by the hourly Vercel cron
 * (GET /api/cron/email-capture-cleanup). Returns the delete count.
 */
export async function purgeExpiredEmailCaptures(): Promise<{ deleted: number }> {
  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("email_captures")
      .delete()
      .lt("expires_at", new Date().toISOString())
      .select("id");
    if (error) {
      console.error("[email-capture] purge failed:", error.message);
      return { deleted: 0 };
    }
    return { deleted: data?.length ?? 0 };
  } catch (err) {
    console.error(
      "[email-capture] purge failed:",
      err instanceof Error ? err.message : err
    );
    return { deleted: 0 };
  }
}
