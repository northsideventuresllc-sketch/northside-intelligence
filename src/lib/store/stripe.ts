import "server-only";

import Stripe from "stripe";
import { ensureBillingEnvHydrated, getBillingStripe } from "@/lib/billing/stripe";

let storeWebhookHydrated = false;

export async function ensureStoreStripeEnv(): Promise<void> {
  await ensureBillingEnvHydrated();
  if (storeWebhookHydrated) return;
  storeWebhookHydrated = true;

  const { readPlatformSecret } = await import("@/lib/platform-secrets");
  if (!process.env.STRIPE_WEBHOOK_SECRET_STORE?.trim()) {
    const secret = await readPlatformSecret("STRIPE_WEBHOOK_SECRET_STORE");
    if (secret) process.env.STRIPE_WEBHOOK_SECRET_STORE = secret;
  }
  if (!process.env.MAKE_STORE_WEBHOOK_URL?.trim()) {
    const url = await readPlatformSecret("MAKE_STORE_WEBHOOK_URL");
    if (url) process.env.MAKE_STORE_WEBHOOK_URL = url;
  }
}

export function getStoreStripe(): Stripe {
  return getBillingStripe();
}

export function getStoreWebhookSecret(): string | null {
  const secret = process.env.STRIPE_WEBHOOK_SECRET_STORE?.trim();
  return secret || null;
}

export function storeAppUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? "https://www.northsideintelligence.com";
}
