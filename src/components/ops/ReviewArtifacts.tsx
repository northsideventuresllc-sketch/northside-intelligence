"use client";

import { useState } from "react";
import type { ReviewArtifact, ReviewStatus } from "@/lib/ops/review-artifacts";

const STATUS_LABEL: Record<ReviewStatus, string> = {
  pending: "Pending review",
  approved: "Approved",
  rejected: "Rejected",
  needs_changes: "Needs changes",
};

const STATUS_COLOR: Record<ReviewStatus, string> = {
  pending: "text-amber-400",
  approved: "text-emerald-400",
  rejected: "text-red-400",
  needs_changes: "text-cyan-400",
};

interface Props {
  initialArtifacts: ReviewArtifact[];
}

export function ReviewArtifacts({ initialArtifacts }: Props) {
  const [artifacts, setArtifacts] = useState(initialArtifacts);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [reviewer, setReviewer] = useState("");
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  const pending = artifacts.filter((a) => a.status === "pending");
  const decided = artifacts.filter((a) => a.status !== "pending");

  async function refresh() {
    const res = await fetch("/api/ops/artifacts");
    if (!res.ok) return;
    const data = (await res.json()) as { artifacts: ReviewArtifact[] };
    setArtifacts(data.artifacts);
  }

  async function decide(id: string, status: Exclude<ReviewStatus, "pending">) {
    if (!reviewer.trim()) {
      setError("Enter your name in the reviewer field before deciding.");
      return;
    }
    setBusyId(id);
    setError(null);
    try {
      const res = await fetch(`/api/ops/artifacts/${id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          reviewed_by: reviewer.trim(),
          reviewer_notes: notes[id] || undefined,
        }),
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

  return (
    <div className="space-y-8">
      <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm">
        <label className="flex items-center gap-3">
          <span className="text-ni-muted">Reviewing as</span>
          <input
            type="text"
            value={reviewer}
            onChange={(e) => setReviewer(e.target.value)}
            placeholder="Your name"
            className="rounded-lg border border-white/10 bg-ni-bg px-3 py-1.5 text-sm text-white outline-none focus:border-cyan-500/50"
          />
        </label>
      </div>

      {error && (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-400" role="alert">
          {error}
        </p>
      )}

      <section>
        <h2 className="mb-4 text-lg font-semibold text-white">Pending ({pending.length})</h2>
        {pending.length === 0 ? (
          <p className="text-sm text-ni-muted">No artifacts awaiting review.</p>
        ) : (
          <div className="space-y-4">
            {pending.map((a) => (
              <ArtifactCard
                key={a.id}
                artifact={a}
                busy={busyId === a.id}
                note={notes[a.id] ?? ""}
                onNoteChange={(v) => setNotes((prev) => ({ ...prev, [a.id]: v }))}
                onDecide={(status) => decide(a.id, status)}
              />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold text-white">Decided ({decided.length})</h2>
        {decided.length === 0 ? (
          <p className="text-sm text-ni-muted">No reviewed artifacts yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-white/5 text-ni-muted">
                  <th className="px-4 py-3 font-medium">Title</th>
                  <th className="px-4 py-3 font-medium">Venture</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Reviewed by</th>
                  <th className="px-4 py-3 font-medium">Reviewed</th>
                </tr>
              </thead>
              <tbody>
                {decided.map((a) => (
                  <tr key={a.id} className="border-b border-white/5 last:border-0">
                    <td className="px-4 py-3 font-medium text-white">{a.title ?? a.content_kind}</td>
                    <td className="px-4 py-3 text-ni-muted">{a.venture_id}</td>
                    <td className={`px-4 py-3 ${STATUS_COLOR[a.status]}`}>{STATUS_LABEL[a.status]}</td>
                    <td className="px-4 py-3 text-ni-muted">{a.reviewed_by ?? "—"}</td>
                    <td className="px-4 py-3 text-ni-muted">
                      {a.reviewed_at ? new Date(a.reviewed_at).toLocaleString() : "—"}
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

function ArtifactCard({
  artifact,
  busy,
  note,
  onNoteChange,
  onDecide,
}: {
  artifact: ReviewArtifact;
  busy: boolean;
  note: string;
  onNoteChange: (v: string) => void;
  onDecide: (status: Exclude<ReviewStatus, "pending">) => void;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-5">
      <div className="mb-3 flex items-start justify-between gap-4">
        <div>
          <h3 className="font-medium text-white">{artifact.title ?? artifact.content_kind}</h3>
          <p className="mt-0.5 text-xs text-ni-muted">
            {artifact.venture_id} · {artifact.content_kind} · by {artifact.created_by_agent}
            {artifact.platform ? ` · ${artifact.platform}` : ""}
          </p>
        </div>
        <span className={`shrink-0 text-xs font-medium ${STATUS_COLOR[artifact.status]}`}>
          {STATUS_LABEL[artifact.status]}
        </span>
      </div>

      {artifact.draft_content && (
        <p className="mb-3 whitespace-pre-wrap rounded-lg border border-white/5 bg-ni-bg p-3 text-sm text-white/80">
          {artifact.draft_content}
        </p>
      )}
      {artifact.draft_ref && (
        <p className="mb-3 text-sm text-white/80">
          <span className="text-ni-muted">Draft: </span>
          <a
            href={artifact.draft_ref}
            target="_blank"
            rel="noreferrer"
            className="text-cyan-400 underline underline-offset-2"
          >
            {artifact.draft_ref}
          </a>
        </p>
      )}

      <input
        type="text"
        value={note}
        onChange={(e) => onNoteChange(e.target.value)}
        placeholder="Reviewer notes (optional)"
        className="mb-3 w-full rounded-lg border border-white/10 bg-ni-bg px-3 py-2 text-sm text-white outline-none focus:border-cyan-500/50"
      />

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => onDecide("approved")}
          className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-300 hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Approve
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => onDecide("needs_changes")}
          className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-3 py-1.5 text-xs font-medium text-cyan-300 hover:bg-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Needs changes
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => onDecide("rejected")}
          className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-300 hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Reject
        </button>
      </div>
    </div>
  );
}
