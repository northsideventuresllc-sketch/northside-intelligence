"use client";

import { useEffect, useState } from "react";

interface MoralityPin {
  version: string;
  content_sha256: string;
  purpose_lock: string;
  approved_by: string;
  created_at: string;
}

interface HaltEvent {
  halt_id: string | null;
  event_type: string;
  status: string;
  actor: string;
  reason: string;
  created_at: string;
}

interface AuditEvent {
  id: string;
  event_type: string;
  action_class: string | null;
  actor: string;
  created_at: string;
  is_denial: boolean;
}

interface TrustData {
  pin: MoralityPin | null;
  sealed: boolean;
  latest_halt: HaltEvent | null;
  halt_history: HaltEvent[];
  recent_events: AuditEvent[];
  denials: AuditEvent[];
}

export function TrustDashboard() {
  const [data, setData] = useState<TrustData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/ops/trust")
      .then(async (r) => {
        const body = await r.json();
        if (!r.ok) throw new Error(body.error || `HTTP ${r.status}`);
        return body as TrustData;
      })
      .then((body) => {
        if (!cancelled) setData(body);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return (
      <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-6 text-sm text-red-300">
        Failed to load Trust data: {error}
      </div>
    );
  }

  if (!data) {
    return <div className="text-sm text-ni-muted">Loading trust status…</div>;
  }

  return (
    <div className="space-y-8">
      <section
        className={`rounded-xl border p-6 ${
          data.sealed
            ? "border-red-500/40 bg-red-500/10"
            : "border-emerald-500/30 bg-emerald-500/10"
        }`}
      >
        <p className={`text-lg font-semibold ${data.sealed ? "text-red-300" : "text-emerald-300"}`}>
          {data.sealed ? "SEALED — Global Morality Halt active" : "Clear — no active halt"}
        </p>
        {data.latest_halt && (
          <p className="mt-1 text-sm text-ni-muted">
            Last event: {data.latest_halt.event_type} ({data.latest_halt.status}) by{" "}
            {data.latest_halt.actor} — {data.latest_halt.reason} —{" "}
            {new Date(data.latest_halt.created_at).toLocaleString()}
          </p>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-white">Morality Pin</h2>
        {data.pin ? (
          <div className="rounded-xl border border-white/10 bg-ni-navy/30 p-6">
            <p className="text-white">
              Version <span className="font-mono">{data.pin.version}</span>
            </p>
            <p className="mt-1 text-sm text-ni-muted">
              sha256 <span className="font-mono">{data.pin.content_sha256.slice(0, 16)}…</span>
            </p>
            <p className="mt-3 text-sm text-white">{data.pin.purpose_lock}</p>
            <p className="mt-3 text-xs text-ni-muted">
              Approved by {data.pin.approved_by} — {new Date(data.pin.created_at).toLocaleString()}
            </p>
          </div>
        ) : (
          <p className="text-sm text-ni-muted">No active morality version pinned.</p>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-white">
          Recent Denials {data.denials.length > 0 && `(${data.denials.length})`}
        </h2>
        {data.denials.length === 0 ? (
          <p className="text-sm text-ni-muted">No denials in the recent audit window.</p>
        ) : (
          <EventTable events={data.denials} />
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-white">Recent Morality Audit Events</h2>
        {data.recent_events.length === 0 ? (
          <p className="text-sm text-ni-muted">No audit events recorded.</p>
        ) : (
          <EventTable events={data.recent_events} />
        )}
      </section>
    </div>
  );
}

function EventTable({ events }: { events: AuditEvent[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-white/10">
      <table className="w-full min-w-[560px] text-left text-sm">
        <thead>
          <tr className="border-b border-white/10 bg-white/5 text-ni-muted">
            <th className="px-4 py-3 font-medium">Event</th>
            <th className="px-4 py-3 font-medium">Class</th>
            <th className="px-4 py-3 font-medium">Actor</th>
            <th className="px-4 py-3 font-medium">When</th>
          </tr>
        </thead>
        <tbody>
          {events.map((e) => (
            <tr key={e.id} className="border-b border-white/5 last:border-0">
              <td className="px-4 py-3">
                <span className={e.is_denial ? "text-red-300" : "text-white"}>{e.event_type}</span>
              </td>
              <td className="px-4 py-3 text-ni-muted">{e.action_class ?? "—"}</td>
              <td className="px-4 py-3 text-ni-muted">{e.actor}</td>
              <td className="px-4 py-3 text-ni-muted">{new Date(e.created_at).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
