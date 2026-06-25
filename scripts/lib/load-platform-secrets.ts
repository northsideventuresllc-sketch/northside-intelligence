/**
 * Load platform secrets for CLI scripts without importing server-only modules.
 */
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://kxijunwgbrlfzvgkhklo.supabase.co";

export async function loadPlatformSecrets(keys: string[]): Promise<Record<string, string>> {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!serviceRoleKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is required for script secret hydration (set env or run from Vercel pull)."
    );
  }

  const supabase = createClient(SUPABASE_URL, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await supabase
    .from("ni_platform_secrets")
    .select("key, value")
    .in("key", keys);

  if (error) throw new Error(error.message);

  const out: Record<string, string> = {};
  for (const row of data ?? []) {
    if (row.key && row.value) out[row.key] = row.value;
  }
  return out;
}

export async function hydrateScriptEnv(keys: string[]): Promise<void> {
  const secrets = await loadPlatformSecrets(keys);
  for (const [key, value] of Object.entries(secrets)) {
    if (!process.env[key]?.trim()) {
      process.env[key] = value;
    }
  }
}
