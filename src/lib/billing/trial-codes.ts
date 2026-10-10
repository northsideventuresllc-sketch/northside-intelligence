import "server-only";

import { createServiceClient } from "@/lib/supabase/server";

export interface TrialCodeRecord {
  id: string;
  code: string;
  toolSlug: string | null;
  userId: string | null;
  usedAt: string | null;
  expiresAt: string | null;
  durationDays: number;
  createdAt: string;
  createdBy: string;
  metadata?: Record<string, unknown>;
}

export interface ValidateTrialCodeResult {
  valid: boolean;
  code?: string;
  toolSlug?: string | null;
  durationDays?: number;
  error?: string;
}

export interface RedeemTrialCodeResult {
  success: boolean;
  code?: string;
  tools?: string[];
  expiresAt?: string;
  durationDays?: number;
  error?: string;
}

export interface TrialStatus {
  hasActiveTrial: boolean;
  expiresAt: string | null;
  daysRemaining: number | null;
  accessType: string;
}

/**
 * Validate a trial code without redeeming it.
 */
export async function validateTrialCode(
  code: string,
  toolSlug?: string
): Promise<ValidateTrialCodeResult> {
  const normalized = code.trim().toUpperCase();
  if (!normalized) {
    return { valid: false, error: "Please enter an access code." };
  }

  const supabase = createServiceClient();
  const { data: record, error } = await supabase
    .from("trial_codes")
    .select("code, tool_slug, used_at, duration_days, metadata")
    .ilike("code", normalized)
    .maybeSingle();

  if (error || !record) {
    return { valid: false, error: "Invalid trial code." };
  }

  if (record.used_at) {
    return {
      valid: false,
      error: "This trial code has already been redeemed and cannot be reused.",
    };
  }

  // 48-hour entry window: codes expire if never redeemed in time
  const codeExpiresAt = (record.metadata as { code_expires_at?: string } | null)
    ?.code_expires_at;
  if (codeExpiresAt && new Date(codeExpiresAt).getTime() < Date.now()) {
    return {
      valid: false,
      error: "This trial code has expired. Codes are valid for 48 hours.",
    };
  }

  if (
    record.tool_slug &&
    record.tool_slug !== "all" &&
    toolSlug &&
    record.tool_slug.toLowerCase() !== toolSlug.toLowerCase()
  ) {
    return {
      valid: false,
      error: `This trial code is specifically for ${record.tool_slug}.`,
    };
  }

  return {
    valid: true,
    code: record.code,
    toolSlug: record.tool_slug,
    durationDays: record.duration_days ?? 7,
  };
}

/**
 * Redeem a trial code for a given user.
 * Enforces single-use atomically in the database.
 */
export async function redeemTrialCode(
  code: string,
  userId: string,
  toolSlug?: string
): Promise<RedeemTrialCodeResult> {
  const normalized = code.trim().toUpperCase();
  if (!normalized) {
    return { success: false, error: "Access code is required." };
  }
  if (!userId) {
    return { success: false, error: "User authentication required." };
  }

  const supabase = createServiceClient();

  // 1. Try atomic database RPC function first
  try {
    const { data: rpcResult, error: rpcError } = await supabase.rpc("redeem_trial_code", {
      p_code: normalized,
      p_user_id: userId,
      p_tool_slug: toolSlug || null,
    });

    if (!rpcError && rpcResult) {
      if (!rpcResult.success) {
        return { success: false, error: rpcResult.error || "Failed to redeem code." };
      }
      return {
        success: true,
        code: rpcResult.code,
        tools: rpcResult.tools,
        expiresAt: rpcResult.expires_at,
        durationDays: rpcResult.duration_days,
      };
    }
  } catch (err) {
    console.warn("RPC redeem_trial_code unavailable, using direct fallback:", err);
  }

  // 2. Fallback direct atomic implementation
  const { data: existing, error: fetchError } = await supabase
    .from("trial_codes")
    .select("*")
    .ilike("code", normalized)
    .maybeSingle();

  if (fetchError || !existing) {
    return { success: false, error: "Invalid trial code." };
  }

  if (existing.used_at) {
    return { success: false, error: "This trial code has already been redeemed." };
  }

  if (
    existing.tool_slug &&
    existing.tool_slug !== "all" &&
    toolSlug &&
    existing.tool_slug.toLowerCase() !== toolSlug.toLowerCase()
  ) {
    return {
      success: false,
      error: `This trial code is only valid for ${existing.tool_slug}.`,
    };
  }

  const durationDays = existing.duration_days ?? 7;
  const expiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString();
  const now = new Date().toISOString();

  // Atomically claim the code
  const { data: updatedCode, error: updateError } = await supabase
    .from("trial_codes")
    .update({
      used_at: now,
      user_id: userId,
      expires_at: expiresAt,
      metadata: {
        ...(existing.metadata || {}),
        redeemed_tool: toolSlug || existing.tool_slug || "all",
      },
    })
    .eq("id", existing.id)
    .is("used_at", null)
    .select()
    .maybeSingle();

  if (updateError || !updatedCode) {
    return {
      success: false,
      error: "This trial code was just redeemed or is no longer available.",
    };
  }

  // Determine unlocked tools
  const targetSlugs =
    existing.tool_slug === "all" || (!existing.tool_slug && (!toolSlug || toolSlug === "all"))
      ? ["replyflow", "grantbot", "signaldesk", "gapscan", "bridgeai"]
      : [toolSlug || existing.tool_slug];

  for (const slug of targetSlugs) {
    await supabase.from("ni_toolkit").upsert(
      {
        user_id: userId,
        tool_slug: slug,
        access_type: "trial",
        expires_at: expiresAt,
        purchased_at: now,
        updated_at: now,
      },
      { onConflict: "user_id,tool_slug" }
    );

    // Ensure profiles exist with unlocked access
    if (slug === "replyflow") {
      await supabase
        .from("replyflow_profiles")
        .upsert(
          { id: userId, plan: "core", replies_used_this_month: 0, replies_reset_at: now },
          { onConflict: "id" }
        );
    } else if (slug === "grantbot") {
      await supabase
        .from("grantbot_profiles")
        .upsert(
          { id: userId, tier: "pro", grants_used_this_month: 0, grants_reset_at: now },
          { onConflict: "id" }
        );
    } else if (slug === "signaldesk") {
      await supabase
        .from("signaldesk_profiles")
        .upsert(
          { id: userId, tier: "pro", signals_used_this_month: 0, signals_reset_at: now },
          { onConflict: "id" }
        );
    } else if (slug === "gapscan") {
      await supabase
        .from("gapscan_profiles")
        .upsert(
          { id: userId, tier: "pro", scans_used_this_month: 0, scans_reset_at: now },
          { onConflict: "id" }
        );
    } else if (slug === "bridgeai") {
      await supabase
        .from("bridgeai_profiles")
        .upsert(
          { id: userId, tier: "pro", workflows_used_this_month: 0, workflows_reset_at: now },
          { onConflict: "id" }
        );
    }
  }

  return {
    success: true,
    code: normalized,
    tools: targetSlugs,
    expiresAt,
    durationDays,
  };
}

/**
 * Check active trial status for a user and tool.
 */
export async function getTrialStatus(userId: string, toolSlug: string): Promise<TrialStatus> {
  const supabase = createServiceClient();
  const { data: entry } = await supabase
    .from("ni_toolkit")
    .select("access_type, expires_at")
    .eq("user_id", userId)
    .eq("tool_slug", toolSlug)
    .maybeSingle();

  if (!entry || entry.access_type !== "trial") {
    return {
      hasActiveTrial: false,
      expiresAt: null,
      daysRemaining: null,
      accessType: entry?.access_type ?? "none",
    };
  }

  if (!entry.expires_at) {
    return {
      hasActiveTrial: true,
      expiresAt: null,
      daysRemaining: 7,
      accessType: "trial",
    };
  }

  const diff = new Date(entry.expires_at).getTime() - Date.now();
  if (diff <= 0) {
    return {
      hasActiveTrial: false,
      expiresAt: entry.expires_at,
      daysRemaining: 0,
      accessType: "free",
    };
  }

  const daysRemaining = Math.max(1, Math.ceil(diff / (24 * 60 * 60 * 1000)));

  return {
    hasActiveTrial: true,
    expiresAt: entry.expires_at,
    daysRemaining,
    accessType: "trial",
  };
}
