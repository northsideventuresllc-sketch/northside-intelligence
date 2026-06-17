#!/usr/bin/env bash
# Push NI Store env vars to Vercel production + preview.
# Verifies core Stripe/Anthropic keys before adding store-specific vars.
#
# Usage:
#   VERCEL_TOKEN=... \
#   STRIPE_WEBHOOK_SECRET_STORE=whsec_... \
#   MAKE_STORE_WEBHOOK_URL=https://hook.us1.make.com/... \
#     ./scripts/set-vercel-store-env.sh

set -euo pipefail

: "${VERCEL_TOKEN:?Set VERCEL_TOKEN}"

PROJECT="northside-intelligence"
TEAM_ID="team_dD8iOW15WOUr27k3QeswFBac"
API="https://api.vercel.com/v10/projects/${PROJECT}/env?teamId=${TEAM_ID}"
UPSERT_API="${API}&upsert=true"

list_env() {
  curl -sf -H "Authorization: Bearer ${VERCEL_TOKEN}" "${API}" \
    | jq -r '.envs[]? | "\(.key)=\(.target|tostring)"' 2>/dev/null || true
}

has_env_key() {
  local key="$1"
  list_env | grep -q "^${key}=" || return 1
}

upsert_env() {
  local key="$1"
  local value="$2"
  local type="${3:-encrypted}"
  curl -sf -X POST "$UPSERT_API" \
    -H "Authorization: Bearer ${VERCEL_TOKEN}" \
    -H "Content-Type: application/json" \
    -d "$(jq -n \
      --arg key "$key" \
      --arg value "$value" \
      --arg type "$type" \
      '[{key: $key, value: $value, type: $type, target: ["production","preview"]}]')" \
    > /dev/null
  echo "Set $key"
}

echo "=== Verifying existing Vercel env ==="
for key in ANTHROPIC_API_KEY STRIPE_SECRET_KEY NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY; do
  if has_env_key "$key"; then
    echo "OK  $key (already set)"
  else
    echo "MISSING $key — set via Vercel dashboard or scripts/set-vercel-stripe-env.sh"
  fi
done

echo ""
echo "=== NI Store env ==="
: "${STRIPE_WEBHOOK_SECRET_STORE:?Set STRIPE_WEBHOOK_SECRET_STORE}"
: "${MAKE_STORE_WEBHOOK_URL:?Set MAKE_STORE_WEBHOOK_URL}"

upsert_env STRIPE_WEBHOOK_SECRET_STORE "$STRIPE_WEBHOOK_SECRET_STORE"
upsert_env MAKE_STORE_WEBHOOK_URL "$MAKE_STORE_WEBHOOK_URL"
upsert_env NI_STORE_LIVE "${NI_STORE_LIVE:-false}"

if [[ -n "${CJ_DROPSHIPPING_API_KEY:-}" ]]; then
  upsert_env CJ_DROPSHIPPING_API_KEY "$CJ_DROPSHIPPING_API_KEY"
else
  echo "SKIP CJ_DROPSHIPPING_API_KEY (not provided)"
fi

echo "Done. Redeploy production to pick up new env vars."
