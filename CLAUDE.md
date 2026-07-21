@AGENTS.md

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
