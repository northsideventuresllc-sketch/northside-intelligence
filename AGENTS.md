# northside-intelligence

Next.js 14 portal for Northside Intelligence — public landing, auth, ReplyFlow, and internal ops.

## Cursor Cloud specific instructions

### Repository state

- **Stack:** Next.js 14 App Router, TypeScript, Tailwind, Supabase (NI-Brain), Vercel
- **Production:** https://www.northsideintelligence.com
- **Vercel project:** `northside-intelligence` (`prj_knNPxlOdg3gen5fasNHWfYB6Aa40`)

### VM update script

```bash
cd /workspace && npm ci
```

### Lint / test / build / dev

| Operation | Command |
|-----------|---------|
| Install | `npm ci` |
| Lint | `npm run lint` |
| Build | `npm run build` |
| Dev server | `npm run dev` (port 3000) |

### Agent dispatch (ARM3 IT Lifecycle v2)

Repo managers dispatch work via `docs/agent-dispatch/queue.md`. Say `dispatch {ID}` in manager chat (e.g. `dispatch ARM3-1`). Runner → Checker loop required before merge.

### Deploy workflow (standing user approval)

**The user has given standing approval to merge PRs and deploy without asking each time.**

After any code change:

1. Work on branch `cursor/<descriptive-name>-6a22`
2. Run `npm run build` before merge
3. Commit, push, open PR to `main`
4. **Merge the PR to `main` immediately** (no need to wait for user deploy confirmation)
5. Vercel Git integration **auto-deploys production** on every push/merge to `main`
6. Verify deployment reached `READY` and matches latest `main` commit SHA

Do not use manual `vercel deploy` unless Git integration fails. Production aliases: `northsideintelligence.com`, `www.northsideintelligence.com`.

### Sanity check

```bash
cd /workspace
git checkout main && git pull origin main
npm run build
git log -1 --oneline
```

Expected: clean working tree on `main`, build passes.

### Weekly task: `infra-health-check` (every Monday)

Automated via `.github/workflows/infra-health-check.yml` (Mon 9am ET). Manual run:

```bash
npm run infra:health-check
```

Verifies:

| Check | What |
|-------|------|
| GitHub Actions secrets | `GH_PAT`, `SUPABASE_SERVICE_KEY` (or `SUPABASE_SERVICE_ROLE_KEY`), `VERCEL_TOKEN`, `ANTHROPIC_API_KEY` |
| ARM3 pipeline data | `arm3_weekly_logs` and `arm3_opportunities` each have rows in the last 7 days |
| Stripe webhook ping | GET `https://www.northsideintelligence.com/api/store/webhook` and GET `https://match-fit.net/api/webhooks/stripe` return **200** |
| Vercel env audit | `npm run audit:vercel-env` — required keys on Vercel dashboard, `vercel.json`, or `ni_platform_secrets` |

**On failure:** `docs/session-log.md` gets a **🚨 URGENT** block at the top (auto-committed by the workflow). Cloud agents must read that file at session start and act on URGENT items first — do not bury them in Carry-over.

## Standing conventions (added 2026-08-11, JB-approved)

- **KNOWN GAP — no test framework configured.** `package.json` has no `test` script and no Vitest/Jest/etc. installed. Do not assume test coverage exists for this repo, and do not write instructions elsewhere assuming a standard `npm test` works here until this is addressed. (Backlog item, not urgent — just don't build false assumptions on top of it.)
- **Merging to main always requires JB's explicit sign-off.** Never auto-merge a PR, even if build/lint pass. This matches the Hard Stop already locked in `nvg-operator-core`.


## Slack posting rule (added 2026-08-19, JB direct order)

Every agent posts status/updates to Slack through ONE method only — never your own personal/native Slack connection:

```
POST https://kxijunwgbrlfzvgkhklo.supabase.co/functions/v1/slack-post
Header: Authorization: Bearer sb_publishable_-JPXXSn9eyX9BxdvIzTulw_QkHPIERR
Content-Type: application/json
Body: {"channel":"C0BR6ATGHGR","text":"<your message>"}
```

C0BR6ATGHGR is the only #agent-ops channel JB watches. Do not post to any other channel ID, and do not use a native/per-session Slack app connection for agent status posts.

