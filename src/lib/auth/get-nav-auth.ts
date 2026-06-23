import { isMasterAccountFlag } from "@/lib/billing/master-account";
import { createServerAuthClient } from "@/lib/supabase/server-auth";

export interface NavAuthState {
  isLoggedIn: boolean;
  isMasterAccount: boolean;
}

export async function getNavAuth(): Promise<NavAuthState> {
  const supabase = await createServerAuthClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { isLoggedIn: false, isMasterAccount: false };
  }

  const { data: profile } = await supabase
    .from("ni_portal_profiles")
    .select("is_master_account")
    .eq("id", user.id)
    .maybeSingle();

  return {
    isLoggedIn: true,
    isMasterAccount: isMasterAccountFlag(profile?.is_master_account),
  };
}
