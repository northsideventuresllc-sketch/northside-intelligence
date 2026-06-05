# ReplyFlow — custom domain SSL fix

## Symptom

- `https://replyflow-murex.vercel.app` — works (HTTP 200, valid TLS).
- `https://replyflow.northsideintelligence.com` — TLS handshake fails (`SSL_ERROR_SYSCALL`, no peer certificate).

The app deployment is healthy; the **custom domain is not serving a certificate** on the Vercel edge.

## Root cause

The subdomain is attached to the **replyflow** Vercel project, but SSL is not bound at the edge (common after legacy `alias`-only `vercel.json` or a failed cert issuance). DNS is correct (`CNAME` → `cname.vercel-dns.com`).

## Fix (5 minutes in Vercel)

1. Open [Vercel → replyflow → Settings → Domains](https://vercel.com/northsideventuresllc-sketchs-projects/replyflow/settings/domains).
2. Remove `replyflow.northsideintelligence.com`.
3. Re-add it (Vercel shows the same `CNAME` to `cname.vercel-dns.com`).
4. Wait until status is **Valid** (not “Generating” for more than ~10 minutes).
5. Verify: `curl -sI https://replyflow.northsideintelligence.com` returns `HTTP/2 200`.

If it stays broken after 30 minutes, use **Refresh** on the domain or contact Vercel support (edge POP cert desync).

## Repo change (replyflow `main`)

Copy `docs/ecosystem/replyflow/vercel.json` from this repo to the **replyflow** repo root as `vercel.json`. Do **not** use the deprecated `"alias"` field — domains belong in the Vercel UI only.

```bash
cd /path/to/replyflow
cp ../northside-intelligence/docs/ecosystem/replyflow/vercel.json .
git add vercel.json
git commit -m "fix: add Next.js vercel.json (remove legacy alias config)"
git push origin main
```

## Environment

After the custom domain works, set in Vercel → replyflow → Environment Variables:

- `NEXT_PUBLIC_APP_URL=https://replyflow.northsideintelligence.com`

Supabase Auth → URL configuration → add redirect URLs:

- `https://replyflow.northsideintelligence.com/**`
- `https://replyflow-murex.vercel.app/**` (keep as fallback)

## Portal link (interim)

Until SSL is fixed, the NI portal uses `https://replyflow-murex.vercel.app` in `sector3-registry.ts`. After the custom domain passes TLS, change `appUrl` back to `https://replyflow.northsideintelligence.com`.
