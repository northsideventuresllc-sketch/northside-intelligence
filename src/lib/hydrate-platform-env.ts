import "server-only";

import {
  isPlaceholderStripePublishableKey,
  isPlaceholderStripeSecretKey,
  isPlaceholderStripeWebhookSecret,
  resolvePlatformSecret,
} from "@/lib/platform-secrets";

function isMissingSecret(value: string | null | undefined): boolean {
  const trimmed = value?.trim();
  if (!trimmed) return true;
  if (trimmed.includes("...")) return true;
  return false;
}

let hydratePromise: Promise<void> | null = null;

/** Load live Stripe config from `ni_platform_secrets` when Vercel env is missing. */
export async function hydratePlatformEnvFromDatabase(): Promise<void> {
  if (hydratePromise) return hydratePromise;

  hydratePromise = (async () => {
    const secret = await resolvePlatformSecret(
      "STRIPE_SECRET_KEY",
      process.env.STRIPE_SECRET_KEY,
      isPlaceholderStripeSecretKey
    );
    if (secret) process.env.STRIPE_SECRET_KEY = secret;

    const publishable = await resolvePlatformSecret(
      "STRIPE_PUBLISHABLE_KEY",
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? process.env.STRIPE_PUBLISHABLE_KEY,
      isPlaceholderStripePublishableKey
    );
    if (publishable) {
      process.env.STRIPE_PUBLISHABLE_KEY = publishable;
      if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim()) {
        process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = publishable;
      }
    }

    const webhook = await resolvePlatformSecret(
      "STRIPE_WEBHOOK_SECRET",
      process.env.STRIPE_WEBHOOK_SECRET,
      isPlaceholderStripeWebhookSecret
    );
    if (webhook) process.env.STRIPE_WEBHOOK_SECRET = webhook;

    const restricted = await resolvePlatformSecret(
      "STRIPE_RESTRICTED_KEY",
      process.env.STRIPE_RESTRICTED_KEY,
      isMissingSecret
    );
    if (restricted) process.env.STRIPE_RESTRICTED_KEY = restricted;

    const replyflowWebhook = await resolvePlatformSecret(
      "STRIPE_REPLYFLOW_WEBHOOK_SECRET",
      process.env.STRIPE_REPLYFLOW_WEBHOOK_SECRET,
      isPlaceholderStripeWebhookSecret
    );
    if (replyflowWebhook) process.env.STRIPE_REPLYFLOW_WEBHOOK_SECRET = replyflowWebhook;
  })();

  return hydratePromise;
}
