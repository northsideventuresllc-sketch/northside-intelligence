import "server-only";

import { createServiceClient } from "@/lib/supabase/server";
import { isMasterAccountFlag } from "@/lib/billing/master-account";

/** Portal username for the first master account (JB operator). */
export async function resolveMasterOperatorId(): Promise<string | null> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("ni_portal_profiles")
    .select("username, is_master_account")
    .eq("is_master_account", true)
    .not("username", "is", null)
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data?.username || !isMasterAccountFlag(data.is_master_account)) return null;
  return data.username.trim().toLowerCase();
}
