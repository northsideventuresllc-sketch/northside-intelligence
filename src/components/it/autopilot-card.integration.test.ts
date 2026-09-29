import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = path.resolve(__dirname, "../../..");

function src(rel: string): string {
  return readFileSync(path.join(root, rel), "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|[^:])\/\/.*$/gm, "$1");
}

const count = (s: string, needle: string) => s.split(needle).length - 1;

describe("Autopilot Coming Soon card wiring (source-level)", () => {
  it("Sector3ToolDashboard renders the card exactly once in JSX", () => {
    expect(count(src("src/components/sector3/Sector3ToolDashboard.tsx"), "<AutopilotComingSoonCard")).toBe(1);
  });

  it("create-dashboard-page uses Sector3ToolDashboard on both render paths", () => {
    expect(count(src("src/lib/sector3-tools/create-dashboard-page.tsx"), "<Sector3ToolDashboard")).toBe(2);
  });

  it.each(["gapscan", "signaldesk", "bridgeai"])("%s dashboard page goes through createSector3DashboardPage", (slug) => {
    expect(src(`src/app/${slug}/dashboard/page.tsx`)).toContain("createSector3DashboardPage");
  });

  it.each(["grantbot", "replyflow"])("%s DashboardClient renders the card", (slug) => {
    expect(count(src(`src/app/${slug}/dashboard/DashboardClient.tsx`), "<AutopilotComingSoonCard")).toBe(1);
  });
});
