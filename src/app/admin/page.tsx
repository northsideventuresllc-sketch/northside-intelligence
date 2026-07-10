import { redirect } from "next/navigation";
import { axonPublicPath } from "@/lib/axon/paths";
import { canEnterAxonPortal } from "@/lib/axon/access";
import { createServerAuthClient } from "@/lib/supabase/server-auth";

/** Legacy /admin — AXON is the master operator shell (NAV-5). */
export default async function AdminRedirectPage() {
  const supabase = await createServerAuthClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/signin?returnTo=/admin");
  }

  const allowed = await canEnterAxonPortal(user.id);
  if (!allowed) {
    redirect("/");
  }

  const { data: profile } = await supabase
    .from("ni_portal_profiles")
    .select("username")
    .eq("id", user.id)
    .maybeSingle();

  const username = profile?.username?.trim().toLowerCase();
  if (username) {
    redirect(axonPublicPath(username, "/dashboard"));
  }

  redirect("/axon");
}
