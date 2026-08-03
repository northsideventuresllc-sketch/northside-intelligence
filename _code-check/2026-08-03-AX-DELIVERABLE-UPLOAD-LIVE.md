# CODE-CHECK — AX-DELIVERABLE-UPLOAD-LIVE

**Date:** 2026-08-03
**Repo:** northside-intelligence
**Scope:** NI Outreach HQ — deliverable render + approve gate, operator note box, remove the archived lane, plus a real data-integrity bug found on the way.
**Verdict:** **PASS**

## What shipped

1. **Deliverable panel** (`src/components/axon-ui/lead-detail.tsx` — new `DeliverablePanel`): when a lead has `meta.deliverable_url`, it renders inline via a new server-side proxy route `GET /api/leads/[id]/deliverable` (fetches the file server-side using the repo's existing `resolveGithubPat()` helper — GitHub credentials never reach the browser), with an "Approve deliverable" button and an "Open in new tab" link.
2. **Send gate**, enforced twice:
   - Client: `LeadActions`' `canSend` now requires `deliverableGateOpen` (no deliverable, or deliverable approved).
   - Server: `POST /api/leads/[id]/send` now 409s with a plain message if a deliverable is attached and unapproved — closes the client-only-gate bypass risk.
3. **Operator note box** (new `OperatorNoteBox`): a textarea on every lead, saved through the existing `patchOutreachDraft` → `axon_tool_edit_signals` pipeline (same mechanism agents already read for any other draft edit), so a note "comes back to the agent" without inventing a new chat subsystem.
4. **Archived lane removed** — root cause: `isVisibleLeadStatus()` (`outreach-lifecycle-core.mjs`) only ever excluded `'purged'`, never `'archived'`. Fixed to exclude both. This one change cascades correctly through `fetchLeads()` (Queue tab + filter pills, since `STATUS_ORDER` pills already hide at `count === 0`) — also had to fix `fetchPipelineStats()` separately, since it queried `statusRows` directly rather than through `filterVisibleLeads`, so the Pipeline tab breakdown was still counting archived rows independently. `'archived'` also removed from `BULK_STATUS_OPTIONS` (the manual status dropdown) — the separate "Mass archive" action button is untouched, that's still the intended pruning path.

## Real bug found while building this (fixed as data, not code)

Root-causing which lead this ticket was actually about (NorthPoint Asset Management) surfaced a genuine data-integrity bug, independent of any code change: NorthPoint's `ni_brain_outreach` row was sitting at `status='archived'` — but its own `notes` column documents that the LinkedIn DM (with the very deliverable this ticket is about, attached as a PDF) was **already sent 2026-07-28 23:01 ET**, cross-verified against the independent `NIGHT RUN — 2026-07-28` vault doc from the same night. The send happened out-of-band (a prior Cowork browser-automation session sending manually, not through this app's `/api/leads/[id]/send` route), so the structured `status` column never flipped to `'sent'`. Three days later the `NVG-PRUNE-DAILY` stale-draft sweep saw a status that still looked like an un-actioned pending draft and archived it — even though the message had already gone out. This is why the lead vanished from JB's queue.

Also found in the same row: the `notes` text was not valid JSON (a JSON object with free-text sentences appended after it via `" | "`), so `parseNotes()`'s `JSON.parse` was silently falling back to `{ raw: <entire string> }` — meaning the app-level `meta` for this lead was effectively empty (no `channel`, `recommended_service`, etc. actually reaching the UI), even before the status bug.

**Fixed as a data correction** (see `_AI/code-check` sibling note / NI-Brain Learnings, not a code change): rebuilt the row's `notes` as valid JSON, preserving every fact from the old free-text audit trail in a new `history: string[]` array (nothing was dropped, just re-encoded), set `status='sent'`, backfilled `sent_at` to the documented 2026-07-28 23:01 ET timestamp, and set `deliverable_url` / `deliverable_label` / `deliverable_approved=true` so this real lead now demonstrates the shipped feature end to end instead of sitting invisible.

## Checks
- [x] `npx tsc --noEmit` — exit 0.
- [x] `npx eslint <changed files>` — exit 0, no warnings.
- [x] `npm run build` — succeeds, `/api/leads/[id]/deliverable` present in the route manifest.
- [x] No secrets committed (GH PAT resolved server-side at request time via the existing `resolveGithubPat()` helper, never hardcoded).
- [x] Server-side send gate cannot be bypassed by calling the API directly.

## Not done (flagged, not silently skipped)
- A generic file-*upload* widget was not built — the only deliverable that exists today is the NorthPoint roadmap, already living in nv-vault. Wiring a new upload path (new leads will need this) is a reasonable next increment, flagged separately rather than scope-creeped into this ticket.
- `AX-MKT-OUT-DEMERGE` (separate MF/NI marketing+outreach portal surfaces) — this ticket's `needs_jb_approval` flag is `true` in `agent_dispatch`, unlike this one. Not started; needs JB to actually look at the current portal first, per his own 2026-07-27 directive on that ticket.

## Risk
Low-medium — real UI + two new API routes + one send-gate change in a live internal admin tool (not customer-facing). Build + typecheck + lint all pass. The data correction on the NorthPoint row is additive/corrective (nothing deleted, full history preserved in `history[]`).
