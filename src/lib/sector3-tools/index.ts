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
 */

import { SECTOR3_TOOL_CONFIGS } from "./configs";
import { ensureAllSector3ToolProfiles, ensureSector3ToolProfile } from "./profile";
import { createSector3ServiceClient } from "./service-client";

export { SECTOR3_TOOL_CONFIGS, ensureAllSector3ToolProfiles, ensureSector3ToolProfile, createSector3ServiceClient };
