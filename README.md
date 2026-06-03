# Northside Intelligence Portal

Single Next.js app serving:

- **Public landing** — [northsideintelligence.com](https://northsideintelligence.com) (`/`)
- **Internal ops dashboard** — `/ops` (password-protected, JB-only)

## Stack

- Next.js 14 (App Router, TypeScript, Tailwind CSS)
- Supabase client (NI-Brain: `kxijunwgbrlfzvgkhklo`)
- Vercel deployment

## Setup

```bash
npm install
cp .env.example .env.local
```

Generate an admin secret:

```bash
openssl rand -hex 20
```

Add your Supabase anon key, service role key, and `NI_ADMIN_SECRET` to `.env.local`.

```bash
npm run dev
```

- Landing: http://localhost:3000
- Ops login: http://localhost:3000/ops/login
- Ops dashboard: http://localhost:3000/ops (after login)

## Environment variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only service role |
| `NI_ADMIN_SECRET` | Ops password; must match cookie value |
| `NEXT_PUBLIC_APP_URL` | Canonical app URL |

## Ops auth

Middleware checks the `ni_ops_token` httpOnly cookie against `NI_ADMIN_SECRET`. Login posts to `/api/ops/auth`.

## Revenue tracker

Ops revenue fields persist in **localStorage** until database sync is added.

## Sector 3 tools (NI ecosystem)

Canonical wiring lives in `src/lib/sector3-registry.ts` and mirrors `arm3_tools` slugs in NI-Brain.

| Tool | Subdomain | Repo | Supabase table |
|------|-----------|------|----------------|
| ReplyFlow | replyflow.northsideintelligence.com | [replyflow](https://github.com/northsideventuresllc-sketch/replyflow) | `replyflow_profiles` |
| GrantBot | grantbot.northsideintelligence.com | [grantbot](https://github.com/northsideventuresllc-sketch/grantbot) | `grantbot_profiles` |

## Brand

- Background: `#07080C`
- Accent: electric cyan (`#00D4FF`)
- Tagline: *We find the gaps and make it better.*

Replace `/public/logo.png` with the official NI logo when ready.
