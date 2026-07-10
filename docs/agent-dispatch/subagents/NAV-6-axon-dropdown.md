# Subagent Brief: NAV-6 — AXON Nav Dropdown

**Runner name:** `NI Portal AXON Nav Dropdown - Subagent Runner`  
**Checker name:** `NI Portal AXON Nav Dropdown - Subagent Checker`  
**Branch:** `cursor/axon-nav-dropdown-d298`  
**Depends:** NAV-5 (optional)

## Target UX

Replace flat "AXON" link in portal nav with dropdown:

| Item | Href | State |
|------|------|-------|
| **AXON Home** | `/axon` | Always clickable |
| **AXON Dash** | `/axon-{username}/dashboard` | Enabled if `canEnterAxonPortal()` |

If no AXON dash access:

- **AXON Dash** greyed, italic, `pointer-events-none`
- Hover tooltip: *"AXON not available, visit AXON Home for more details."*

## Code touchpoints

| Area | Path |
|------|------|
| New component | `src/components/landing/AxonNavDropdown.tsx` |
| Wire | `src/components/landing/Nav.tsx` |
| Auth props | Pass `canEnterAxonPortal` from `NavServer` / `get-nav-auth.ts` |

## Acceptance criteria

- [ ] Title Case: "AXON Home", "AXON Dash"
- [ ] Master sees both enabled
- [ ] Toolkit purchaser (future): Home enabled, Dash per `canAccessAxon`
- [ ] Logged-out users: no dropdown (existing behavior)
- [ ] Mobile: dropdown usable

## Stress tests

- Keyboard nav / focus trap
- Long username vanity path resolves correctly
