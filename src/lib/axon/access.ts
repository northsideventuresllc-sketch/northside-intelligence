import "server-only";

import { getUserBillingState, userCanUseTool } from "@/lib/billing/entitlements";
import {
  generateAxonAccessCode,
  hashAxonAccessCode,
  verifyAxonAccessCode,
} from "@/lib/axon/access-code";
import { sendAxonAccessCodeEmail } from "@/lib/axon/email";
import { createServiceClient } from "@/lib/supabase/server";

export const AXON_TOOL_SLUG = "axon" as const;

export interface AxonAccessRow {
  userId: string;
  accessCodeHash: string;
  accessCodeSalt: string;
  codeSentAt: string | null;
  lastVerifiedAt: string | null;
}

function mapRow(row: Record<string, unknown>): AxonAccessRow {
  return {
    userId: String(row.user_id),
    accessCodeHash: String(row.access_code_hash),
    accessCodeSalt: String(row.access_code_salt),
    codeSentAt: row.code_sent_at != null ? String(row.code_sent_at) : null,
    lastVerifiedAt: row.last_verified_at != null ? String(row.last_verified_at) : null,
  };
}

/** Master accounts see AXON in nav for now; purchasers will use toolkit entitlements later. */
export async function canAccessAxon(userId: string): Promise<boolean> {
  const state = await getUserBillingState(userId);
  if (state.isMasterAccount) return true;
  if (userCanUseTool(state, AXON_TOOL_SLUG)) return true;
  return false;
}

/** Pre-launch portal entry — master account only; everyone else uses the waitlist. */
export async function canEnterAxonPortal(userId: string): Promise<boolean> {
  const state = await getUserBillingState(userId);
  return state.isMasterAccount;
}

export async function getAxonAccessRow(userId: string): Promise<AxonAccessRow | null> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("axon_access")
    .select("user_id, access_code_hash, access_code_salt, code_sent_at, last_verified_at")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? mapRow(data as Record<string, unknown>) : null;
}

async function upsertAxonAccess(userId: string, code: string, codeSentAt?: string): Promise<void> {
  const { hash, salt } = hashAxonAccessCode(code);
  const supabase = createServiceClient();
  const now = new Date().toISOString();
  const { error } = await supabase.from("axon_access").upsert({
    user_id: userId,
    access_code_hash: hash,
    access_code_salt: salt,
    code_sent_at: codeSentAt ?? now,
    updated_at: now,
  });
  if (error) throw new Error(error.message);
}

/** Ensures master account has an AXON code from AXON_MASTER_ACCESS_CODE env. */
export async function ensureMasterAxonAccess(userId: string): Promise<void> {
  const state = await getUserBillingState(userId);
  if (!state.isMasterAccount) return;

  const existing = await getAxonAccessRow(userId);
  if (existing) return;

  const masterCode = process.env.AXON_MASTER_ACCESS_CODE?.trim();
  if (!masterCode) {
    console.warn("[axon] AXON_MASTER_ACCESS_CODE not set — master access code not provisioned");
    return;
  }

  await upsertAxonAccess(userId, masterCode);
}

/** Issue a fresh random code on AXON purchase and email the customer. */
export async function provisionAxonAccessOnPurchase(
  userId: string,
  email: string
): Promise<{ code: string; emailed: boolean }> {
  const existing = await getAxonAccessRow(userId);
  if (existing) {
    return { code: "", emailed: false };
  }

  const code = generateAxonAccessCode(10);
  await upsertAxonAccess(userId, code);
  const emailed = await sendAxonAccessCodeEmail({ to: email, code });
  return { code, emailed: !emailed.error };
}

export async function verifyUserAxonCode(userId: string, code: string): Promise<boolean> {
  await ensureMasterAxonAccess(userId);

  const row = await getAxonAccessRow(userId);
  if (!row) return false;

  const valid = verifyAxonAccessCode(code, row.accessCodeHash, row.accessCodeSalt);
  if (!valid) return false;

  const supabase = createServiceClient();
  await supabase
    .from("axon_access")
    .update({ last_verified_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("user_id", userId);

  return true;
}

export async function changeUserAxonCode(
  userId: string,
  currentCode: string,
  nextCode: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const trimmedNext = nextCode.trim();
  if (trimmedNext.length < 6 || trimmedNext.length > 32) {
    return { ok: false, error: "New code must be 6–32 characters." };
  }

  const valid = await verifyUserAxonCode(userId, currentCode);
  if (!valid) return { ok: false, error: "Current code is incorrect." };

  await upsertAxonAccess(userId, trimmedNext);
  return { ok: true };
}
