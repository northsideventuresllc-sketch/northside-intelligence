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

cp "$NI_ROOT/docs/ecosystem/replyflow/vercel.json" ./vercel.json
cp "$SRC/TEMPLATE.md" "$SRC/.cursorrules" .
cp -r "$SRC/prompts" .
cp "$SRC/tailwind.config.js" .

mkdir -p src/lib/supabase src/lib src/components src/app/api/webhooks/stripe src/app/api/generate
mkdir -p src/app/dashboard src/app/login src/app/signup

cp "$SRC/src/lib/tier.ts" "$SRC/src/lib/stripe.ts" "$SRC/src/lib/ni-auth.ts" src/lib/
cp "$SRC/src/lib/supabase/"*.ts src/lib/supabase/
cp "$SRC/src/middleware.ts" src/
cp "$SRC/src/app/globals.css" src/app/
cp "$SRC/src/app/layout.tsx" src/app/
cp "$SRC/src/app/page.tsx" src/app/
cp "$SRC/src/components/"*.tsx src/components/
cp "$SRC/src/app/api/webhooks/stripe/route.ts" src/app/api/webhooks/stripe/
cp "$SRC/src/app/api/generate/route.ts" src/app/api/generate/
cp "$SRC/src/app/dashboard/"* src/app/dashboard/
cp "$SRC/src/app/login/page.tsx" src/app/login/
cp "$SRC/src/app/signup/page.tsx" src/app/signup/

echo "Done. Review, commit, and push to replyflow."
