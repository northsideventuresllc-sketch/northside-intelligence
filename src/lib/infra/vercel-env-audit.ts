/** NI Portal Vercel project — used by scripts/audit-vercel-env.ts */
export const VERCEL_NI_PROJECT = "northside-intelligence" as const;
export const VERCEL_NI_TEAM_ID = "team_dD8iOW15WOUr27k3QeswFBac" as const;

/**
 * Must be set on the Vercel project dashboard for production.
 * vercel.json and ni_platform_secrets do not satisfy these.
 */
export const VERCEL_DASHBOARD_REQUIRED_KEYS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "ANTHROPIC_API_KEY",
  "CRON_SECRET",
] as const;

/** Must exist somewhere: Vercel dashboard, vercel.json env, or ni_platform_secrets. */
export const NI_PORTAL_REQUIRED_KEYS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "NI_AUTH_GATEWAY_SECRET",
  "NEXT_PUBLIC_APP_URL",
  "ANTHROPIC_API_KEY",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "STRIPE_WEBHOOK_SECRET_STORE",
  "CRON_SECRET",
  "RESEND_API_KEY",
  "CJ_DROPSHIPPING_API_KEY",
  "NI_STORE_LIVE",
] as const;

/** Required for /ops — not hydrated from vault today. */
export const NI_PORTAL_VERCEL_ONLY_KEYS = ["NI_ADMIN_SECRET"] as const;

/** Vault key that satisfies a required env name when names differ. */
export const VAULT_KEY_ALIASES: Record<string, string[]> = {
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: ["STRIPE_PUBLISHABLE_KEY"],
  SUPABASE_SERVICE_ROLE_KEY: ["SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_SERVICE_KEY"],
};

export interface VercelEnvGap {
  key: string;
  severity: "error" | "warn";
  detail: string;
}

export interface VercelEnvAuditReport {
  vercelDashboardKeys: string[];
  vercelJsonKeys: string[];
  vaultKeys: string[];
  gaps: VercelEnvGap[];
  ok: boolean;
}

export function readVercelJsonEnvKeys(vercelJsonText: string): string[] {
  try {
    const parsed = JSON.parse(vercelJsonText) as { env?: Record<string, string> };
    return Object.keys(parsed.env ?? {});
  } catch {
    return [];
  }
}

export function resolveKeyCoverage(
  key: string,
  sources: {
    vercelDashboard: Set<string>;
    vercelJson: Set<string>;
    vault: Set<string>;
  }
): "vercel" | "vercel_json" | "vault" | "missing" {
  if (sources.vercelDashboard.has(key)) return "vercel";
  if (sources.vercelJson.has(key)) return "vercel_json";
  if (sources.vault.has(key)) return "vault";
  for (const alias of VAULT_KEY_ALIASES[key] ?? []) {
    if (sources.vault.has(alias)) return "vault";
  }
  return "missing";
}

export function auditVercelEnvCoverage(input: {
  vercelDashboardKeys: string[];
  vercelJsonKeys: string[];
  vaultKeys: string[];
}): VercelEnvAuditReport {
  const vercelDashboard = new Set(input.vercelDashboardKeys);
  const vercelJson = new Set(input.vercelJsonKeys);
  const vault = new Set(input.vaultKeys);
  const sources = { vercelDashboard, vercelJson, vault };
  const gaps: VercelEnvGap[] = [];

  for (const key of VERCEL_DASHBOARD_REQUIRED_KEYS) {
    if (!vercelDashboard.has(key)) {
      const elsewhere = resolveKeyCoverage(key, sources);
      if (elsewhere === "vault" && key === "CRON_SECRET") {
        gaps.push({
          key,
          severity: "error",
          detail:
            "in ni_platform_secrets only — Vercel Cron sends Authorization from project env; add CRON_SECRET to Vercel dashboard",
        });
      } else if (elsewhere === "missing") {
        gaps.push({
          key,
          severity: "error",
          detail: "missing from Vercel dashboard (and nowhere else)",
        });
      } else if (elsewhere === "vercel_json") {
        gaps.push({
          key,
          severity: "warn",
          detail: "only in vercel.json — also set on Vercel dashboard for consistency",
        });
      }
    }
  }

  for (const key of NI_PORTAL_VERCEL_ONLY_KEYS) {
    if (!vercelDashboard.has(key) && !vercelJson.has(key)) {
      gaps.push({
        key,
        severity: "error",
        detail: "missing from Vercel — /ops login and auth encryption require NI_ADMIN_SECRET on the project",
      });
    }
  }

  for (const key of NI_PORTAL_REQUIRED_KEYS) {
    const coverage = resolveKeyCoverage(key, sources);
    if (coverage === "missing") {
      gaps.push({
        key,
        severity: "error",
        detail: "missing from Vercel, vercel.json, and ni_platform_secrets",
      });
    }
  }

  const deduped = new Map<string, VercelEnvGap>();
  for (const gap of gaps) {
    const existing = deduped.get(gap.key);
    if (!existing || gap.severity === "error") {
      deduped.set(gap.key, gap);
    }
  }

  const finalGaps = Array.from(deduped.values());
  return {
    vercelDashboardKeys: Array.from(vercelDashboard).sort(),
    vercelJsonKeys: Array.from(vercelJson).sort(),
    vaultKeys: Array.from(vault).sort(),
    gaps: finalGaps,
    ok: finalGaps.every((g) => g.severity !== "error"),
  };
}
