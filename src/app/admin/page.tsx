import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Footer } from "@/components/landing/Footer";
import { NavServer } from "@/components/landing/NavServer";
import { getUserBillingState } from "@/lib/billing/entitlements";
import { createServerAuthClient } from "@/lib/supabase/server-auth";

export const metadata: Metadata = {
  title: "Admin Dashboard | Northside Intelligence",
  description: "Master account administration",
};

export default async function AdminDashboardPage() {
  const supabase = await createServerAuthClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/signin?returnTo=/admin");
  }

  const billingState = await getUserBillingState(user.id);

  if (!billingState.isMasterAccount) {
    redirect("/");
  }

  return (
    <main className="min-h-screen bg-ni-bg">
      <NavServer />
      <section className="relative px-6 pb-20 pt-24">
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-ni-cyan/60">
            Master Account
          </p>
          <h1 className="text-3xl font-semibold text-white">Admin Dashboard</h1>
          <div className="mt-10 rounded-2xl border border-amber-500/20 bg-amber-500/5 px-8 py-12">
            <p className="text-lg font-medium text-white">Not Set Up Yet</p>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-ni-muted">
              The admin dashboard is reserved for master accounts but has not been configured
              yet. Check back here for platform administration tools when they are available.
            </p>
            <Link
              href="/toolkit"
              className="mt-8 inline-flex rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-300 transition hover:border-cyan-400/50 hover:bg-cyan-500/20"
            >
              Back To Toolkit
            </Link>
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}
