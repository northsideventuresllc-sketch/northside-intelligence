/**
 * Weekly infra health check — run manually or via .github/workflows/infra-health-check.yml
 *
 * Usage:
 *   npx tsx scripts/infra-health-check.ts
 *   npx tsx scripts/infra-health-check.ts --write-session-log
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import {
  INFRA_HEALTH_ENDPOINTS,
  INFRA_HEALTH_GITHUB_SECRETS,
  SUPABASE_SERVICE_KEY_ALIASES,
} from "../src/lib/infra/health-endpoints";
import { runVercelEnvAudit, vercelEnvAuditToHealthResults } from "./audit-vercel-env";

const SESSION_LOG_PATH = join(process.cwd(), "docs", "session-log.md");
const URGENT_MARKER = "<!-- URGENT:infra-health-check -->";

export interface HealthCheckResult {
  name: string;
  ok: boolean;
  detail: string;
}

function resolveSupabaseServiceKey(): string | null {
  for (const key of SUPABASE_SERVICE_KEY_ALIASES) {
    const value = process.env[key]?.trim();
    if (value) return value;
  }
  return null;
}

export function checkGithubSecretsFromEnv(): HealthCheckResult[] {
  return INFRA_HEALTH_GITHUB_SECRETS.map((name) => {
    if (name === "SUPABASE_SERVICE_KEY") {
      const value = resolveSupabaseServiceKey();
      return {
        name,
        ok: Boolean(value),
        detail: value
          ? "present (SUPABASE_SERVICE_KEY or SUPABASE_SERVICE_ROLE_KEY)"
          : "missing — set SUPABASE_SERVICE_KEY or SUPABASE_SERVICE_ROLE_KEY",
      };
    }

    const value = process.env[name]?.trim();
    return {
      name,
      ok: Boolean(value),
      detail: value ? "present" : `missing — GitHub Actions secret ${name} not set`,
    };
  });
}

export async function checkArm3RecentActivity(
  supabaseUrl: string,
  serviceKey: string
): Promise<HealthCheckResult[]> {
  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [logsRes, oppsRes] = await Promise.all([
    supabase
      .from("arm3_weekly_logs")
      .select("id", { count: "exact", head: true })
      .gte("created_at", since),
    supabase
      .from("arm3_opportunities")
      .select("id", { count: "exact", head: true })
      .gte("created_at", since),
  ]);

  const results: HealthCheckResult[] = [];

  if (logsRes.error) {
    results.push({
      name: "arm3_weekly_logs",
      ok: false,
      detail: `query failed: ${logsRes.error.message}`,
    });
  } else {
    const count = logsRes.count ?? 0;
    results.push({
      name: "arm3_weekly_logs",
      ok: count > 0,
      detail:
        count > 0
          ? `${count} row(s) in last 7 days`
          : "no rows in last 7 days — API key or RPC may be silently broken",
    });
  }

  if (oppsRes.error) {
    results.push({
      name: "arm3_opportunities",
      ok: false,
      detail: `query failed: ${oppsRes.error.message}`,
    });
  } else {
    const count = oppsRes.count ?? 0;
    results.push({
      name: "arm3_opportunities",
      ok: count > 0,
      detail:
        count > 0
          ? `${count} row(s) in last 7 days`
          : "no rows in last 7 days — pipeline or generate-tool may be stalled",
    });
  }

  return results;
}

export async function pingWebhook(url: string, label: string): Promise<HealthCheckResult> {
  try {
    const res = await fetch(url, { method: "GET", signal: AbortSignal.timeout(15_000) });
    const ok = res.status === 200;
    return {
      name: label,
      ok,
      detail: ok ? `GET ${url} → 200` : `GET ${url} → ${res.status} (expected 200)`,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { name: label, ok: false, detail: `GET ${url} failed: ${message}` };
  }
}

export async function runInfraHealthCheck(): Promise<HealthCheckResult[]> {
  const results: HealthCheckResult[] = [];

  results.push(...checkGithubSecretsFromEnv());

  const supabaseUrl = process.env.SUPABASE_URL?.trim() ?? process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceKey = resolveSupabaseServiceKey();

  if (!supabaseUrl || !serviceKey) {
    results.push({
      name: "arm3_supabase",
      ok: false,
      detail: "skipped arm3 table checks — SUPABASE_URL or service key missing",
    });
  } else {
    results.push(...(await checkArm3RecentActivity(supabaseUrl, serviceKey)));
  }

  results.push(
    await pingWebhook(INFRA_HEALTH_ENDPOINTS.niStoreWebhook, "ni_store_webhook"),
    await pingWebhook(INFRA_HEALTH_ENDPOINTS.matchFitWebhook, "match_fit_webhook")
  );

  try {
    const vercelAudit = await runVercelEnvAudit();
    results.push(...vercelEnvAuditToHealthResults(vercelAudit));
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    results.push({
      name: "vercel_env_audit",
      ok: false,
      detail: `audit failed: ${message}`,
    });
  }

  return results;
}

export function formatUrgentBlock(results: HealthCheckResult[]): string {
  const failures = results.filter((r) => !r.ok);
  const runDate = new Date().toISOString();
  const lines = failures.map((f) => `- **${f.name}**: ${f.detail}`);
  return [
    URGENT_MARKER,
    "",
    "## 🚨 URGENT — infra-health-check",
    "",
    `Run: ${runDate}`,
    "",
    ...lines,
    "",
    URGENT_MARKER,
    "",
  ].join("\n");
}

export function prependUrgentToSessionLog(urgentBlock: string): void {
  const header = `# Session Log

Agent session notes. **Read the 🚨 URGENT block first** — do not bury alerts in Carry-over.

`;

  let body = "";
  if (existsSync(SESSION_LOG_PATH)) {
    body = readFileSync(SESSION_LOG_PATH, "utf8");
    const markerIndex = body.indexOf(URGENT_MARKER);
    if (markerIndex !== -1) {
      const endIndex = body.indexOf(URGENT_MARKER, markerIndex + URGENT_MARKER.length);
      if (endIndex !== -1) {
        body = body.slice(0, markerIndex) + body.slice(endIndex + URGENT_MARKER.length);
      }
    }
    body = body.replace(/^# Session Log[^\n]*\n+/, "");
    body = body.replace(/^Agent session notes\.[^\n]*\n+/, "");
  } else {
    body = `## Carry-over

_(none)_

`;
  }

  writeFileSync(SESSION_LOG_PATH, `${header}${urgentBlock}${body.trimStart()}`, "utf8");
}

export function clearUrgentFromSessionLog(): void {
  if (!existsSync(SESSION_LOG_PATH)) return;
  let body = readFileSync(SESSION_LOG_PATH, "utf8");
  const markerIndex = body.indexOf(URGENT_MARKER);
  if (markerIndex === -1) return;
  const endIndex = body.indexOf(URGENT_MARKER, markerIndex + URGENT_MARKER.length);
  if (endIndex === -1) return;
  body = body.slice(0, markerIndex) + body.slice(endIndex + URGENT_MARKER.length);
  writeFileSync(SESSION_LOG_PATH, body.replace(/\n{3,}/g, "\n\n"), "utf8");
}

async function logSuccessToArm3(results: HealthCheckResult[]): Promise<void> {
  const supabaseUrl = process.env.SUPABASE_URL?.trim() ?? process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceKey = resolveSupabaseServiceKey();
  if (!supabaseUrl || !serviceKey) return;

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const weekOf = new Date().toISOString().split("T")[0];
  const { error } = await supabase.from("arm3_weekly_logs").insert({
    week_of: weekOf,
    log_type: "infra_health_check",
    summary: "infra-health-check passed",
    detail: { checks: results },
    action_required: false,
  });

  if (error) {
    console.warn("arm3_weekly_logs insert failed:", error.message);
  }
}

async function main(): Promise<void> {
  const writeSessionLog = process.argv.includes("--write-session-log");
  const results = await runInfraHealthCheck();
  const failures = results.filter((r) => !r.ok);

  console.log("infra-health-check results:");
  for (const result of results) {
    console.log(`  ${result.ok ? "OK" : "FAIL"} ${result.name}: ${result.detail}`);
  }

  if (failures.length > 0) {
    const urgent = formatUrgentBlock(results);
    if (writeSessionLog) {
      prependUrgentToSessionLog(urgent);
      console.error("\nWrote 🚨 URGENT block to docs/session-log.md");
    }
    console.error(`\n${failures.length} check(s) failed.`);
    process.exit(1);
  }

  if (writeSessionLog) {
    clearUrgentFromSessionLog();
  }

  await logSuccessToArm3(results);
  console.log("\nAll infra-health-check checks passed.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
