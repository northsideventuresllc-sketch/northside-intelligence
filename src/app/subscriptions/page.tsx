import type { Metadata } from "next";
import { Footer } from "@/components/landing/Footer";
import { NavServer } from "@/components/landing/NavServer";
import { SubscriptionsPageClient } from "@/components/subscriptions/SubscriptionsPageClient";
import { getUserBillingState } from "@/lib/billing/entitlements";
import { normalizeNiTier, type NiTier } from "@/lib/billing/ni-tiers";
import { createServerAuthClient } from "@/lib/supabase/server-auth";

export const metadata: Metadata = {
  title: "Subscriptions | Northside Intelligence",
  description:
    "Compare NI subscription tiers — Free, Core, Pro, and Power — and find the plan that fits your Intelligence Tools workflow.",
};

export default async function SubscriptionsPage() {
  const supabase = await createServerAuthClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let initialNiTier: NiTier = "free";
  if (user) {
    const billing = await getUserBillingState(user.id);
    initialNiTier = normalizeNiTier(billing.niTier);
  }

  return (
    <main className="min-h-screen bg-ni-bg">
      <NavServer />
      <section className="relative px-6 pb-20 pt-24">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-cyan-500/[0.04] via-transparent to-transparent" />
        <div className="relative mx-auto max-w-4xl">
          <SubscriptionsPageClient
            initialIsLoggedIn={!!user}
            initialNiTier={initialNiTier}
          />
        </div>
      </section>
      <Footer />
    </main>
  );
}
