import "server-only";

import { hydratePlatformEnvFromDatabase } from "@/lib/hydrate-platform-env";

let storeEnvPromise: Promise<void> | null = null;

/** Hydrate store-related secrets (CJ, Make, Stripe store webhook) before API work. */
export async function ensureStoreEnv(): Promise<void> {
  if (storeEnvPromise) return storeEnvPromise;
  storeEnvPromise = hydratePlatformEnvFromDatabase();
  return storeEnvPromise;
}
