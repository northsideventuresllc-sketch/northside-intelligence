import { getSector3ToolAccess } from "./access";
import { ensureSector3ToolProfile } from "./profile";
import { createServiceClient } from "@/lib/supabase/server";
import type { Sector3ToolRuntimeConfig } from "./types";
import type { Sector3ToolAccess } from "./access";

interface UsageOk {
  ok: true;
  access: Sector3ToolAccess;
  usageCount: number;
  svc: ReturnType<typeof createServiceClient>;
}

interface UsageFail {
  ok: false;
  status: number;
  error: string;
  access?: Sector3ToolAccess;
  usageCount?: number;
}

export async function checkSector3Usage(
  userId: string,
  email: string | undefined,
  config: Sector3ToolRuntimeConfig
): Promise<UsageOk | UsageFail> {
  const access = await getSector3ToolAccess(userId, config);
  const svc = createServiceClient();
  await ensureSector3ToolProfile(svc, config, userId, email);

  const { data: profile, error } = await svc
    .from(config.profileTable)
    .select("*")
    .eq("id", userId)
    .single();

  if (error || !profile) {
    return { ok: false, status: 500, error: `Could not load ${config.displayName} profile` };
  }

  const row = profile as unknown as Record<string, string | number>;
  const resetAt = new Date(String(row[config.resetColumn]));
  const now = new Date();
  const monthsSince =
    (now.getFullYear() - resetAt.getFullYear()) * 12 +
    (now.getMonth() - resetAt.getMonth());

  let usageCount = Number(row[config.usageColumn] ?? 0);
  if (monthsSince >= 1) {
    usageCount = 0;
    await svc
      .from(config.profileTable)
      .update({
        [config.usageColumn]: 0,
        [config.resetColumn]: now.toISOString(),
      })
      .eq("id", userId);
  }

  if (!access.hasUnlimitedAccess && usageCount >= access.usageLimit) {
    return {
      ok: false,
      status: 429,
      error: `${config.displayName} limit reached (${access.usageLimit}/mo on ${access.planLabel} plan).`,
      access,
      usageCount,
    };
  }

  return { ok: true, access, usageCount, svc };
}

export async function incrementSector3Usage(
  svc: ReturnType<typeof createServiceClient>,
  userId: string,
  config: Sector3ToolRuntimeConfig,
  currentCount: number
): Promise<void> {
  await svc
    .from(config.profileTable)
    .update({
      [config.usageColumn]: currentCount + 1,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);
}
