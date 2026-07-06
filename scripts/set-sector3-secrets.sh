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

REPO="northsideventuresllc-sketch/northside-intelligence"
PROJECT="northside-intelligence"
TEAM_ID="team_dD8iOW15WOUr27k3QeswFBac"
SUPABASE_PROJECT_URL="https://kxijunwgbrlfzvgkhklo.supabase.co"
EDGE_URL="${SUPABASE_PROJECT_URL}/functions/v1"
CRON_SECRET="${CRON_SECRET:-$(openssl rand -hex 32)}"

# Load from ~/.nv/env if present
if [[ -f "$HOME/.nv/env" ]]; then
  # shellcheck disable=SC1091
  source "$HOME/.nv/env"
fi

# Mac keychain fallback
if [[ -z "${SUPABASE_SERVICE_ROLE_KEY:-}" ]] && command -v security &>/dev/null; then
  SUPABASE_SERVICE_ROLE_KEY="$(security find-generic-password -s ni-brain-service-key -w 2>/dev/null || true)"
fi

fetch_platform_secret() {
  local key="$1"
  curl -sf "${SUPABASE_PROJECT_URL}/rest/v1/ni_platform_secrets?key=eq.${key}&select=value&limit=1" \
    -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
    -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
    | python3 -c "import sys,json; d=json.load(sys.stdin); print(d[0]['value'] if d else '')"
}

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
  if [[ -z "$value" ]]; then
    echo "GitHub: SKIP $name (empty)"
    return
  fi
  if echo "$value" | gh secret set "$name" --repo "$REPO"; then
    echo "GitHub: set $name"
  else
    echo "GitHub: SKIP $name (add manually in repo Settings → Secrets → Actions)"
  fi
}

echo "=== Sector 3 secrets ==="

if [[ -z "${VERCEL_TOKEN:-}" ]] && [[ -n "${SUPABASE_SERVICE_ROLE_KEY:-}" ]]; then
  VERCEL_TOKEN="$(fetch_platform_secret VERCEL_TOKEN || true)"
fi

if [[ -n "${VERCEL_TOKEN:-}" ]]; then
  upsert_vercel_env CRON_SECRET "$CRON_SECRET"
  [[ -n "${SUPABASE_SERVICE_ROLE_KEY:-}" ]] && upsert_vercel_env SUPABASE_SERVICE_ROLE_KEY "$SUPABASE_SERVICE_ROLE_KEY"
  [[ -z "${ANTHROPIC_API_KEY:-}" ]] && ANTHROPIC_API_KEY="$(fetch_platform_secret ANTHROPIC_API_KEY || true)"
  [[ -n "${ANTHROPIC_API_KEY:-}" ]] && upsert_vercel_env ANTHROPIC_API_KEY "$ANTHROPIC_API_KEY"
  [[ -z "${RESEND_API_KEY:-}" ]] && RESEND_API_KEY="$(fetch_platform_secret RESEND_API_KEY || true)"
  [[ -n "${RESEND_API_KEY:-}" ]] && upsert_vercel_env RESEND_API_KEY "$RESEND_API_KEY"
else
  echo "SKIP Vercel (VERCEL_TOKEN not set)"
fi

if command -v gh >/dev/null 2>&1; then
  if [[ -z "${SUPABASE_SERVICE_ROLE_KEY:-}" ]]; then
    echo "❌ Need SUPABASE_SERVICE_ROLE_KEY (export, ~/.nv/env, or Mac keychain ni-brain-service-key)"
    exit 1
  fi
  set_github_secret SUPABASE_URL "$SUPABASE_PROJECT_URL"
  set_github_secret SUPABASE_SERVICE_KEY "$SUPABASE_SERVICE_ROLE_KEY"
  set_github_secret SUPABASE_SERVICE_ROLE_KEY "$SUPABASE_SERVICE_ROLE_KEY"
  set_github_secret SUPABASE_EDGE_FUNCTION_URL "$EDGE_URL"
  [[ -n "${VERCEL_TOKEN:-}" ]] && set_github_secret VERCEL_TOKEN "$VERCEL_TOKEN"
else
  echo "SKIP GitHub (gh not installed)"
fi

echo ""
echo "CRON_SECRET for this run: $CRON_SECRET"
echo "Ensure this matches ni_platform_secrets.CRON_SECRET if crons fail auth."
echo "Done. Redeploy production after Vercel env changes."
