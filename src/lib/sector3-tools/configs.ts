import { getSector3ToolProfile } from "@/lib/billing/sector3-tool-pricing";
import type { Sector3ToolRuntimeConfig } from "./types";

function capFor(slug: string, fallback: number): number {
  return getSector3ToolProfile(slug)?.freeTierMonthlyCap ?? fallback;
}

export const SIGNALDESK_CONFIG: Sector3ToolRuntimeConfig = {
  slug: "signaldesk",
  displayName: "Signal Desk",
  basePath: "/signaldesk",
  profileTable: "signaldesk_profiles",
  sessionsTable: "signaldesk_sessions",
  usageColumn: "signals_used_this_month",
  resetColumn: "signals_reset_at",
  usageUnit: "signals",
  freeTierCap: capFor("signaldesk", 10),
};

export const GAPSCAN_CONFIG: Sector3ToolRuntimeConfig = {
  slug: "gapscan",
  displayName: "GapScan",
  basePath: "/gapscan",
  profileTable: "gapscan_profiles",
  sessionsTable: "gapscan_sessions",
  usageColumn: "scans_used_this_month",
  resetColumn: "scans_reset_at",
  usageUnit: "scans",
  freeTierCap: capFor("gapscan", 10),
};

export const BRIDGEAI_CONFIG: Sector3ToolRuntimeConfig = {
  slug: "bridgeai",
  displayName: "BridgeAI",
  basePath: "/bridgeai",
  profileTable: "bridgeai_profiles",
  sessionsTable: "bridgeai_sessions",
  usageColumn: "workflows_used_this_month",
  resetColumn: "workflows_reset_at",
  usageUnit: "workflows",
  freeTierCap: capFor("bridgeai", 10),
};

export const SECTOR3_TOOL_CONFIGS = [
  SIGNALDESK_CONFIG,
  GAPSCAN_CONFIG,
  BRIDGEAI_CONFIG,
] as const;
