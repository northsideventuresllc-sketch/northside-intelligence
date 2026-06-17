import { redirect } from "next/navigation";
import { resolveSector3DashboardFromPath } from "@/lib/sector3-routing";
import { createServerAuthClient } from "@/lib/supabase/server-auth";

/**
 * When a logged-in user visits a live Sector 3 tool landing page,
 * send them straight to that tool's dashboard.
 */
export async function redirectLoggedInSector3ToDashboard(pathname: string): Promise<void> {
  const dashboardPath = resolveSector3DashboardFromPath(pathname);
  if (!dashboardPath) return;

  const supabase = await createServerAuthClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect(dashboardPath);
  }
}
