# CODE-CHECK — AX-MKT-OUT-DEMERGE

**Date:** 2026-08-03
**Repo:** northside-intelligence
**Scope:** Separate Match Fit and NI marketing/outreach into visibly distinct AXON portal surfaces, per Decision #538 (build order item 1) and JB's original 2026-07-27 directive.
**Verdict:** **PASS** (partial scope — see "Not done" below)

## What shipped

1. **Match Fit now has a real outreach queue** — new route `/tools/mf-outreach` (new file `src/app/axon/u/[username]/tools/mf-outreach/page.tsx`), reusing the same `OutreachHqTool` component, approve/reject/send API routes, and pipeline/queue/follow-up screens as NI Outreach — scoped to `ni_brain_outreach.source = 'match_fit'` instead of the old read-only 20-row stub inside Match Fit Admin (which had zero wired actions).
2. **`fetchLeads`/`fetchPipelineStats`** (`src/lib/axon/leads.ts`) now take an optional `source` param (default = NI's `SOURCE`, so every existing NI caller is unaffected). `fetchLeadById` and the notes-select in `bulkUpdateLeads` dropped their `source=eq.` filter entirely — both are already id-scoped, so this was dead-weight filtering, and dropping it is what lets the shared approve/reject/send/deliverable API routes work for Match Fit leads with zero route-level changes.
3. **`OutreachHqTool`** (`src/components/axon-ui/outreach-hq-tool.tsx`) takes new `venture` / `toolSlug` / `displayNameFallback` props. `venture === 'match_fit'` hides the NI-only prospecting/ICP-checklist/training-signal panels on the Overview tab (Match Fit's own lead generation lives in the `matchfit` repo, not here) — Stats, Goal Progress, Pipeline Breakdown, Queue, Pipeline, and Follow-Up tabs are identical for both ventures.
4. **Sidebar now groups by venture** (`src/components/axon-ui/sidebar.tsx` + `axon-user-tools.ts`): new `venture?: 'match_fit' | 'ni'` field on `AxonUserTool`. Three sidebar sections instead of one flat blended list — **Match Fit** (Match Fit Marketing, Match Fit Outreach), **NI** (NI Marketing, NI Outreach), **AXON Tools** (everything not venture-specific: Repo Manager, AXON Dispatch Mirror, Financial Tracker, Lucielle, Usage Tower, Reddit, Fire/Hold, Test Mode).
5. **Renamed 3 tile labels for clarity** (cosmetic, no href/slug changes — nothing that reads `axon.toolDisplayNames` localStorage or a tool slug breaks): "AXON Management-Match Fit" → "Match Fit Marketing", "NI Outreach HQ" → "NI Outreach", "NI Content Machine" → "NI Marketing". Also renamed "NI Marketing HQ" (href `/tools/hermes`) → "AXON Dispatch Mirror" — that tile is actually the dispatch/task mirror, not a marketing approval screen; the old name was itself part of the smoosh JB flagged.

## Checks
- [x] `npx tsc --noEmit` — exit 0 (repo needed `npm install` first, node_modules was absent; unrelated to this change).
- [x] `npx eslint <changed files>` — exit 0, one pre-existing-pattern warning (`react-hooks/exhaustive-deps` on a mount-only launch-consume effect) resolved with an explicit disable comment, same pattern as the rest of the codebase's mount-only effects.
- [x] `npm run build` — succeeds; `/tools/mf-outreach` present in the route manifest alongside `/tools/ni-outreach`.
- [x] No secrets touched; no DB migration — this is entirely additive UI/query-param routing on top of the existing `source`/`brand_slug` columns.

## Not done (flagged, not silently skipped)
- **Match Fit marketing content approval** — still lives as a read-only 3-tab stub inside "Match Fit Marketing" (`match-fit-admin`), not a full approve/edit screen like NI Marketing (`ni-content`) has. Per JB's own session notes, the real MF content-calendar admin UI may already live in the separate `matchfit` repo — this needs a JB call (deep-link to that repo's admin vs. build real parity here) before touching it, not an assumption. Flagged in Decision #538 follow-up, not built this pass.
- **Cosmetic string references** ("NI Outreach HQ", "NI Marketing HQ", "AXON Management-Match Fit") still appear in a handful of non-functional spots — cron job labels (`axon-cron-jobs.ts`), AI-assistant help text (`axon-tool-meta.ts`), a few UI copy strings (`follow-up-tool.tsx`, `test-mode-*.tsx`, `settings/page.tsx`). None of these gate functionality; left as-is rather than scope-creeping a copy sweep into this ticket.
- **Match Fit Admin's old read-only outreach tab** was left in place (harmless duplicate of the new real `mf-outreach` queue) rather than removed, to avoid touching a working read-only view without a clear steer from JB on whether Match Fit Admin should be trimmed down now that Match Fit Outreach exists as its own tile.

## Risk
Low — additive only, no existing NI route/behavior changed (all new params default to prior behavior), no migration, no secrets. The riskiest change (dropping the `source` filter on id-scoped queries) is a correctness improvement, not a narrowing — ids are already globally unique in `ni_brain_outreach`.
