# AXON — NI Portal integration env

Set on Vercel project `northside-intelligence` (Production + Preview).

## Portal gate (required)

| Variable | Purpose |
|----------|---------|
| `AXON_MASTER_ACCESS_CODE` | Master account entry code (server-only) |
| `AXON_SESSION_SECRET` | Signs AXON unlock session cookies |
| `RESEND_API_KEY` | Sends purchase access-code emails |
| `AXON_FROM_EMAIL` | Default: `Northside Intelligence <noreply@northsideintelligence.com>` |

## AXON runtime (from AXON repo — use existing NI-Brain keys where present)

| Variable | Purpose |
|----------|---------|
| `SUPABASE_SERVICE_KEY` or `SUPABASE_SERVICE_ROLE_KEY` | NI-Brain service role for AXON tables |
| `ANTHROPIC_API_KEY` | Chat + drafts |
| `GEMINI_API_KEY` | Prospect scan |
| `SERPAPI_API_KEY` | Lead discovery |
| `TELEGRAM_BOT_TOKEN` | Optional Telegram surface |
| `TELEGRAM_CHAT_ID` | Optional Telegram surface |
| `RESEND_FROM_EMAIL` | Outreach email sends |

## URLs

- Public entry: `https://northsideintelligence.com/axon-{username}`
- Example: `https://northsideintelligence.com/axon-jonnybooth22`

Username comes from `ni_portal_profiles.username`.

## Database

Migration: `supabase/migrations/20260703120000_axon_access.sql` (applied to NI-Brain).

AXON app tables (`axon_operator_profiles`, `axon_chat_messages`, etc.) live in NI-Brain — see AXON repo.
