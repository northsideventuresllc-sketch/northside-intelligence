#!/usr/bin/env bash
# Push Sector 3 pipeline secrets to Vercel + GitHub.
#
# Usage:
#   VERCEL_TOKEN=... \
#   SUPABASE_SERVICE_ROLE_KEY=... \
#   ANTHROPIC_API_KEY=... \
#   RESEND_API_KEY=... \
#   ./scripts/set-sector3-secrets.sh
#
# CRON_SECRET is generated if not provided. The same value must exist in
# ni_platform_secrets (already synced) and Vercel for cron auth to work.

set -euo pipefail

PROJECT="northside-intelligence"
TEAM_ID="team_dD8iOW15WOUr27k3QeswFBac"
EDGE_URL="https://kxijunwgbrlfzvgkhklo.supabase.co/functions/v1"
CRON_SECRET="${CRON_SECRET:-$(openssl rand -hex 32)}"

upsert_vercel_env() {
  : "${VERCEL_TOKEN:?Set VERCEL_TOKEN (https://vercel.com/account/tokens)}"
  local key="$1"
  local value="$2"
  curl -sf -X POST \
    "https://api.vercel.com/v10/projects/${PROJECT}/env?teamId=${TEAM_ID}&upsert=true" \
    -H "Authorization: Bearer ${VERCEL_TOKEN}" \
    -H "Content-Type: application/json" \
    -d "$(jq -n \
      --arg key "$key" \
      --arg value "$value" \
      '[{key: $key, value: $value, type: "encrypted", target: ["production","preview"]}]')" \
    > /dev/null
  echo "Vercel: set $key"
}

set_github_secret() {
  local name="$1"
  local value="$2"
  if gh secret set "$name" --body "$value" -R northsideventuresllc-sketch/northside-intelligence; then
    echo "GitHub: set $name"
  else
    echo "GitHub: SKIP $name (add manually in repo Settings → Secrets → Actions)"
  fi
}

echo "=== Sector 3 secrets ==="

if [[ -n "${VERCEL_TOKEN:-}" ]]; then
  upsert_vercel_env CRON_SECRET "$CRON_SECRET"
  [[ -n "${SUPABASE_SERVICE_ROLE_KEY:-}" ]] && upsert_vercel_env SUPABASE_SERVICE_ROLE_KEY "$SUPABASE_SERVICE_ROLE_KEY"
  [[ -n "${ANTHROPIC_API_KEY:-}" ]] && upsert_vercel_env ANTHROPIC_API_KEY "$ANTHROPIC_API_KEY"
  [[ -n "${RESEND_API_KEY:-}" ]] && upsert_vercel_env RESEND_API_KEY "$RESEND_API_KEY"
else
  echo "SKIP Vercel (VERCEL_TOKEN not set)"
fi

if command -v gh >/dev/null 2>&1; then
  [[ -n "${SUPABASE_SERVICE_ROLE_KEY:-}" ]] && set_github_secret SUPABASE_SERVICE_ROLE_KEY "$SUPABASE_SERVICE_ROLE_KEY"
  set_github_secret SUPABASE_EDGE_FUNCTION_URL "$EDGE_URL"
else
  echo "SKIP GitHub (gh not installed)"
fi

echo ""
echo "CRON_SECRET for this run: $CRON_SECRET"
echo "Ensure this matches ni_platform_secrets.CRON_SECRET if crons fail auth."
echo "Done. Redeploy production after Vercel env changes."
