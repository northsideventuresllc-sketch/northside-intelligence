#!/usr/bin/env bash
# Run from a local clone of northsideventuresllc-sketch/replyflow (on main).
# Copies merged sync files from a sibling northside-intelligence checkout.
set -euo pipefail
NI_ROOT="${1:-../northside-intelligence}"
SRC="$NI_ROOT/sector3/replyflow"
if [[ ! -d "$SRC/src" ]]; then
  echo "Usage: $0 /path/to/northside-intelligence" >&2
  exit 1
fi
# Use canonical vercel.json from docs (not legacy alias-only config)
cp "$NI_ROOT/docs/ecosystem/replyflow/vercel.json" ./vercel.json
cp "$SRC/TEMPLATE.md" "$SRC/.cursorrules" .
cp -r "$SRC/prompts" .
mkdir -p src/lib src/app/api/webhooks/stripe src/app/api/generate src/app/dashboard
cp "$SRC/src/lib/tier.ts" "$SRC/src/lib/stripe.ts" src/lib/
cp "$SRC/src/app/api/webhooks/stripe/route.ts" src/app/api/webhooks/stripe/
cp "$SRC/src/app/api/generate/route.ts" src/app/api/generate/
cp "$SRC/src/app/dashboard/page.tsx" src/app/dashboard/
echo "Done. Review, commit, and push to replyflow."
