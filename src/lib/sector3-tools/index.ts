/**
 * Sector 3 tool launch checklist — keep in sync when adding portal-hosted tools.
 *
 * 1. Add `{slug}_profiles` + `{slug}_sessions` migration with RLS
 * 2. Register in `src/lib/sector3-registry.ts` and `SECTOR3_TOOL_CONFIGS`
 * 3. Add pricing in `sector3-tool-pricing.ts` + `ni_tool_pricing` seed
 * 4. Add to `ensureAllSector3ToolProfiles` via configs (automatic)
 * 5. Add middleware dashboard auth guard + matcher paths
 * 6. Do NOT pass functions from Server Components to Client Components
 * 7. Use `createSector3ServiceClient()` for service-role writes (hydrates secrets)
 * 8. Dashboard UI: use `createSector3DashboardPage` + `Sector3ToolDashboard` (centered max-w-3xl, glass panels, chip selectors, help footer)
 * 9. Landing UI: use `createSector3LandingPage` with Title Case headlines; add help FAQs in `help-content.ts`
 * 10. Results UI: add tool-specific panel in `src/components/sector3/results/` and register in `Sector3ToolResult` — no raw markdown in the UI
 * 11. Results view: hide input form when results show; add `Sector3DashboardToolbar` with Edit Prompt + per-tool chat in `chat-content.ts`
 * 12. Presentation: default Simple View for everyone; split AI output with `---TECHNICAL---` in prompts; gate Technical View to paid plans via `canAccessTechnicalView`
 */

import { SECTOR3_TOOL_CONFIGS } from "./configs";
import { ensureAllSector3ToolProfiles, ensureSector3ToolProfile } from "./profile";
import { createSector3ServiceClient } from "./service-client";

export { SECTOR3_TOOL_CONFIGS, ensureAllSector3ToolProfiles, ensureSector3ToolProfile, createSector3ServiceClient };
