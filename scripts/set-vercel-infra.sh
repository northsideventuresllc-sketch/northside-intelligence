#!/usr/bin/env bash
# Push store infra to Vercel: CRON_SECRET, shop domain, MAKE webhook, NI_STORE_LIVE.
#
# Usage:
#   VERCEL_TOKEN=... \
#   CRON_SECRET=... \
#   MAKE_STORE_WEBHOOK_URL=https://hook.us1.make.com/... \
#   NI_STORE_LIVE=true \
#     ./scripts/set-vercel-infra.sh

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

echo "=== Vercel store infra ==="
upsert_env CRON_SECRET "$CRON_SECRET"
add_domain "$SHOP_DOMAIN"

if [[ -n "${MAKE_STORE_WEBHOOK_URL:-}" ]]; then
  upsert_env MAKE_STORE_WEBHOOK_URL "$MAKE_STORE_WEBHOOK_URL"
else
  echo "SKIP MAKE_STORE_WEBHOOK_URL (set when Make.com CJ scenario is ready)"
fi

if [[ -n "${NI_STORE_LIVE:-}" ]]; then
  upsert_env NI_STORE_LIVE "$NI_STORE_LIVE"
else
  echo "SKIP NI_STORE_LIVE (set to true when launching checkout)"
fi

if [[ -n "${SERPAPI_API_KEY:-}" ]]; then
  upsert_env SERPAPI_API_KEY "$SERPAPI_API_KEY"
else
  echo "SKIP SERPAPI_API_KEY (optional web image fallback)"
fi

if [[ -n "${SPOCKET_API_KEY:-}" ]]; then
  upsert_env SPOCKET_API_KEY "$SPOCKET_API_KEY"
else
  echo "SKIP SPOCKET_API_KEY (set when Spocket account is ready)"
fi

if [[ -n "${ZENDROP_API_KEY:-}" ]]; then
  upsert_env ZENDROP_API_KEY "$ZENDROP_API_KEY"
else
  echo "SKIP ZENDROP_API_KEY (set when Zendrop MCP token is ready)"
fi

echo "Done. Redeploy production to pick up new env vars."
