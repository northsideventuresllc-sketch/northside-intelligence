import "server-only";

import {
  isPlaceholderStripePublishableKey,
  isPlaceholderStripeSecretKey,
  isPlaceholderStripeWebhookSecret,
  resolvePlatformSecret,
} from "@/lib/platform-secrets";
import { isPlaceholderMakeStoreWebhookUrl } from "@/lib/store/gate";

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
      isPlaceholderMakeStoreWebhookUrl
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

    const storeLive = await resolvePlatformSecret(
      "NI_STORE_LIVE",
      process.env.NI_STORE_LIVE,
      (value) => !value?.trim()
    );
    if (storeLive) process.env.NI_STORE_LIVE = storeLive;

    const serpApi = await resolvePlatformSecret(
      "SERPAPI_API_KEY",
      process.env.SERPAPI_API_KEY,
      (value) => !value?.trim()
    );
    if (serpApi) process.env.SERPAPI_API_KEY = serpApi;

    const resend = await resolvePlatformSecret(
      "RESEND_API_KEY",
      process.env.RESEND_API_KEY,
      (value) => !value?.trim()
    );
    if (resend) process.env.RESEND_API_KEY = resend;

    const kitApiKey = await resolvePlatformSecret(
      "KIT_API_KEY",
      process.env.KIT_API_KEY,
      (value) => !value?.trim()
    );
    if (kitApiKey) process.env.KIT_API_KEY = kitApiKey;

    const kitFormId = await resolvePlatformSecret(
      "KIT_FORM_ID",
      process.env.KIT_FORM_ID,
      (value) => !value?.trim()
    );
    if (kitFormId) process.env.KIT_FORM_ID = kitFormId;

    const kitApiSecret = await resolvePlatformSecret(
      "KIT_API_SECRET",
      process.env.KIT_API_SECRET,
      (value) => !value?.trim()
    );
    if (kitApiSecret) process.env.KIT_API_SECRET = kitApiSecret;

    const serviceRole = await resolvePlatformSecret(
      "SUPABASE_SERVICE_ROLE_KEY",
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      (value) => !value?.trim()
    );
    if (serviceRole) process.env.SUPABASE_SERVICE_ROLE_KEY = serviceRole;
  })();

  return hydratePromise;
}
