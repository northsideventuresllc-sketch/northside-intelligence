import "server-only";

import { createServiceClient } from "@/lib/supabase/server";

export interface MoralityPinStatus {
  version: string;
  contentSha256: string;
  purposeLock: string | null;
  approvedBy: string | null;
  notes: string | null;
  createdAt: string;
}

export interface MoralityAuditEvent {
  id: string;
  eventType: string;
  actionClass: string | null;
  actor: string | null;
  detail: Record<string, unknown> | null;
  createdAt: string;
  isDenial: boolean;
}

export interface GlobalHaltStatus {
  halted: boolean;
  status: string;
  eventType: string;
  actor: string | null;
  reason: string | null;
  createdAt: string | null;
}

export interface GlobalHaltEvent {
  id: string;
  haltId: string | null;
  eventType: string;
  status: string;
  actor: string | null;
  reason: string | null;
  createdAt: string;
}

const DENIAL_PATTERN = /(deny|denied|block|reject|refus)/i;

function isDenialShaped(eventType: string, actionClass: string | null): boolean {
  return DENIAL_PATTERN.test(eventType) || (actionClass ? DENIAL_PATTERN.test(actionClass) : false);
}

/** The currently pinned/active morality version — what AXON is bound to right now. */
export async function getMoralityPinStatus(): Promise<MoralityPinStatus | null> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("axon_morality_versions")
    .select("version, content_sha256, purpose_lock, approved_by, notes, created_at")
    .eq("active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;

  return {
    version: data.version,
    contentSha256: data.content_sha256,
    purposeLock: data.purpose_lock ?? null,
    approvedBy: data.approved_by ?? null,
    notes: data.notes ?? null,
    createdAt: data.created_at,
  };
}

/** Recent morality gate activity — approvals, denials, boot checks. */
export async function getRecentMoralityAudit(limit = 20): Promise<MoralityAuditEvent[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("axon_morality_audit")
    .select("id, event_type, action_class, actor, detail, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => ({
    id: row.id,
    eventType: row.event_type,
    actionClass: row.action_class ?? null,
    actor: row.actor ?? null,
    detail: (row.detail as Record<string, unknown>) ?? null,
    createdAt: row.created_at,
    isDenial: isDenialShaped(row.event_type, row.action_class ?? null),
  }));
}

/** Current sealed-mode / kill-switch state, derived from the latest halt event. */
export async function getGlobalHaltStatus(): Promise<GlobalHaltStatus> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("axon_global_halt_events")
    .select("event_type, status, actor, reason, created_at")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);

  if (!data) {
    return { halted: false, status: "clear", eventType: "clear", actor: null, reason: null, createdAt: null };
  }

  const halted = data.status !== "clear";
  return {
    halted,
    status: data.status,
    eventType: data.event_type,
    actor: data.actor ?? null,
    reason: data.reason ?? null,
    createdAt: data.created_at,
  };
}

export async function getGlobalHaltHistory(limit = 10): Promise<GlobalHaltEvent[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("axon_global_halt_events")
    .select("id, halt_id, event_type, status, actor, reason, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => ({
    id: row.id,
    haltId: row.halt_id ?? null,
    eventType: row.event_type,
    status: row.status,
    actor: row.actor ?? null,
    reason: row.reason ?? null,
    createdAt: row.created_at,
  }));
}

/** Declares a global halt (kill switch / sealed mode). Operator-only — gate at the caller. */
export async function declareGlobalHalt(actor: string, reason: string): Promise<void> {
  const supabase = createServiceClient();
  const { error } = await supabase.from("axon_global_halt_events").insert({
    halt_id: `halt-${Date.now()}`,
    event_type: "halt",
    status: "halted",
    actor,
    reason,
  });
  if (error) throw new Error(error.message);
}

/** Clears an active halt, returning AXON to normal operation. Operator-only — gate at the caller. */
export async function clearGlobalHalt(actor: string, reason: string): Promise<void> {
  const supabase = createServiceClient();
  const { error } = await supabase.from("axon_global_halt_events").insert({
    halt_id: `clear-${Date.now()}`,
    event_type: "clear",
    status: "clear",
    actor,
    reason,
  });
  if (error) throw new Error(error.message);
}
