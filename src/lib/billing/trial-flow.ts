import "server-only";

import { createServiceClient } from "@/lib/supabase/server";
import { sendNoreplyEmail, buildNiEmailHtml } from "@/lib/email/noreply";
import { createNotification } from "@/lib/notifications/service";

/**
 * Trial code promo flow (launched 2026-10-10).
 *
 * - New signups are redirected to /trial-code after normal signup.
 * - A unique code is generated per user, valid 48 hours, emailed to them.
 * - The code is permanently assigned to the user's account.
 * - Anti-abuse: trial issuance is tracked by email in trial_codes metadata.
 *   A deleted user re-registering with the same email never gets a new trial.
 */

export const TRIAL_PROMO_START = new Date("2026-10-10T00:00:00.000Z");
export const TRIAL_CODE_VALIDITY_HOURS = 48;
export const TRIAL_DURATION_DAYS = 7;

function randomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 8; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return `NI-${out.slice(0, 4)}-${out.slice(4)}`;
}

export interface TrialEligibility {
  eligible: boolean;
  reason?: string;
  existingCode?: string;
}

/**
 * Check whether a user/email is eligible for a NEW trial code.
 * Ineligible if: they (or any account with their email) ever had a trial code.
 */
export async function checkTrialEligibility(
  userId: string,
  email: string
): Promise<TrialEligibility> {
  const supabase = createServiceClient();
  const normalizedEmail = email.trim().toLowerCase();

  // 1. Does this user already have a code assigned?
  const { data: userCode } = await supabase
    .from("trial_codes")
    .select("code, used_at, expires_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (userCode) {
    return {
      eligible: false,
      reason: "A trial code has already been issued for this account.",
      existingCode: userCode.code,
    };
  }

  // 2. Has this email EVER had a trial code (anti-abuse, survives deletion)?
  const { data: emailCodes } = await supabase
    .from("trial_codes")
    .select("id")
    .eq("metadata->>email", normalizedEmail)
    .limit(1);

  if (emailCodes && emailCodes.length > 0) {
    return {
      eligible: false,
      reason:
        "A free trial has already been used with this email address.",
    };
  }

  return { eligible: true };
}

/**
 * Generate a trial code for a user. Idempotent: returns the existing code
 * if one was already issued. Permanently assigns the code to the account.
 */
export async function generateTrialCodeForUser(
  userId: string,
  email: string,
  toolSlug: string | null = "all"
): Promise<{ code: string; expiresAt: string; isNew: boolean; error?: string }> {
  const supabase = createServiceClient();
  const normalizedEmail = email.trim().toLowerCase();

  const eligibility = await checkTrialEligibility(userId, normalizedEmail);
  if (!eligibility.eligible) {
    if (eligibility.existingCode) {
      const { data: rec } = await supabase
        .from("trial_codes")
        .select("expires_at")
        .eq("code", eligibility.existingCode)
        .maybeSingle();
      return {
        code: eligibility.existingCode,
        expiresAt: rec?.expires_at ?? "",
        isNew: false,
      };
    }
    return { code: "", expiresAt: "", isNew: false, error: eligibility.reason };
  }

  const code = randomCode();
  const codeExpiresAt = new Date(
    Date.now() + TRIAL_CODE_VALIDITY_HOURS * 60 * 60 * 1000
  ).toISOString();

  const { error } = await supabase.from("trial_codes").insert({
    code,
    tool_slug: toolSlug ?? "all",
    user_id: userId,
    used_at: null,
    expires_at: null,
    duration_days: TRIAL_DURATION_DAYS,
    created_by: "trial-promo-auto",
    metadata: {
      email: normalizedEmail,
      promo: "7-day-trial-2026-10",
      code_expires_at: codeExpiresAt,
    },
  });

  if (error) {
    // Race: another request created one first — fetch it
    const { data: rec } = await supabase
      .from("trial_codes")
      .select("code, metadata")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (rec) {
      return {
        code: rec.code,
        expiresAt: (rec.metadata as { code_expires_at?: string })?.code_expires_at ?? "",
        isNew: false,
      };
    }
    return { code: "", expiresAt: "", isNew: false, error: "Failed to generate trial code." };
  }

  return { code, expiresAt: codeExpiresAt, isNew: true };
}

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "https://www.northsideintelligence.com";

export async function sendTrialCodeEmail(
  email: string,
  code: string,
  expiresAt: string
): Promise<void> {
  const expiry = new Date(expiresAt).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
  await sendNoreplyEmail({
    to: email,
    subject: "Your Northside Intelligence free trial code",
    html: buildNiEmailHtml({
      title: "Your 7-day free trial code",
      body: `Here's your personal trial code: <strong style="font-size:20px;letter-spacing:2px;">${code}</strong><br/><br/>Enter it at northsideintelligence.com/trial-code within 48 hours (by ${expiry}) to start your 7-day free trial on any IT. Your card is collected when the trial starts — the trial itself is free.`,
      ctaLabel: "Enter my code",
      ctaHref: `${APP_URL}/trial-code`,
    }),
    idempotencyKey: `trial-code-${code}`,
  });
}

export async function sendWelcomeEmail(email: string, name?: string | null): Promise<void> {
  await sendNoreplyEmail({
    to: email,
    subject: "Welcome to Northside Intelligence",
    html: buildNiEmailHtml({
      title: `Welcome${name ? `, ${name}` : ""}!`,
      body: "Your Northside Intelligence account is ready. Your free 7-day trial code is on its way — check your inbox to activate it and start exploring the Intelligence Tools.",
      ctaLabel: "Go to your portal",
      ctaHref: `${APP_URL}/`,
    }),
    idempotencyKey: `welcome-${email}-${new Date().toISOString().slice(0, 10)}`,
  });
}

export async function sendTrialBegunEmail(
  email: string,
  toolName: string,
  endsAt: string
): Promise<void> {
  const endDate = new Date(endsAt).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  await sendNoreplyEmail({
    to: email,
    subject: `Your ${toolName} trial has begun`,
    html: buildNiEmailHtml({
      title: "Your trial has begun",
      body: `Your 7-day free trial of <strong>${toolName}</strong> is now active. It ends on <strong>${endDate}</strong>, when your card on file will be charged unless you cancel. Enjoy!`,
      ctaLabel: "Open your toolkit",
      ctaHref: `${APP_URL}/toolkit`,
    }),
    idempotencyKey: `trial-begun-${email}-${toolName}`,
  });
}

export async function sendTrialExpiryReminderEmail(
  email: string,
  toolName: string,
  endsAt: string
): Promise<void> {
  await sendNoreplyEmail({
    to: email,
    subject: `Your ${toolName} trial expires tomorrow`,
    html: buildNiEmailHtml({
      title: "Trial expires tomorrow",
      body: `Heads up: your free trial of <strong>${toolName}</strong> ends tomorrow (${new Date(endsAt).toLocaleDateString("en-US", { month: "long", day: "numeric" })}). Your card on file will be charged unless you cancel before then.`,
      ctaLabel: "Manage subscription",
      ctaHref: `${APP_URL}/toolkit`,
    }),
    idempotencyKey: `trial-reminder-${email}-${toolName}`,
  });
}

export async function notifyPortal(
  userId: string,
  kind: "welcome" | "trial_code" | "trial_begun" | "trial_reminder",
  title: string,
  body: string,
  link?: string
): Promise<void> {
  await createNotification({
    userId,
    category: "promo",
    title,
    body,
    link: link ?? null,
    metadata: { kind },
  });
}
