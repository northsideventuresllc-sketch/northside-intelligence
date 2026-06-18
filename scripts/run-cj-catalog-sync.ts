/**
 * Manual CJ catalog bulk ingest (same logic as /api/cron/store-catalog-sync).
 * Run: set -a && source .env.vercel && set +a && npx tsx scripts/run-cj-catalog-sync.ts [runs]
 */
import { refreshCjCatalogListings } from "../src/lib/store/catalog/refresh-cj";
import { syncCjCatalogBatch } from "../src/lib/store/catalog/sync-cj-catalog";
import { ensureStoreEnv } from "../src/lib/store/env";

async function main() {
  const runs = Math.max(1, Number(process.argv[2] ?? 1) || 1);
  await ensureStoreEnv();

  if (!process.env.CJ_DROPSHIPPING_API_KEY?.trim()) {
    console.error("Missing CJ_DROPSHIPPING_API_KEY (env or ni_platform_secrets).");
    process.exit(1);
  }

  for (let i = 1; i <= runs; i++) {
    console.log(`--- sync run ${i}/${runs}`);
    const sync = await syncCjCatalogBatch();
    console.log(JSON.stringify(sync, null, 2));
    const enriched = await refreshCjCatalogListings(40);
    console.log("enriched", enriched);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
