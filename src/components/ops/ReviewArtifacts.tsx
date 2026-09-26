"use client";

import { useState } from "react";
import type { ReviewArtifact } from "@/lib/ops/review-artifacts";

const STATUS_LABEL: Record<string, string> = {
  pending: "Awaiting Review",
  approved: "Approved",
  rejected: "Rejected",
  needs_changes: "Needs Changes",
};

const STATUS_COLOR: Record<string, string> = {
  pending: "text-amber-400",
  approved: "text-emerald-400",
  rejected: "text-red-400",
  needs_changes: "text-cyan-400",
};

const CONTENT_KIND_LABEL: Record<string, string> = {
  social_post: "Social Post",
  outreach_message: "Outreach Message",
  other: "Other",
};

interface Props {
  initialArtifacts: ReviewArtifact[];
}

export function ReviewArtifacts({ initialArtifacts }: Props) {
  const [artifacts, setArtifacts] = useState(initialArtifacts);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  const pending = artifacts.filter((a) => a.status === "pending");
  const decided = artifacts.filter((a) => a.status !== "pending");

  async function refresh() {
    const res = await fetch("/api/ops/artifacts");
    if (!res.ok) return;
    const data = (await res.json()) as { artifacts: ReviewArtifact[] };
    setArtifacts(data.artifacts);
  }

  async function runAction(
    id: string,
    path: "approve" | "reject" | "request-changes",
    extra?: Record<string, unknown>
  ) {
    setBusyId(id);
    setError(null);
    try {
      const res = await fetch(`/api/ops/artifacts/${id}/${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewer_notes: notes[id]?.trim() || undefined, ...extra }),
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

  function approve(id: string, originalDraftContent: string | null) {
    const edited = drafts[id];
    const draftContent =
      edited !== undefined && edited !== (originalDraftContent ?? "") ? edited : undefined;
    void runAction(id, "approve", draftContent !== undefined ? { draft_content: draftContent } : undefined);
  }

  function reject(id: string) {
    if (!notes[id]?.trim()) {
      setError("A note is required to reject an artifact.");
      return;
    }
    void runAction(id, "reject");
  }

  function requestChanges(id: string) {
    if (!notes[id]?.trim()) {
      setError("A note is required to request changes.");
      return;
    }
    void runAction(id, "request-changes");
  }

  return (
    <div className="space-y-8">
      {error && (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-400" role="alert">
          {error}
        </p>
      )}

      <section>
        <h2 className="mb-4 text-lg font-semibold text-white">Awaiting Review ({pending.length})</h2>
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
                draftValue={drafts[a.id] ?? a.draft_content ?? ""}
                onDraftChange={(v) => setDrafts((prev) => ({ ...prev, [a.id]: v }))}
                onApprove={() => approve(a.id, a.draft_content)}
                onReject={() => reject(a.id)}
                onRequestChanges={() => requestChanges(a.id)}
              />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold text-white">Decided ({decided.length})</h2>
        {decided.length === 0 ? (
          <p className="text-sm text-ni-muted">No decided artifacts yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-white/5 text-ni-muted">
                  <th className="px-4 py-3 font-medium">Title</th>
                  <th className="px-4 py-3 font-medium">Kind</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Reviewed</th>
                </tr>
              </thead>
              <tbody>
                {decided.map((a) => (
                  <tr key={a.id} className="border-b border-white/5 last:border-0">
                    <td className="px-4 py-3 font-medium text-white">{a.title || "(untitled)"}</td>
                    <td className="px-4 py-3 text-ni-muted">
                      {CONTENT_KIND_LABEL[a.content_kind] ?? a.content_kind}
                    </td>
                    <td className={`px-4 py-3 ${STATUS_COLOR[a.status] ?? "text-ni-muted"}`}>
                      {STATUS_LABEL[a.status] ?? a.status}
                    </td>
                    <td className="px-4 py-3 text-ni-muted">
                      {a.reviewed_at ? new Date(a.reviewed_at).toLocaleDateString() : "—"}
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
  draftValue,
  onDraftChange,
  onApprove,
  onReject,
  onRequestChanges,
}: {
  artifact: ReviewArtifact;
  busy: boolean;
  note: string;
  onNoteChange: (v: string) => void;
  draftValue: string;
  onDraftChange: (v: string) => void;
  onApprove: () => void;
  onReject: () => void;
  onRequestChanges: () => void;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-5">
      <div className="mb-3 flex items-start justify-between gap-4">
        <div>
          <h3 className="font-medium text-white">{artifact.title || "(untitled)"}</h3>
          <p className="mt-0.5 text-xs text-ni-muted">
            {CONTENT_KIND_LABEL[artifact.content_kind] ?? artifact.content_kind}
            {artifact.platform ? ` · ${artifact.platform}` : ""}
            {artifact.created_by_agent ? ` · from ${artifact.created_by_agent}` : ""}
          </p>
        </div>
        <span className={`shrink-0 text-xs font-medium ${STATUS_COLOR[artifact.status] ?? "text-ni-muted"}`}>
          {STATUS_LABEL[artifact.status] ?? artifact.status}
        </span>
      </div>

      {artifact.draft_content ? (
        <textarea
          value={draftValue}
          onChange={(e) => onDraftChange(e.target.value)}
          rows={6}
          className="mb-3 w-full whitespace-pre-wrap rounded-lg border border-white/10 bg-ni-bg p-3 text-sm text-white/80 outline-none focus:border-cyan-500/50"
        />
      ) : artifact.draft_ref ? (
        <p className="mb-3 text-sm text-white/80">
          <span className="text-ni-muted">Draft: </span>
          {artifact.draft_ref}
        </p>
      ) : null}

      <input
        type="text"
        value={note}
        onChange={(e) => onNoteChange(e.target.value)}
        placeholder="Note (required to reject or request changes)"
        className="mb-3 w-full rounded-lg border border-white/10 bg-ni-bg px-3 py-2 text-sm text-white outline-none focus:border-cyan-500/50"
      />

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={onApprove}
          className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-300 hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Approve
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={onRequestChanges}
          className="rounded-lg border border-cyan-500/40 bg-cyan-500/20 px-3 py-1.5 text-xs font-medium text-cyan-200 hover:bg-cyan-500/30 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Request Changes
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={onReject}
          className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-300 hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Reject
        </button>
      </div>
    </div>
  );
}
