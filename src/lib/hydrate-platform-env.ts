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

    const storeWebhook = await resolvePlatformSecret(
      "STRIPE_WEBHOOK_SECRET_STORE",
      process.env.STRIPE_WEBHOOK_SECRET_STORE,
      isPlaceholderStripeWebhookSecret
    );
    if (storeWebhook) process.env.STRIPE_WEBHOOK_SECRET_STORE = storeWebhook;

    const makeStoreUrl = await resolvePlatformSecret(
      "MAKE_STORE_WEBHOOK_URL",
      process.env.MAKE_STORE_WEBHOOK_URL,
      (value) => !value?.trim()
    );
    if (makeStoreUrl) process.env.MAKE_STORE_WEBHOOK_URL = makeStoreUrl;

    const anthropic = await resolvePlatformSecret(
      "ANTHROPIC_API_KEY",
      process.env.ANTHROPIC_API_KEY,
      (value) => !value?.trim()
    );
    if (anthropic) process.env.ANTHROPIC_API_KEY = anthropic;

    const cjKey = await resolvePlatformSecret(
      "CJ_DROPSHIPPING_API_KEY",
      process.env.CJ_DROPSHIPPING_API_KEY,
      (value) => !value?.trim()
    );
    if (cjKey) process.env.CJ_DROPSHIPPING_API_KEY = cjKey;

    const cronSecret = await resolvePlatformSecret(
      "CRON_SECRET",
      process.env.CRON_SECRET,
      (value) => !value?.trim()
    );
    if (cronSecret) process.env.CRON_SECRET = cronSecret;
  })();

  return hydratePromise;
}
