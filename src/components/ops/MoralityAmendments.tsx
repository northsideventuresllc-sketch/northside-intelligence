"use client";

import { useMemo, useState } from "react";
import { loadFromStorage, saveToStorage } from "@/lib/ops-storage";
import type { MoralityAmendment, MoralitySteward } from "@/lib/ops/morality";

const ACTING_STEWARD_KEY = "ni_ops_morality_acting_steward";

const PENDING_STATUSES = new Set(["draft", "deliberation", "voting", "approved"]);

const STATUS_LABEL: Record<string, string> = {
  draft: "Draft",
  deliberation: "In deliberation",
  voting: "Voting open",
  approved: "Approved — awaiting ratification",
  denied: "Denied",
  vetoed: "Vetoed",
  ratified: "Ratified",
  withdrawn: "Withdrawn",
  invalid: "Invalid",
};

const STATUS_COLOR: Record<string, string> = {
  draft: "text-ni-muted",
  deliberation: "text-amber-400",
  voting: "text-cyan-400",
  approved: "text-emerald-400",
  denied: "text-red-400",
  vetoed: "text-red-400",
  ratified: "text-emerald-400",
  withdrawn: "text-ni-muted",
  invalid: "text-red-400",
};

interface Props {
  initialAmendments: MoralityAmendment[];
  stewards: MoralitySteward[];
}

export function MoralityAmendments({ initialAmendments, stewards }: Props) {
  const [amendments, setAmendments] = useState(initialAmendments);
  const [actingStewardId, setActingStewardId] = useState<string>(() =>
    loadFromStorage(ACTING_STEWARD_KEY, stewards[0]?.id ?? "")
  );
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  const actingSteward = useMemo(
    () => stewards.find((s) => s.id === actingStewardId) ?? null,
    [stewards, actingStewardId]
  );

  const pending = amendments.filter((a) => PENDING_STATUSES.has(a.status));
  const resolved = amendments.filter((a) => !PENDING_STATUSES.has(a.status));

  function handleStewardChange(id: string) {
    setActingStewardId(id);
    saveToStorage(ACTING_STEWARD_KEY, id);
  }

  async function refresh() {
    const res = await fetch("/api/ops/morality/amendments");
    if (!res.ok) return;
    const data = (await res.json()) as { amendments: MoralityAmendment[] };
    setAmendments(data.amendments);
  }

  async function runAction(id: string, path: string, body: Record<string, unknown>) {
    setBusyId(id);
    setError(null);
    try {
      const res = await fetch(`/api/ops/morality/amendments/${id}/${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Action failed");
        return;
      }
      await refresh();
    } catch {
      setError("Network error — action may not have applied");
    } finally {
      setBusyId(null);
    }
  }

  function castVote(amendmentId: string, vote: "approve" | "deny" | "abstain") {
    if (!actingStewardId) return;
    void runAction(amendmentId, "vote", {
      steward_id: actingStewardId,
      vote,
      note: notes[amendmentId] || undefined,
    });
  }

  function chairVeto(amendmentId: string) {
    if (!actingStewardId) return;
    const reason = notes[amendmentId]?.trim();
    if (!reason) {
      setError("A veto reason is required — add a note first.");
      return;
    }
    void runAction(amendmentId, "veto", { chair_id: actingStewardId, reason });
  }

  function ratify(amendmentId: string) {
    if (!actingStewardId) return;
    void runAction(amendmentId, "ratify", { ratifier_id: actingStewardId });
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-4">
        <label htmlFor="acting-steward" className="text-sm text-ni-muted">
          Acting as steward
        </label>
        <select
          id="acting-steward"
          value={actingStewardId}
          onChange={(e) => handleStewardChange(e.target.value)}
          className="rounded-lg border border-white/10 bg-ni-bg px-3 py-1.5 text-sm text-white outline-none focus:border-cyan-500/50"
        >
          {stewards.length === 0 && <option value="">No active stewards</option>}
          {stewards.map((s) => (
            <option key={s.id} value={s.id}>
              {s.display_name} ({s.role})
            </option>
          ))}
        </select>
        {actingSteward && (
          <span className="text-xs text-ni-muted">
            can_vote={String(actingSteward.can_vote)} · can_ratify={String(actingSteward.can_ratify)}
          </span>
        )}
      </div>

      {error && (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-400" role="alert">
          {error}
        </p>
      )}

      <section>
        <h2 className="mb-4 text-lg font-semibold text-white">Pending ({pending.length})</h2>
        {pending.length === 0 ? (
          <p className="text-sm text-ni-muted">No amendments awaiting steward action.</p>
        ) : (
          <div className="space-y-4">
            {pending.map((a) => (
              <AmendmentCard
                key={a.id}
                amendment={a}
                busy={busyId === a.id}
                actingSteward={actingSteward}
                note={notes[a.id] ?? ""}
                onNoteChange={(v) => setNotes((prev) => ({ ...prev, [a.id]: v }))}
                onVote={(vote) => castVote(a.id, vote)}
                onVeto={() => chairVeto(a.id)}
                onRatify={() => ratify(a.id)}
              />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold text-white">Resolved ({resolved.length})</h2>
        {resolved.length === 0 ? (
          <p className="text-sm text-ni-muted">No resolved amendments yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-white/5 text-ni-muted">
                  <th className="px-4 py-3 font-medium">Title</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Proposer</th>
                  <th className="px-4 py-3 font-medium">Ratified</th>
                </tr>
              </thead>
              <tbody>
                {resolved.map((a) => (
                  <tr key={a.id} className="border-b border-white/5 last:border-0">
                    <td className="px-4 py-3 font-medium text-white">{a.title}</td>
                    <td className={`px-4 py-3 ${STATUS_COLOR[a.status] ?? "text-ni-muted"}`}>
                      {STATUS_LABEL[a.status] ?? a.status}
                    </td>
                    <td className="px-4 py-3 text-ni-muted">{a.proposer_id}</td>
                    <td className="px-4 py-3 text-ni-muted">
                      {a.ratified_at ? new Date(a.ratified_at).toLocaleDateString() : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function AmendmentCard({
  amendment,
  busy,
  actingSteward,
  note,
  onNoteChange,
  onVote,
  onVeto,
  onRatify,
}: {
  amendment: MoralityAmendment;
  busy: boolean;
  actingSteward: MoralitySteward | null;
  note: string;
  onNoteChange: (v: string) => void;
  onVote: (vote: "approve" | "deny" | "abstain") => void;
  onVeto: () => void;
  onRatify: () => void;
}) {
  const canVote = amendment.status === "deliberation" || amendment.status === "voting";
  const canRatify = amendment.status === "approved" && !amendment.chair_veto;
  const canVeto = actingSteward?.role === "chair";
  const myVote = actingSteward
    ? amendment.votes.find((v) => v.steward_id === actingSteward.id)
    : undefined;

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-5">
      <div className="mb-3 flex items-start justify-between gap-4">
        <div>
          <h3 className="font-medium text-white">{amendment.title}</h3>
          <p className="mt-0.5 text-xs text-ni-muted">
            {amendment.change_type} · proposed by {amendment.proposer_id} ({amendment.proposer_role})
          </p>
        </div>
        <span className={`shrink-0 text-xs font-medium ${STATUS_COLOR[amendment.status] ?? "text-ni-muted"}`}>
          {STATUS_LABEL[amendment.status] ?? amendment.status}
        </span>
      </div>

      <p className="mb-2 text-sm text-white/80">
        <span className="text-ni-muted">Greater-good case: </span>
        {amendment.greater_good_case}
      </p>
      <p className="mb-3 text-sm text-white/80">
        <span className="text-ni-muted">Risks: </span>
        {amendment.risks}
      </p>

      <p className="mb-4 text-xs text-ni-muted">
        Tally — approve {amendment.tally.approve_count} · deny {amendment.tally.deny_count} · abstain{" "}
        {amendment.tally.abstain_count} / {amendment.tally.eligible_count} eligible
        {myVote && <span> · your vote: {myVote.vote}</span>}
      </p>

      <input
        type="text"
        value={note}
        onChange={(e) => onNoteChange(e.target.value)}
        placeholder="Note (required for chair veto)"
        className="mb-3 w-full rounded-lg border border-white/10 bg-ni-bg px-3 py-2 text-sm text-white outline-none focus:border-cyan-500/50"
      />

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy || !canVote || !actingSteward?.can_vote}
          onClick={() => onVote("approve")}
          className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-300 hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Approve
        </button>
        <button
          type="button"
          disabled={busy || !canVote || !actingSteward?.can_vote}
          onClick={() => onVote("deny")}
          className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-300 hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Deny
        </button>
        <button
          type="button"
          disabled={busy || !canVote || !actingSteward?.can_vote}
          onClick={() => onVote("abstain")}
          className="rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium text-ni-muted hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Abstain
        </button>
        {canVeto && (
          <button
            type="button"
            disabled={busy || amendment.status === "ratified" || amendment.status === "vetoed"}
            onClick={onVeto}
            className="rounded-lg border border-red-500/40 bg-red-500/20 px-3 py-1.5 text-xs font-medium text-red-200 hover:bg-red-500/30 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Chair veto
          </button>
        )}
        {canRatify && (
          <button
            type="button"
            disabled={busy || !actingSteward?.can_ratify}
            onClick={onRatify}
            className="rounded-lg border border-cyan-500/40 bg-cyan-500/20 px-3 py-1.5 text-xs font-medium text-cyan-200 hover:bg-cyan-500/30 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Ratify
          </button>
        )}
      </div>
    </div>
  );
}
