import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { canEnterAxonPortal } from "@/lib/axon/access";
import { axonPublicPath } from "@/lib/axon/paths";
import { createServerAuthClient } from "@/lib/supabase/server-auth";

export const metadata: Metadata = {
  title: "AXON | Northside Intelligence",
  description: "Secure entry to the AXON intelligence environment.",
};

export const dynamic = "force-dynamic";

export default async function AxonUserEntryPage({
  params,
}: {
  params: { username: string };
}) {
  const username = params.username.trim().toLowerCase();
  const supabase = await createServerAuthClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/axon");

  const { data: profile } = await supabase
    .from("ni_portal_profiles")
    .select("username")
    .eq("id", user.id)
    .maybeSingle();

  const portalUsername = profile?.username?.trim().toLowerCase() ?? "";
  if (portalUsername !== username) {
    redirect("/axon");
  }

  const allowed = await canEnterAxonPortal(user.id);
  if (!allowed) redirect("/axon");

  redirect(`/api/axon/bootstrap?username=${encodeURIComponent(username)}`);
}
