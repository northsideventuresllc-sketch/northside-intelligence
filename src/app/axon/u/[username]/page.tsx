import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Footer } from "@/components/landing/Footer";
import { NavServer } from "@/components/landing/NavServer";
import { AxonGateClient } from "@/components/axon/AxonGateClient";
import { canAccessAxon } from "@/lib/axon/access";
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

  if (!user) redirect(`/auth/signin?next=/axon-${username}`);

  const { data: profile } = await supabase
    .from("ni_portal_profiles")
    .select("username, is_master_account")
    .eq("id", user.id)
    .maybeSingle();

  const portalUsername = profile?.username?.trim().toLowerCase() ?? "";
  if (portalUsername !== username) {
    redirect("/toolkit");
  }

  const allowed = await canAccessAxon(user.id);
  if (!allowed) redirect("/toolkit");

  return (
    <main className="min-h-screen bg-ni-bg">
      <NavServer />
      <section className="relative px-6 pb-20 pt-24">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(0,212,255,0.08),transparent_55%)]" />
        <div className="relative mx-auto max-w-4xl">
          <AxonGateClient username={username} />
        </div>
      </section>
      <Footer />
    </main>
  );
}
