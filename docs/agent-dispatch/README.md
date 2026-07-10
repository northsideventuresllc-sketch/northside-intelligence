# NI Portal — Agent Dispatch System

Repo managers (NI Portal Manager, AXON Manager) use this folder to queue, dispatch, and verify Cloud Agent work.

## Dispatch syntax

| Command | Action |
|---------|--------|
| `dispatch` | Run next **pending** queue item for this repo |
| `dispatch {ID}` | Run a specific initiative (e.g. `dispatch ARM3-1`) |
| `dispatch {ID} verify` | Checker pass only — no new code |
| `dispatch all` | JB-only — runs pending items in dependency order |

**AXON UI:** Master operators can also fire from **Dispatch Queue** (`/axon/u/{username}/tools/dispatch`) — reads `agent_dispatch` in NI-Brain and triggers Hermes via `src/lib/axon/agent-dispatch.ts`.

**Docs queue mirror:** `queue.md` in this folder tracks the same IDs for repo managers without database access.

## Roles

| Role | Responsibility |
|------|----------------|
| **Repo Manager** | Reads queue, dispatches runners, one-line report to JB |
| **Subagent Runner** | Implements one initiative brief end-to-end |
| **Subagent Checker** | Stress test + code review vs brief; blocks merge on fail |
| **Human (JB)** | `dispatch` in manager chat, APPROVE/CHANGE/DENY on IT notifications |

## Runner → Checker loop (required)

1. Manager updates `queue.md` → `in_progress`
2. Cloud Agent: `NI Portal {Initiative} - Subagent Runner` (or `AXON {Initiative}`)
3. Runner: branch `cursor/{slug}-d298`, build, commit, PR
4. Cloud Agent: `NI Portal {Initiative} - Subagent Checker` (`code-reviewer` or second model)
5. Checker: acceptance criteria + `npm run build` + smoke paths in brief
6. Manager merges if pass, updates queue → `shipped`, session-log one-liner

## Repo split

| Initiative prefix | Primary repo | Sync |
|-----------------|--------------|------|
| `ARM3-*`, `IT-*`, `NAV-*` | `northside-intelligence` | Edge fns → Supabase; AXON UI via `sync-ni-portal.yml` |
| `AXON-*` (portal UX only) | `AXON` → sync to NI | Coordinate both managers |

## Secrets / JB lane

- GitHub PAT, billing, legal, production promote → **JB lane only**
- Patches on nv-vault: `_AI/ni-portal-patches/` + `push-ni-*.yml`

## Stress test minimum (every ship)

- `npm run build`
- Auth gates return 401/403 without session (not 404)
- Master-only routes reject non-master
- No secrets in repo or session log
