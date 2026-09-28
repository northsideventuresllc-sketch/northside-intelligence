import Link from "next/link";
import { requireAxonPortalUser } from "@/lib/axon/portal-guard";
import { fetchHealthDashboard } from "@/lib/axon/health-dashboard-fetch";
import { healthColorLabel } from "@/lib/axon/plain-labels";
import { axonPublicPath } from "@/lib/axon/paths";

export const dynamic = "force-dynamic";

const DOT_COLOR: Record<string, string> = {
  green: "bg-emerald-500",
  yellow: "bg-amber-400",
  red: "bg-red-500",
};

/**
 * FRONTIER-09-JB-HEALTH-DASHBOARD — one admin-only page: one row per agent
 * (green/yellow/red, plain-English last action, open-ticket count) plus
 * fleet-wide totals. Every label goes through plain-labels.ts; nothing here
 * ever prints a table name, a row id, or a raw status code.
 */
export default async function AxonHealthPage({
  params,
}: {
  params: { username: string };
}) {
  const { username } = await requireAxonPortalUser(params.username);
  const basePath = axonPublicPath(username);
  const report = await fetchHealthDashboard();

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <header className="text-center">
        <p className="text-xs uppercase tracking-[0.2em] text-axon-blue-glow">
          Northside Intelligence
        </p>
        <h1 className="mt-2 text-2xl font-semibold axon-gradient-text sm:text-3xl">
          System Health
        </h1>
        <p className="mt-2 text-sm text-axon-muted">
          One line per agent. Green means it checked in recently and everything looks fine.
        </p>
        <div className="mt-4">
          <Link href={`${basePath}/dashboard`} className="text-axon-blue-glow hover:underline">
            Back to AXON
          </Link>
        </div>
      </header>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-axon-border p-4 text-center">
          <p className="text-2xl font-semibold">{report.totals.prsWaitingReview}</p>
          <p className="text-xs text-axon-muted">Changes waiting on review</p>
        </div>
        <div className="rounded-lg border border-axon-border p-4 text-center">
          <p className="text-2xl font-semibold">{report.totals.mergesToday}</p>
          <p className="text-xs text-axon-muted">Shipped today</p>
        </div>
        <div className="rounded-lg border border-axon-border p-4 text-center">
          <p className="text-2xl font-semibold">${report.totals.costThisWeekUsd.toFixed(2)}</p>
          <p className="text-xs text-axon-muted">Spent this week</p>
        </div>
      </section>

      <section className="space-y-3">
        {report.agents.length === 0 && (
          <p className="text-sm text-axon-muted">No agents have checked in yet.</p>
        )}
        {report.agents.map((agent) => (
          <div
            key={agent.agent}
            className="flex items-start gap-3 rounded-lg border border-axon-border p-4"
          >
            <span
              aria-label={healthColorLabel(agent.color)}
              className={`mt-1 h-3 w-3 flex-shrink-0 rounded-full ${DOT_COLOR[agent.color]}`}
            />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <p className="font-medium">{agent.agent}</p>
                <p className="text-xs text-axon-muted">{healthColorLabel(agent.color)}</p>
              </div>
              <p className="mt-1 text-sm text-axon-muted">{agent.lastAction}</p>
              <p className="mt-1 text-xs text-axon-muted">
                {agent.openTickets === 0
                  ? "Nothing open right now."
                  : `${agent.openTickets} open ${agent.openTickets === 1 ? "item" : "items"}.`}
              </p>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
