/** External endpoints monitored by scripts/infra-health-check.ts */
export const INFRA_HEALTH_ENDPOINTS = {
  niStoreWebhook: "https://www.northsideintelligence.com/api/store/webhook",
  matchFitWebhook: "https://match-fit.net/api/webhooks/stripe",
} as const;

export const INFRA_HEALTH_GITHUB_SECRETS = [
  "GH_PAT",
  "SUPABASE_SERVICE_KEY",
  "VERCEL_TOKEN",
  "ANTHROPIC_API_KEY",
] as const;

/** arm3-pipeline.yml uses this name; treat as equivalent to SUPABASE_SERVICE_KEY. */
export const SUPABASE_SERVICE_KEY_ALIASES = [
  "SUPABASE_SERVICE_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
] as const;
