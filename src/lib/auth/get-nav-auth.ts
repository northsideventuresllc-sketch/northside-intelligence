import { isMasterAccountFlag } from "@/lib/billing/master-account";
import { canEnterAxonPortal } from "@/lib/axon/access";
import { getUnreadNotificationCount } from "@/lib/notifications/service";
import { createServerAuthClient } from "@/lib/supabase/server-auth";

export interface NavAuthState {
  isLoggedIn: boolean;
  isMasterAccount: boolean;
  canEnterAxonDash: boolean;
  unreadNotificationCount: number;
  portalUsername: string | null;
}

export async function getNavAuth(): Promise<NavAuthState> {
  const supabase = await createServerAuthClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      isLoggedIn: false,
      isMasterAccount: false,
      canEnterAxonDash: false,
      unreadNotificationCount: 0,
      portalUsername: null,
    };
  }

  const [{ data: profile }, unreadNotificationCount, canEnterAxonDash] = await Promise.all([
    supabase
      .from("ni_portal_profiles")
      .select("is_master_account, username")
      .eq("id", user.id)
      .maybeSingle(),
    getUnreadNotificationCount(user.id).catch(() => 0),
    canEnterAxonPortal(user.id).catch(() => false),
  ]);

  return {
    isLoggedIn: true,
    isMasterAccount: isMasterAccountFlag(profile?.is_master_account),
    canEnterAxonDash,
    unreadNotificationCount,
    portalUsername: profile?.username?.trim().toLowerCase() ?? null,
  };
}
