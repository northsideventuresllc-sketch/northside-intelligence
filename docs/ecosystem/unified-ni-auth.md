# Unified NI account (Sector 3 tools)

All Sector 3 tools share **one Northside Intelligence account** on NI-Brain Supabase (`kxijunwgbrlfzvgkhklo`).

## Flow

1. User visits a tool (e.g. ReplyFlow `/dashboard`) without a session.
2. Tool redirects to `https://northsideintelligence.com/auth/signin?returnTo=<tool-url>`.
3. User signs up or signs in on the portal (email + OTP 2FA).
4. After verification, portal redirects back to `returnTo`.
5. Shared Supabase session cookie (domain `.northsideintelligence.com`) authenticates the tool.

## Tool implementation

- Copy `sector3/replyflow/src/lib/ni-auth.ts` and `middleware.ts` pattern.
- Replace local `/login` and `/signup` with redirects to the portal.
- Set `NEXT_PUBLIC_PORTAL_URL=https://northsideintelligence.com`.
- Set `NEXT_PUBLIC_AUTH_COOKIE_DOMAIN=.northsideintelligence.com` in production (both portal and tools).

## Supabase Auth settings

Add redirect URLs for every tool origin:

- `https://northsideintelligence.com/**`
- `https://replyflow.northsideintelligence.com/**`
- `https://replyflow-murex.vercel.app/**` (until custom domain SSL is stable)

## Profile tables

Portal signup creates `ni_portal_profiles`. Tool profiles (`replyflow_profiles`, `grantbot_profiles`, …) are provisioned via DB triggers and portal verify upsert.
