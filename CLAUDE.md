@AGENTS.md

---

## ⛔ STOP — READ THIS BEFORE ANYTHING ELSE

**These five rules exist because they were broken. Breaking them again wastes JB's money and time.**

### 1. GitHub is the source of truth. Always. No exceptions.
Every NVG repo is on GitHub under `northsideventuresllc-sketch`. **Clone from GitHub. Read from GitHub. Push to GitHub.**
- The auth token is in NI-Brain: `select value from ni_platform_secrets where key='GH_PAT'`.
- **Never** go looking for code on a local Mac, a mounted folder, or a device bridge.
- Repos: `matchfit` · `northside-intelligence` · `axon` · `nv-vault`.

### 2. Every app repo is **Next.js**.
`matchfit` is Next.js 16 / React 19 / Prisma / Supabase / Stripe / Resend. If you are guessing at the stack, you have not read the repo. Read the repo.

### 3. **NOTHING runs on the MacBook Pro. Mac mini only.**
Obsidian, Hermes and Ollama are **not installed** on the MacBook Pro. Every local operation — vault, Hermes crons, dispatch execution, local models, Chrome posting — happens on the **Mac mini**.

The Cowork device bridge binds to `macbook-pro-4-local`. **That machine is empty.** Any plan routed through the bridge **will fail**. Do not stage files to it, do not read the vault from it, do not try to run anything on it. Use GitHub for code and NI-Brain for state — see rule 1.

### 4. **GitHub PATs DO NOT EXPIRE.**
The vault token was replaced 2026-07-04 as **non-expiring**. Any note claiming a PAT expires (including `_ni-brain/reference_infrastructure.md`'s "expires 2026-07-16") is **stale and wrong**. **Never raise PAT expiry as a blocker.** JB has corrected this repeatedly.

### 5. Resend: JB has **TWO** accounts.
`RESEND_API_KEY` (Match Fit) and `RESEND_API_KEY_NI` (NORTHSiDE Intelligence) — both in `ni_platform_secrets`. A connector or key that only sees one account tells you **nothing** about the other. **Never report a domain as missing without checking both.**

### 6. How to talk to JB — plain English only.
JB has ADHD and dyslexia and is paying for output, not narration.
- **Lead with what to DO**, not what you scanned.
- **No internal identifiers** in the summary — no table names, no job codes, no lint-rule names. Those go in the doc, not the message.
- **Short sentences. Bold the key word. No walls of text.**
- **Never report a blocker you have not confirmed.** "I couldn't check X" is not a blocker — it's your problem to solve.
- **Work until it's done.** Do not come back with a list of things for JB to do that you could have done yourself.

---



## ⛔ STOP — READ THIS BEFORE ANYTHING ELSE

**These five rules exist because they were broken. Breaking them again wastes JB's money and time.**

### 1. GitHub is the source of truth. Always. No exceptions.
Every NVG repo is on GitHub under `northsideventuresllc-sketch`. **Clone from GitHub. Read from GitHub. Push to GitHub.**
- The auth token is in NI-Brain: `select value from ni_platform_secrets where key='GH_PAT'`.
- **Never** go looking for code on a local Mac, a mounted folder, or a device bridge.
- Repos: `matchfit` · `northside-intelligence` · `axon` · `nv-vault`.

### 2. Every app repo is **Next.js**.
`matchfit` is Next.js 16 / React 19 / Prisma / Supabase / Stripe / Resend. If you are guessing at the stack, you have not read the repo. Read the repo.

### 3. **NOTHING runs on the MacBook Pro. Mac mini only.**
Obsidian, Hermes and Ollama are **not installed** on the MacBook Pro. Every local operation — vault, Hermes crons, dispatch execution, local models, Chrome posting — happens on the **Mac mini**.

The Cowork device bridge binds to `macbook-pro-4-local`. **That machine is empty.** Any plan routed through the bridge **will fail**. Do not stage files to it, do not read the vault from it, do not try to run anything on it. Use GitHub for code and NI-Brain for state — see rule 1.

### 4. **GitHub PATs DO NOT EXPIRE.**
The vault token was replaced 2026-07-04 as **non-expiring**. Any note claiming a PAT expires (including `_ni-brain/reference_infrastructure.md`'s "expires 2026-07-16") is **stale and wrong**. **Never raise PAT expiry as a blocker.** JB has corrected this repeatedly.

### 5. Resend: JB has **TWO** accounts.
`RESEND_API_KEY` (Match Fit) and `RESEND_API_KEY_NI` (NORTHSiDE Intelligence) — both in `ni_platform_secrets`. A connector or key that only sees one account tells you **nothing** about the other. **Never report a domain as missing without checking both.**

### 6. How to talk to JB — plain English only.
JB has ADHD and dyslexia and is paying for output, not narration.
- **Lead with what to DO**, not what you scanned.
- **No internal identifiers** in the summary — no table names, no job codes, no lint-rule names. Those go in the doc, not the message.
- **Short sentences. Bold the key word. No walls of text.**
- **Never report a blocker you have not confirmed.** "I couldn't check X" is not a blocker — it's your problem to solve.
- **Work until it's done.** Do not come back with a list of things for JB to do that you could have done yourself.

---



> `AGENTS.md` above is this repo's Cursor-era protocol (stack, VM setup, agent dispatch,
> deploy workflow, weekly health check). Claude Code has no chat-title trigger and no
> auto-loaded `.mdc`/rules layer — this file is that equivalent, loaded every session.
>
> **No `.cursor/skills/` or `.cursor/rules/` directory exists in this repo** — only two legacy
> flat `.cursorrules` files, folded in below since Claude Code doesn't auto-load those either.
> No `.claude/skills/` existed before this change.

---

## UI CAPITALIZATION (ported from root `.cursorrules`)

Title Case on all button labels, CTAs, nav actions, and short UI chrome (badges, tabs, pill
filters) — e.g. "Get Started", "Sign In / Sign Up / Sign Out", "Create Account", "Open Tool",
"Explore Tools", "Verify & Continue". ALL CAPS acceptable only for intentionally compact
controls. Sentence case for paragraph-style body copy/descriptions/long-form content only —
not for buttons, headings, or bold title text unless explicitly requested otherwise. No arrow
suffixes on button text ("Open Dashboard", not "Open dashboard →").

## SECTOR 3 TOOL NAMING (ported from root `.cursorrules`)

New Sector 3 tool names (via generate-tool edge function or any prompt) must be: max 2 words,
marketable standalone (could exist without "NI" around it), punchy/memorable/benefit-implied,
no generic AI words (SmartX, AIBot, IntelliX, AutoX, etc.), and pass the "would someone search
for this?" test. Good: ReplyFlow, GrantBot, Outreach HQ, PitchDeck, InvoiceAce, LeadSnap,
CloseKit, ToneCheck. Bad: AIReply, SmartOutreach, IntelliContent, AutoAds, NI Outreach Tool.

---

## SECTOR 3 SUB-REPO RULES DIFFER — READ BEFORE MERGING THERE

The root `AGENTS.md` above grants **standing approval to merge PRs and deploy `main` without
asking each time**. That does **not** carry down into every `sector3/*` tool automatically —
at least two sub-trees say the opposite:

- `sector3/replyflow/.cursorrules`: **"Wait for JB approval before merging to `main`."** Also:
  snippets only, no drive-by refactors, never hardcode secrets, no `console.log`/`console.error`
  in app code, `replyflow_` Supabase table prefix, verify Stripe webhook signatures with
  `STRIPE_WEBHOOK_SECRET`, favicon must use the tool's own icon not the NI portal emblem.
- `sector3/axon/AGENTS.md`: mirrors the standalone AXON repo's protocol — NI-Brain
  `ni_brain_outreach` table, **no secrets in git**, **no auto-send** (Telegram approve
  required), `NORTHSiDE`/JB brand rules.

**Rule for Claude Code sessions here:** default to the root's standing merge/deploy approval
for the portal shell itself, but treat any change under `sector3/replyflow/` or `sector3/axon/`
as needing JB's go-ahead before merging to `main`, per those sub-trees' own stricter rules —
they override the root default where they exist.

---

## ⚠️ SECURITY: live secret committed in `vercel.json`

`vercel.json`'s `env` block has `NI_AUTH_GATEWAY_SECRET` in **plaintext**, and this repo is a
**public** GitHub repo — that secret is currently exposed on the open internet. Unlike
`NEXT_PUBLIC_SUPABASE_ANON_KEY` in the same block (safe by design, RLS-enforced), this one has
no `NEXT_PUBLIC_` prefix, meaning it's meant to be server-side-only. Do not silently rotate or
remove this value — other apps (matchfit, AXON, etc.) may validate requests against it, so
changing it without coordinating breaks cross-app auth. **Flag to JB immediately if this is
still true** rather than treating it as routine parity work; a Claude Code session should not
merge further changes to `vercel.json` here without confirming the secret has been rotated and
moved out of the tracked file (Vercel dashboard/CLI env instead).
