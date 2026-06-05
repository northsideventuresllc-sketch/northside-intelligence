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
