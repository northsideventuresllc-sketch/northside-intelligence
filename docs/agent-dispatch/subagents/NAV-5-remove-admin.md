# Subagent Brief: NAV-5 — Remove Admin Dashboard

**Runner name:** `NI Portal Remove Admin Dashboard - Subagent Runner`  
**Checker name:** `NI Portal Remove Admin Dashboard - Subagent Checker`  
**Branch:** `cursor/remove-admin-dashboard-d298`

## Scope

AXON replaces `/admin` for all master accounts.

## Delete / redirect

| Path | Action |
|------|--------|
| `src/app/admin/page.tsx` | Remove or redirect → `axonPublicPath(username, '/dashboard')` |
| `src/components/landing/Nav.tsx` | Remove Admin Dashboard link |
| `src/middleware.ts` | Remove `/admin` from `PORTAL_PATH_PREFIXES` or redirect |

## Acceptance criteria

- [ ] `/admin` → 301/302 to AXON dashboard for master; 404 or `/` for others
- [ ] No "Admin Dashboard" in nav
- [ ] `npm run build` passes
- [ ] No broken links in codebase (`rg '/admin'`)

## Stress tests

- Logged-out `/admin` → safe redirect
- Non-master `/admin` → denied
- Master `/admin` → AXON dash
