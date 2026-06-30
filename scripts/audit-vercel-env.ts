/**
 * Audit NI Portal env vars on Vercel vs vercel.json vs ni_platform_secrets.
 *
 * Usage:
 *   npm run audit:vercel-env
 *   VERCEL_TOKEN=... SUPABASE_SERVICE_ROLE_KEY=... npm run audit:vercel-env
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createClient } from "@supabase/supabase-js";
import {
  VERCEL_NI_PROJECT,
  VERCEL_NI_TEAM_ID,
  auditVercelEnvCoverage,
  readVercelJsonEnvKeys,
  type VercelEnvAuditReport,
} from "../src/lib/infra/vercel-env-audit";

export interface HealthCheckResult {
  name: string;
  ok: boolean;
  detail: string;
}

const VERCEL_ENV_API = `https://api.vercel.com/v10/projects/${VERCEL_NI_PROJECT}/env?teamId=${VERCEL_NI_TEAM_ID}`;

function resolveSupabaseServiceKey(): string | null {
  return (
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    process.env.SUPABASE_SERVICE_KEY?.trim() ||
    null
  );
}

function resolveSupabaseUrl(): string | null {
  return (
    process.env.SUPABASE_URL?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
    null
  );
}

async function resolveVercelToken(): Promise<string | null> {
  const fromEnv = process.env.VERCEL_TOKEN?.trim();
  if (fromEnv) return fromEnv;

  const supabaseUrl = resolveSupabaseUrl();
  const serviceKey = resolveSupabaseServiceKey();
  if (!supabaseUrl || !serviceKey) return null;

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data } = await supabase
    .from("ni_platform_secrets")
    .select("value")
    .eq("key", "VERCEL_TOKEN")
    .maybeSingle();

  return data?.value?.trim() || null;
}

export async function fetchVercelProductionEnvKeys(token: string): Promise<string[]> {
  const res = await fetch(VERCEL_ENV_API, {
    headers: { Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(20_000),
  });

  if (!res.ok) {
    throw new Error(`Vercel env API ${res.status}: ${await res.text().catch(() => "")}`);
  }

  const payload = (await res.json()) as {
    envs?: Array<{ key: string; target?: string[] | string }>;
  };

  const keys = new Set<string>();
  for (const env of payload.envs ?? []) {
    const targets = Array.isArray(env.target) ? env.target : [env.target].filter(Boolean);
    if (targets.some((t) => t === "production")) {
      keys.add(env.key);
    }
  }
  return [...keys];
}

async function fetchVaultKeys(): Promise<string[]> {
  const supabaseUrl = resolveSupabaseUrl();
  const serviceKey = resolveSupabaseServiceKey();
  if (!supabaseUrl || !serviceKey) return [];

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await supabase.from("ni_platform_secrets").select("key");
  if (error) throw new Error(`ni_platform_secrets: ${error.message}`);
  return (data ?? []).map((row) => String(row.key)).filter(Boolean);
}

export async function runVercelEnvAudit(): Promise<VercelEnvAuditReport> {
  const token = await resolveVercelToken();
  if (!token) {
    return {
      vercelDashboardKeys: [],
      vercelJsonKeys: readVercelJsonEnvKeys(
        readFileSync(join(process.cwd(), "vercel.json"), "utf8")
      ),
      vaultKeys: await fetchVaultKeys().catch(() => []),
      gaps: [
        {
          key: "VERCEL_TOKEN",
          severity: "error",
          detail: "missing — cannot list Vercel project env (set env or store in ni_platform_secrets)",
        },
      ],
      ok: false,
    };
  }

  const vercelJsonText = readFileSync(join(process.cwd(), "vercel.json"), "utf8");
  const [vercelDashboardKeys, vaultKeys] = await Promise.all([
    fetchVercelProductionEnvKeys(token),
    fetchVaultKeys(),
  ]);

  return auditVercelEnvCoverage({
    vercelDashboardKeys,
    vercelJsonKeys: readVercelJsonEnvKeys(vercelJsonText),
    vaultKeys,
  });
}

export function vercelEnvAuditToHealthResults(report: VercelEnvAuditReport): HealthCheckResult[] {
  if (report.ok && report.gaps.length === 0) {
    return [
      {
        name: "vercel_env_audit",
        ok: true,
        detail: `${report.vercelDashboardKeys.length} Vercel dashboard keys; required keys covered`,
      },
    ];
  }

  const results: HealthCheckResult[] = [];
  for (const gap of report.gaps) {
    results.push({
      name: `vercel_env:${gap.key}`,
      ok: gap.severity !== "error",
      detail: gap.detail,
    });
  }

  if (results.length === 0) {
    results.push({
      name: "vercel_env_audit",
      ok: report.ok,
      detail: report.ok ? "all required keys covered" : "audit failed",
    });
  }

  return results;
}

function printReport(report: VercelEnvAuditReport): void {
  console.log("Vercel dashboard (production):", report.vercelDashboardKeys.join(", ") || "(none)");
  console.log("vercel.json env:", report.vercelJsonKeys.join(", ") || "(none)");
  console.log("ni_platform_secrets:", `${report.vaultKeys.length} keys`);

  if (report.gaps.length === 0) {
    console.log("\nOK: all required NI Portal keys are covered.");
    return;
  }

  console.log("\nGaps:");
  for (const gap of report.gaps) {
    console.log(`  ${gap.severity === "error" ? "FAIL" : "WARN"} ${gap.key}: ${gap.detail}`);
  }
}

async function main(): Promise<void> {
  const report = await runVercelEnvAudit();
  printReport(report);
  if (!report.ok) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
