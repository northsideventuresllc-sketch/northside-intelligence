#!/usr/bin/env bash
# Delete a Supabase Edge Function via the Management API / CLI.
#
# Usage:
#   SUPABASE_ACCESS_TOKEN=sbp_... ./scripts/delete-supabase-edge-function.sh ni-replyflow
#
# Generate a token at https://supabase.com/dashboard/account/tokens
# (requires edge_functions:write).

set -euo pipefail

FUNCTION_NAME="${1:?Function name required (e.g. ni-replyflow)}"
PROJECT_REF="${SUPABASE_PROJECT_REF:-kxijunwgbrlfzvgkhklo}"
TOKEN="${SUPABASE_ACCESS_TOKEN:-}"

if [ -z "$TOKEN" ]; then
  echo "SUPABASE_ACCESS_TOKEN is required." >&2
  exit 1
fi

npx supabase functions delete "$FUNCTION_NAME" --project-ref "$PROJECT_REF"
