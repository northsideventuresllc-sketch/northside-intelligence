#!/usr/bin/env bash
# Push SERPAPI_API_KEY to Vercel production, preview, and development.
#
# Usage:
#   VERCEL_TOKEN=... SERPAPI_API_KEY=... ./scripts/set-serpapi-env.sh
# Optional: set on Match Fit projects too (default: all three)
#   VERCEL_PROJECTS="northside-intelligence matchfit match-fit-app"

set -euo pipefail

: "${VERCEL_TOKEN:?Set VERCEL_TOKEN (https://vercel.com/account/tokens)}"
: "${SERPAPI_API_KEY:?Set SERPAPI_API_KEY}"

PROJECTS=(${VERCEL_PROJECTS:-northside-intelligence matchfit match-fit-app})
TEAM_ID="team_dD8iOW15WOUr27k3QeswFBac"

for PROJECT in "${PROJECTS[@]}"; do
  UPSERT_API="https://api.vercel.com/v10/projects/${PROJECT}/env?teamId=${TEAM_ID}&upsert=true"
  curl -sf -X POST "$UPSERT_API" \
    -H "Authorization: Bearer ${VERCEL_TOKEN}" \
    -H "Content-Type: application/json" \
    -d "$(jq -n \
      --arg key "SERPAPI_API_KEY" \
      --arg value "$SERPAPI_API_KEY" \
      '[{key: $key, value: $value, type: "encrypted", target: ["production","preview","development"]}]')" \
    > /dev/null
  echo "Set SERPAPI_API_KEY on $PROJECT (production + preview + development)"
done

echo "Redeploy affected projects to pick up new env vars immediately."
