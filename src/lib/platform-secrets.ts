import "server-only";

import { createServiceClient } from "@/lib/supabase/server";

const CACHE_TTL_MS = 5 * 60 * 1000;
const cache = new Map<string, { value: string; expiresAt: number }>();

function isMissingSecret(value: string | null | undefined): boolean {
  const trimmed = value?.trim();
  if (!trimmed) return true;
  if (trimmed.includes("...")) return true;
  return false;
}

export function isPlaceholderStripeSecretKey(key: string | null | undefined): boolean {
  const value = key?.trim();
  if (isMissingSecret(value)) return true;
  if (process.env.VERCEL_ENV === "production" && value!.startsWith("sk_test_")) return true;
  return false;
}

export function isPlaceholderStripePublishableKey(key: string | null | undefined): boolean {
  const value = key?.trim();
  if (isMissingSecret(value)) return true;
  if (process.env.VERCEL_ENV === "production" && value!.startsWith("pk_test_")) return true;
  return false;
}

export function isPlaceholderStripeWebhookSecret(key: string | null | undefined): boolean {
  const value = key?.trim();
  if (isMissingSecret(value)) return true;
  if (value === "whsec_test" || value!.startsWith("whsec_test_")) {
    return process.env.VERCEL_ENV === "production";
  }
  return false;
}

export async function readPlatformSecret(key: string): Promise<string | null> {
  const cached = cache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.value;

  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("ni_platform_secrets")
      .select("value")
      .eq("key", key)
      .maybeSingle();

    if (error || !data?.value) return null;

    cache.set(key, { value: data.value, expiresAt: Date.now() + CACHE_TTL_MS });
    return data.value;
  } catch {
    return null;
  }
}

export async function resolvePlatformSecret(
  key: string,
  envValue: string | undefined,
  isPlaceholder: (value: string | null | undefined) => boolean
): Promise<string | null> {
  if (!isPlaceholder(envValue)) return envValue!.trim();
  return readPlatformSecret(key);
}

export function clearPlatformSecretCache(): void {
  cache.clear();
}
