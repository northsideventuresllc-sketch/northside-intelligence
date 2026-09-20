import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL =
  process.env.NI_BRAIN_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://kxijunwgbrlfzvgkhklo.supabase.co";

function serviceClient(): SupabaseClient {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY not configured");
  return createClient(SUPABASE_URL, key, { auth: { persistSession: false } });
}

export type MoralitySteward = {
  id: string;
  display_name: string;
  role: string;
  active: boolean;
  can_propose: boolean;
  can_vote: boolean;
  can_ratify: boolean;
};

export type MoralityVote = {
  amendment_id: string;
  steward_id: string;
  vote: string;
  note: string | null;
  created_at: string;
};

export type MoralityTally = {
  approve_count: number;
  deny_count: number;
  abstain_count: number;
  eligible_count: number;
};

export type MoralityAmendment = {
  id: string;
  status: string;
  change_type: string;
  title: string;
  proposer_id: string;
  proposer_role: string;
  greater_good_case: string;
  risks: string;
  grey_area_summary: string | null;
  confidence: number | null;
  base_version: string | null;
  chair_veto: boolean;
  new_version: string | null;
  created_at: string;
  updated_at: string;
  ratified_at: string | null;
  votes: MoralityVote[];
  tally: MoralityTally;
};

const AMENDMENT_FIELDS =
  "id,status,change_type,title,proposer_id,proposer_role,greater_good_case,risks,grey_area_summary,confidence,base_version,chair_veto,new_version,created_at,updated_at,ratified_at";

export async function listStewards(): Promise<MoralitySteward[]> {
  const { data, error } = await serviceClient()
    .from("axon_morality_stewards")
    .select("id,display_name,role,active,can_propose,can_vote,can_ratify")
    .eq("active", true)
    .order("display_name");
  if (error) throw new Error(error.message);
  return data ?? [];
}

async function tallyFor(client: SupabaseClient, amendmentId: string): Promise<MoralityTally> {
  const { data, error } = await client.rpc("fn_morality_tally", { p_amendment_id: amendmentId });
  if (error) throw new Error(error.message);
  const row = Array.isArray(data) ? data[0] : data;
  return {
    approve_count: Number(row?.approve_count ?? 0),
    deny_count: Number(row?.deny_count ?? 0),
    abstain_count: Number(row?.abstain_count ?? 0),
    eligible_count: Number(row?.eligible_count ?? 0),
  };
}

export async function listAmendments(): Promise<MoralityAmendment[]> {
  const client = serviceClient();
  const { data: amendments, error } = await client
    .from("axon_morality_amendments")
    .select(AMENDMENT_FIELDS)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw new Error(error.message);
  const rows = amendments ?? [];
  if (rows.length === 0) return [];

  const { data: votes, error: votesError } = await client
    .from("axon_morality_amendment_votes")
    .select("amendment_id,steward_id,vote,note,created_at")
    .in(
      "amendment_id",
      rows.map((r) => r.id)
    );
  if (votesError) throw new Error(votesError.message);

  const tallies = await Promise.all(rows.map((r) => tallyFor(client, r.id)));

  return rows.map((row, i) => ({
    ...row,
    votes: (votes ?? []).filter((v) => v.amendment_id === row.id),
    tally: tallies[i]!,
  }));
}

/**
 * The ops session cookie proves "has ops access", not "is this specific steward" — it's a
 * single shared secret with no per-person identity. Rather than trust a client-supplied
 * steward/chair/ratifier id (which any ops-session holder could spoof to vote or veto as
 * anyone), every mutating action derives the acting steward here: if exactly one active
 * steward exists, that's unambiguously who's acting; with more than one, real per-steward
 * auth doesn't exist yet, so we refuse instead of silently allowing impersonation.
 */
export async function resolveSoleActingSteward(client: SupabaseClient): Promise<MoralitySteward> {
  const { data, error } = await client
    .from("axon_morality_stewards")
    .select("id,display_name,role,active,can_propose,can_vote,can_ratify")
    .eq("active", true);
  if (error) throw new Error(error.message);
  const rows = data ?? [];
  if (rows.length === 0) throw new Error("No active stewards configured");
  if (rows.length > 1) {
    throw new Error(
      `${rows.length} active stewards configured — per-steward identity isn't verified by the ops ` +
        "session yet, so multi-steward actions are refused until real per-steward auth ships."
    );
  }
  return rows[0]!;
}

export async function castVoteAsSoleSteward(
  amendmentId: string,
  vote: "approve" | "deny" | "abstain",
  note?: string | null
) {
  const client = serviceClient();
  const steward = await resolveSoleActingSteward(client);
  if (!steward.can_vote) throw new Error(`Steward ${steward.id} is not a voting steward`);
  const { data, error } = await client.rpc("fn_morality_cast_vote", {
    p_amendment_id: amendmentId,
    p_steward_id: steward.id,
    p_vote: vote,
    p_note: note ?? null,
  });
  if (error) throw new Error(error.message);
  return { steward, result: data };
}

export async function chairVetoAsSoleSteward(amendmentId: string, reason: string) {
  const client = serviceClient();
  const steward = await resolveSoleActingSteward(client);
  if (steward.role !== "chair") {
    throw new Error(`Only the chair steward may veto (acting steward has role=${steward.role})`);
  }
  const { data, error } = await client.rpc("fn_morality_chair_veto", {
    p_amendment_id: amendmentId,
    p_chair_id: steward.id,
    p_reason: reason,
  });
  if (error) throw new Error(error.message);
  return { steward, result: data };
}

export async function ratifyAsSoleSteward(amendmentId: string) {
  const client = serviceClient();
  const steward = await resolveSoleActingSteward(client);
  if (!steward.can_ratify) throw new Error(`Steward ${steward.id} does not have ratify power`);
  const { data, error } = await client.rpc("fn_morality_ratify", {
    p_amendment_id: amendmentId,
    p_ratifier_id: steward.id,
  });
  if (error) throw new Error(error.message);
  return { steward, result: data };
}
