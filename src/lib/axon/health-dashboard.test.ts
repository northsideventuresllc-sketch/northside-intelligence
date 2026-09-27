import { describe, it, expect } from "vitest";
import {
  computeAgentHealth,
  openTicketsForAgent,
  totalOpenTickets,
  prsWaitingReview,
  mergesToday,
  costThisWeek,
  buildHealthDashboard,
} from "./health-dashboard";

const NOW = new Date("2026-09-27T18:00:00Z");
const minsAgo = (n: number) => new Date(NOW.getTime() - n * 60_000).toISOString();

describe("computeAgentHealth", () => {
  it("is green when the last check-in was under an hour ago", () => {
    expect(computeAgentHealth({ agent_name: "PULSE", last_seen_at: minsAgo(10) }, NOW)).toBe("green");
  });

  it("is yellow when the last check-in was between 1 and 24 hours ago", () => {
    expect(computeAgentHealth({ agent_name: "PULSE", last_seen_at: minsAgo(5 * 60) }, NOW)).toBe("yellow");
  });

  it("is red when the last check-in was over 24 hours ago", () => {
    expect(computeAgentHealth({ agent_name: "PULSE", last_seen_at: minsAgo(60 * 60) }, NOW)).toBe("red");
  });

  it("is red with no last_seen_at at all", () => {
    expect(computeAgentHealth({ agent_name: "GHOST" }, NOW)).toBe("red");
  });

  it("is red when the row itself reports an error status, even if recent", () => {
    expect(computeAgentHealth({ agent_name: "BROKEN", status: "error", last_seen_at: minsAgo(1) }, NOW)).toBe("red");
  });
});

describe("ticket counts", () => {
  const dispatch = [
    { owner: "PULSE", status: "queued" },
    { owner: "pulse", status: "in_progress" },
    { owner: "PULSE", status: "done" },
    { owner: "BUILD", status: "queued" },
  ];

  it("counts only non-terminal tickets for one agent, case-insensitively", () => {
    expect(openTicketsForAgent(dispatch, "PULSE")).toBe(2);
  });

  it("counts total open tickets across all agents", () => {
    expect(totalOpenTickets(dispatch)).toBe(3);
  });
});

describe("PR totals", () => {
  const reviews = [
    { verdict: "pass", reviewed_at: NOW.toISOString() },
    { verdict: "reject", reviewed_at: NOW.toISOString() },
    { verdict: "pass", reviewed_at: "2026-09-20T00:00:00Z" },
  ];

  it("counts PRs still waiting (not a pass verdict)", () => {
    expect(prsWaitingReview(reviews)).toBe(1);
  });

  it("counts only today's passes as merges today", () => {
    expect(mergesToday(reviews, NOW)).toBe(1);
  });
});

describe("costThisWeek", () => {
  it("sums cost within the trailing 7 days and ignores older rows", () => {
    const ledger = [
      { cost_usd: 1.234, called_at: minsAgo(60) },
      { cost_usd: 2.5, called_at: minsAgo(60 * 24 * 3) },
      { cost_usd: 100, called_at: minsAgo(60 * 24 * 10) },
    ];
    expect(costThisWeek(ledger, NOW)).toBe(3.73);
  });
});

describe("buildHealthDashboard", () => {
  it("rolls presence/dispatch/reviews/ledger into one sorted, plain-labels-ready report", () => {
    const report = buildHealthDashboard(
      {
        presence: [
          { agent_name: "PULSE", last_seen_at: minsAgo(5), last_action: "Ran the daily sweep." },
          { agent_name: "ARCEUS", last_seen_at: minsAgo(60 * 30) },
        ],
        dispatch: [{ owner: "PULSE", status: "queued" }],
        prReviews: [{ verdict: "pass", reviewed_at: NOW.toISOString() }],
        costLedger: [{ cost_usd: 5, called_at: minsAgo(60) }],
      },
      NOW,
    );
    expect(report.agents.map((a) => a.agent)).toEqual(["ARCEUS", "PULSE"]);
    expect(report.agents[1].color).toBe("green");
    expect(report.agents[1].openTickets).toBe(1);
    expect(report.agents[0].lastAction).toBe("No recent activity logged.");
    expect(report.totals.mergesToday).toBe(1);
    expect(report.totals.costThisWeekUsd).toBe(5);
  });
});
