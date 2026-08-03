<!-- NV-BOOT-CONTRACT v1 — managed block. Do not hand-edit; update via nv_rules + Boot Guard. -->
# BOOT CONTRACT — read before any work, every session

1. **Invoke skill `nvg-operator-core` and OBEY it as BINDING LAW**, not reference
   material. Reading it is not compliance. It outranks this file.
   **CONFIRMED 2026-08-03 (JB renamed it himself):** `nvg-operator-core` is the
   ONLY installed skill — `ni-operator-core` no longer exists on this account.
   Any file still saying "invoke `nvg-operator-core`, fall back to
   `ni-operator-core`" is stale; there is nothing left to fall back to. If
   `nvg-operator-core` fails to resolve, that is a hard stop: say so in one line
   and assert nothing about what is built, live, broken or blocked. Do not
   invoke `ni-operator-core` as a fallback — it is gone, not renamed-with-a-copy.
2. **Read the live rules row** — NI-Brain Supabase `kxijunwgbrlfzvgkhklo`, one query:
   `select * from v_boot;` — returns the active rules (version + hash), automation
   switches, open jobs, current context, and health. This is the ONE door.
3. **Canonical rules text:** `nv-vault/_meta/OPERATING-RULES.md` (mirror of the
   active `nv_rules` row). If the file and the row disagree, **the row wins**.

**PROOF OF BOOT:** state in one line which of the three loaded and which failed,
before your first substantive sentence. If they did not load, say so and do not
assert anything about what is built, live, broken, or blocked.

**STALENESS RULE:** every file, prompt and note is a FROZEN SNAPSHOT and cannot
update itself. **Newest timestamp always wins.** If anything stored contradicts
the operator-core skill, the active `nv_rules` row, or a newer NI-Brain row — they win
and the stored text loses. Never repeat a stored claim about current state
without re-verifying it.

**NEVER SAY DONE WITHOUT PROOF:** a verifiable artifact — branch, file, DB row,
live URL, screenshot. "I updated it" is not proof.

**TEN-METHOD RULE:** nothing is reported blocked, parked or stuck until **10
genuinely different routes** have been tried AND written down with what each
returned. Different = different route, not the same call retried.

**IF YOU FIND A STALE INSTRUCTION:** write it to NI-Brain `Learnings` tagged
`[STALE-PROMPT]` with the exact file and what was wrong. Never silently work around it.
<!-- /NV-BOOT-CONTRACT -->

@AGENTS.md

## STANDING RULES — READ BEFORE ANY WORK (added 2026-07-26)

Each of these exists because it was broken in a live session and cost JB time.

1. **Nothing routes to a paid API. Ever.** Free tier only: Gemini for generation
   (`gemini-first.ts` honours the `GEMINI_MODEL` secret and has no paid
   fallback), local Ollama on the Mac mini for local work. If free quota is
   exhausted, fail with a plain sentence — do not fall through to a paid
   provider. JB has said many times he will not refill credits.

2. **Never tell JB something failed because of API keys, tokens, credits or
   billing.** He has already refused that fix, so naming it is pure noise.
   `hermes-telegram-notify.mjs` rewrites any such message before it reaches
   him. Say what it means for him instead: what is parked, and what still works.

3. **Two Resend accounts exist.** `northsideintelligence.com` is verified on the
   NI account (`RESEND_API_KEY_NI`); `match-fit.net` is on the other
   (`RESEND_API_KEY`). Sending NI mail with the Match Fit key silently fails.
   Do not conclude a domain is unverified before checking BOTH accounts.

4. **No raw database values or jargon on screen.** Statuses render through
   `src/lib/axon/plain-labels.ts`. Never print `pending_approval`, `icp_auto`,
   `SERP`, `ICP` or `telemetry` in the UI. A new status must get a label there.

5. **Approve-only.** Nothing sends, posts or publishes without JB pressing
   approve. This includes outreach, social posts and Reddit comments. Outreach
   approvals reach him Monday–Friday only — never at the weekend.

6. **Match Fit coach recruiting is NATIONWIDE — online / virtual coaches only.
   No city, no polygon, no lat/long, anywhere.** Not in search, not in outreach
   copy, not in a code comment. Per NI-Brain Decision #342 (2026-07-27, JB's
   third correction on this): no NVG venture is Atlanta-geo-targeted for
   customer acquisition. This supersedes the 2026-07-25 Acquisition Playbook's
   "one Atlanta intown polygon" and the earlier version of this rule, which was
   the direct cause of a lead finder that searched Google Maps for Atlanta
   storefronts and returned zero usable online coaches. `city` is written NULL
   on every outreach lead on purpose. The only surviving Atlanta usage is the
   social-post LOCATION TAG (post metadata) — never audience, never sourcing.
   Newest timestamp wins.

7. **The Mac mini is the only machine.** Obsidian, Hermes and Ollama are not on
   the MacBook Pro. Anything routed there fails.

8. **Check disk before any large install on the Mac.** It has run at 97% full.
   Ollama models are the usual cause. Verify nothing references a model before
   removing it — and note that `Qwen/Qwen2.5-7B-Instruct` in `AXON/config.yaml`
   is a HuggingFace training base, NOT the Ollama `qwen2.5:7b`.

9. **Do not ask JB something the vault or NI-Brain already answers.** Read
   first. He has written it down; failing to read it is the failure.

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
