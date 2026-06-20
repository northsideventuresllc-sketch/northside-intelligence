/** Load NI platform secrets from ni_platform_secrets (service role). */
import { createClient } from "jsr:@supabase/supabase-js@2";

const cache = new Map<string, string>();

export async function readPlatformSecret(key: string): Promise<string | null> {
  const cached = cache.get(key);
  if (cached) return cached;

  const envValue = Deno.env.get(key)?.trim();
  if (envValue) {
    cache.set(key, envValue);
    return envValue;
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) return null;

  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const { data, error } = await supabase
    .from("ni_platform_secrets")
    .select("value")
    .eq("key", key)
    .maybeSingle();

  if (error || !data?.value) return null;

  cache.set(key, data.value);
  return data.value;
}
