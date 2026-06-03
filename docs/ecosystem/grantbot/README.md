# GrantBot

AI grant finder and drafter for nonprofits and creators. Sector 3 tool under [Northside Intelligence](https://northsideintelligence.com).

## NI ecosystem

| Resource | Value |
|----------|--------|
| Portal | https://northsideintelligence.com |
| Subdomain | https://grantbot.northsideintelligence.com |
| NI-Brain (Supabase) | `kxijunwgbrlfzvgkhklo` |
| Profiles table | `grantbot_profiles` (prefixed; RLS enabled) |
| Sibling tool | [ReplyFlow](https://github.com/northsideventuresllc-sketch/replyflow) |

## Stack (planned)

- Next.js App Router
- Supabase Auth + `grantbot_profiles` on NI-Brain
- Stripe (`free` \| `lite` \| `pro` tiers)
- Vercel deploy to `grantbot.northsideintelligence.com`

## Environment

Copy `.env.local.example` to `.env.local` and fill from the NI-Brain Supabase dashboard and Stripe.

## Status

Repository scaffold connected to NI-Brain. Application code ships in a follow-up PR.
