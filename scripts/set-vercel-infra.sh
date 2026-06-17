#!/usr/bin/env bash
# Push CRON_SECRET to Vercel and attach shop.northsideintelligence.com.
#
# Usage:
#   VERCEL_TOKEN=... CRON_SECRET=... ./scripts/set-vercel-infra.sh
#
# CRON_SECRET defaults to the value in NI-Brain when omitted (see ni_platform_secrets).

set -euo pipefail

: "${VERCEL_TOKEN:?Set VERCEL_TOKEN}"

PROJECT="northside-intelligence"
TEAM_ID="team_dD8iOW15WOUr27k3QeswFBac"
SHOP_DOMAIN="shop.northsideintelligence.com"
ENV_API="https://api.vercel.com/v10/projects/${PROJECT}/env?teamId=${TEAM_ID}&upsert=true"
DOMAIN_API="https://api.vercel.com/v10/projects/${PROJECT}/domains?teamId=${TEAM_ID}"

upsert_env() {
  local key="$1"
  local value="$2"
  curl -sf -X POST "$ENV_API" \
    -H "Authorization: Bearer ${VERCEL_TOKEN}" \
    -H "Content-Type: application/json" \
    -d "$(jq -n \
      --arg key "$key" \
      --arg value "$value" \
      '[{key: $key, value: $value, type: "encrypted", target: ["production","preview"]}]')" \
    > /dev/null
  echo "Set $key"
}

add_domain() {
  local domain="$1"
  if curl -sf -X POST "$DOMAIN_API" \
    -H "Authorization: Bearer ${VERCEL_TOKEN}" \
    -H "Content-Type: application/json" \
    -d "$(jq -n --arg name "$domain" '{name: $name}')" > /dev/null 2>&1; then
    echo "Added domain $domain"
  else
    echo "Domain $domain may already exist — verify in Vercel Domains tab"
  fi
}

: "${CRON_SECRET:?Set CRON_SECRET (openssl rand -hex 32)}"

echo "=== Vercel infra: CRON_SECRET + shop domain ==="
upsert_env CRON_SECRET "$CRON_SECRET"
add_domain "$SHOP_DOMAIN"
echo "Done. Redeploy production to pick up CRON_SECRET."
