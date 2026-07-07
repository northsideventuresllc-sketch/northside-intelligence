import { createClient, type SupabaseClient } from "jsr:@supabase/supabase-js@2";

function extractBearerToken(authHeader: string | null): string | null {
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice("Bearer ".length).trim();
  return token || null;
}

/** Accept edge env key or any bearer that can read NI-Brain (vault/Vercel may drift). */
export async function authorizeServiceRoleRequest(
  supabaseUrl: string,
  authHeader: string | null
): Promise<{ ok: true; token: string } | { ok: false }> {
  const token = extractBearerToken(authHeader);
  if (!token) return { ok: false };

  const envKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")?.trim();
  if (envKey && token === envKey) return { ok: true, token };

  const probe = createClient(supabaseUrl, token, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { error } = await probe
    .from("ni_platform_secrets")
    .select("key")
    .limit(1);

  if (!error) return { ok: true, token };

  return { ok: false };
}

export function createServiceRoleClient(
  supabaseUrl: string,
  token: string
): SupabaseClient {
  return createClient(supabaseUrl, token, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
