import "server-only";

import { hydratePlatformEnvFromDatabase } from "@/lib/hydrate-platform-env";
import { createServiceClient } from "@/lib/supabase/server";

/** Service role client with NI Brain secrets hydrated from ni_platform_secrets when needed. */
export async function createSector3ServiceClient() {
  await hydratePlatformEnvFromDatabase();
  return createServiceClient();
}
