# Subagent Brief: AXON-4 — IT Notification Test Panel

**Runner name:** `NI Portal IT Notification Tests - Subagent Runner`  
**Checker name:** `NI Portal IT Notification Tests - Subagent Checker`  
**Branch:** `cursor/axon-it-notification-tests-d298`  
**Depends:** ARM3-1 notification types (can stub types first)

## Problem

`AxonTestNotificationButtons` only fires generic Pipeline/Outreach alerts. Home widget `test_buttons` returns `null`.

## Target

AXON Settings (master only) — **Test IT Notifications** panel with one button per type:

| Type | Simulates |
|------|-----------|
| IT Launch | Executive summary + APPROVE/CHANGE/DENY |
| IT 90-Day Report | KEEP/TRIAL/REMOVE |
| Archive Revival | Monthly scan recommendation |
| Outreach Draft | Existing outreach flow |

## Code touchpoints

| Area | Path |
|------|------|
| Extend | `src/components/axon-ui/axon-test-notification-buttons.tsx` |
| Enable home widget | `src/components/axon-ui/axon-interface.tsx` case `test_buttons` |
| Fixtures | `src/lib/axon/it-notification-fixtures.ts` |
| API | `POST /api/axon/notifications/test` (master-only, inserts fixture notification) |

## Acceptance criteria

- [ ] Each button renders correct card UI in notifications panel
- [ ] Test notifications marked `is_test: true` — excluded from metrics
- [ ] Non-master → 403
- [ ] Title Case button labels per `.cursorrules`

## Stress tests

- Rapid-fire 5 tests → inbox order stable
- Refresh page → test notifications persist in prefs JSON
