import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Image from "next/image";
import { getUserBillingState } from "@/lib/billing/entitlements";
import { createServerAuthClient } from "@/lib/supabase/server-auth";
import { Nav } from "@/components/landing/Nav";
import { Footer } from "@/components/landing/Footer";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { AccountSettings } from "@/components/account/AccountSettings";

export const metadata: Metadata = {
  title: "Account | Northside Intelligence",
};

export default async function AccountPage() {
  const supabase = await createServerAuthClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/signin?returnTo=/account");
  }

  const { data: profile } = await supabase
    .from("ni_portal_profiles")
    .select("full_name, email, username, two_factor_enabled")
    .eq("id", user.id)
    .maybeSingle();

  const billingState = await getUserBillingState(user.id);

  const displayName =
    profile?.full_name ?? user.user_metadata?.full_name ?? user.email?.split("@")[0] ?? "Member";

  return (
    <main className="min-h-screen bg-ni-bg">
      <Nav />
      <section className="relative px-6 pb-20 pt-24">
        <div className="mx-auto max-w-2xl">
          <div className="mb-8 text-center">
            <Image
              src="/logo-full.png"
              alt="Northside Intelligence"
              width={160}
              height={200}
              className="mx-auto mb-4 h-auto w-28 object-contain"
            />
            <p className="mb-1 text-xs uppercase tracking-[0.2em] text-ni-cyan/60">Signed In</p>
            <h1 className="text-2xl font-semibold text-white">Welcome, {displayName}</h1>
            <p className="mt-1 text-sm text-ni-muted">{profile?.email ?? user.email}</p>
          </div>

          <AccountSettings
            initialProfile={{
              email: profile?.email ?? user.email ?? "",
              fullName: profile?.full_name ?? null,
              username: profile?.username ?? null,
              twoFactorEnabled: profile?.two_factor_enabled ?? true,
            }}
            billing={{
              niTier: billingState.niTier,
              billingInterval: billingState.billingInterval,
              hasStripeCustomer: !!billingState.stripeCustomerId,
              toolkitCount: billingState.toolkit.length,
              isMasterAccount: billingState.isMasterAccount,
            }}
          />

          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <a
              href="/toolkit"
              className="rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-6 py-3 text-sm font-medium text-cyan-300 transition hover:bg-cyan-500/20"
            >
              Open Toolkit
            </a>
            <SignOutButton />
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}
