#!/usr/bin/env bash
# Push Stripe env vars to Vercel production + preview.
# Requires: VERCEL_TOKEN (https://vercel.com/account/tokens)
# Usage: VERCEL_TOKEN=... ./scripts/set-vercel-stripe-env.sh

set -euo pipefail

: "${VERCEL_TOKEN:?Set VERCEL_TOKEN}"

PROJECT="northside-intelligence"
TEAM_ID="team_dD8iOW15WOUr27k3QeswFBac"
API="https://api.vercel.com/v10/projects/${PROJECT}/env?teamId=${TEAM_ID}&upsert=true"

upsert_env() {
  local key="$1"
  local value="$2"
  local type="${3:-encrypted}"
  curl -sf -X POST "$API" \
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

: "${STRIPE_SECRET_KEY:?Set STRIPE_SECRET_KEY}"
: "${STRIPE_WEBHOOK_SECRET:?Set STRIPE_WEBHOOK_SECRET}"

upsert_env STRIPE_SECRET_KEY "$STRIPE_SECRET_KEY"
upsert_env STRIPE_WEBHOOK_SECRET "$STRIPE_WEBHOOK_SECRET"
upsert_env NEXT_PUBLIC_APP_URL "https://www.northsideintelligence.com"

if [[ -n "${NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY:-}" ]]; then
  upsert_env NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY "$NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"
fi

if [[ -n "${STRIPE_RESTRICTED_KEY:-}" ]]; then
  upsert_env STRIPE_RESTRICTED_KEY "$STRIPE_RESTRICTED_KEY"
fi

if [[ -n "${STRIPE_REPLYFLOW_WEBHOOK_SECRET:-}" ]]; then
  upsert_env STRIPE_REPLYFLOW_WEBHOOK_SECRET "$STRIPE_REPLYFLOW_WEBHOOK_SECRET"
fi

for tier in CORE PRO POWER; do
  for interval in MONTHLY ANNUAL; do
    var="STRIPE_NI_${tier}_${interval}_PRICE_ID"
    val="${!var:-}"
    if [[ -n "$val" ]]; then
      upsert_env "$var" "$val"
    fi
  done
done

# Fallbacks when only legacy STANDARD/PREMIUM/ULTIMATE env keys are present
declare -A NI_PRICE_FALLBACKS=(
  [STRIPE_NI_CORE_MONTHLY_PRICE_ID]="price_1The8IQXb5thRQWgDGJmAL2P"
  [STRIPE_NI_CORE_ANNUAL_PRICE_ID]="price_1The4FQXb5thRQWgSTitRx6n"
  [STRIPE_NI_PRO_MONTHLY_PRICE_ID]="price_1The4GQXb5thRQWgsNdGgMbY"
  [STRIPE_NI_PRO_ANNUAL_PRICE_ID]="price_1The4GQXb5thRQWg1K75hiYL"
  [STRIPE_NI_POWER_MONTHLY_PRICE_ID]="price_1The4HQXb5thRQWgKNuxytL8"
  [STRIPE_NI_POWER_ANNUAL_PRICE_ID]="price_1The4HQXb5thRQWgVH6gEDjy"
)
for key in "${!NI_PRICE_FALLBACKS[@]}"; do
  if [[ -z "${!key:-}" ]]; then
    upsert_env "$key" "${NI_PRICE_FALLBACKS[$key]}"
  fi
done

for legacy in SOLO TEAM AGENCY; do
  var="STRIPE_${legacy}_PRICE_ID"
  val="${!var:-}"
  if [[ -n "$val" ]]; then
    upsert_env "$var" "$val"
  fi
done

echo "Done. Redeploy production to pick up new env vars."
