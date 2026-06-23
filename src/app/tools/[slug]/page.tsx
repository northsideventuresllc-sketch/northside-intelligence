import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ToolPricingGrid } from "@/components/billing/ToolPricingGrid";
import { Footer } from "@/components/landing/Footer";
import { NavServer } from "@/components/landing/NavServer";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  getUserBillingState,
  shouldHideToolSubscriptions,
  userOwnsTool,
  userHasUnlimitedToolAccess,
} from "@/lib/billing/entitlements";
import { shouldShowPermanentAccessOffer } from "@/lib/billing/permanent-access-offer";
import { ToolSubscriptionPanel } from "@/components/billing/ToolSubscriptionPanel";
import { getNiTierConfig } from "@/lib/billing/ni-tiers";
import { mapDbPricing } from "@/lib/billing/tool-pricing";
import { INTELLIGENCE_TOOLS } from "@/lib/constants";
import { getSector3DashboardPath } from "@/lib/sector3-routing";
import { createServiceClient } from "@/lib/supabase/server";
import { createServerAuthClient } from "@/lib/supabase/server-auth";

interface ToolPageProps {
  params: { slug: string };
}

export async function generateMetadata({ params }: ToolPageProps): Promise<Metadata> {
  const tool = INTELLIGENCE_TOOLS.find((t) => t.slug === params.slug);
  if (!tool) return { title: "Tool | Northside Intelligence" };
  return {
    title: `${tool.name} | Northside Intelligence`,
    description: tool.description,
  };
}

export default async function ToolPage({ params }: ToolPageProps) {
  const tool = INTELLIGENCE_TOOLS.find((t) => t.slug === params.slug);
  if (!tool) notFound();

  const supabaseAuth = await createServerAuthClient();
  const {
    data: { user },
  } = await supabaseAuth.auth.getUser();

  const service = createServiceClient();
  const { data: pricingRow } = await service
    .from("ni_tool_pricing")
    .select("*")
    .eq("tool_slug", tool.slug)
    .maybeSingle();

  const pricing = pricingRow ? mapDbPricing(pricingRow) : null;

  if (user && tool.status === "LIVE") {
    const dashboardPath = getSector3DashboardPath(tool.slug);
    if (dashboardPath) redirect(dashboardPath);
  }

  let billingState = null;
  if (user) {
    billingState = await getUserBillingState(user.id);
  }

  const owned = billingState ? userOwnsTool(billingState, tool.slug) : false;
  const hasUnlimited = billingState ? userHasUnlimitedToolAccess(billingState, tool.slug) : false;
  const hideSubscriptions = billingState
    ? shouldHideToolSubscriptions(billingState, tool.slug)
    : false;
  const showGuestPricing = !user && pricing;
  const showLoggedInSubscription =
    user && billingState && pricing && owned && !hasUnlimited && !hideSubscriptions;
  const showPermanentOffer = Boolean(
    user && shouldShowPermanentAccessOffer(tool.slug, user.id)
  );

  return (
    <main className="min-h-screen bg-ni-bg">
      <NavServer />
      <section className="relative px-6 pb-20 pt-24">
        <div className="mx-auto max-w-2xl">
          <Link href="/#tools" className="text-sm text-cyan-300/80 hover:text-cyan-200">
            ← Back to Tools
          </Link>

          <div className="mt-8 text-center">
            <div
              className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-2xl border p-4"
              style={{
                borderColor: `${tool.brandColor}55`,
                background: `linear-gradient(135deg, ${tool.brandColor}18, transparent)`,
                boxShadow: `0 0 50px ${tool.brandColor}22`,
              }}
            >
              <Image
                src={tool.logo}
                alt={`${tool.name} logo`}
                width={80}
                height={80}
                className="h-16 w-16 object-contain"
              />
            </div>
            <h1 className="text-3xl font-semibold text-white">{tool.name}</h1>
            <div className="mt-2 flex justify-center">
              <StatusBadge status={tool.status} />
            </div>
            <p className="mx-auto mt-4 max-w-lg text-ni-muted">{tool.description}</p>
          </div>

          {owned && (
            <div className="glass-panel mt-8 p-6 text-center">
              <p className="text-sm font-semibold uppercase tracking-wider text-emerald-300">
                In Your Toolkit
              </p>
              <p className="mt-2 text-ni-muted">You have access to {tool.name}.</p>
              <div className="mt-4 flex flex-wrap justify-center gap-3">
                {tool.url && (
                  <a
                    href={tool.url}
                    className="rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-5 py-2.5 text-sm font-medium text-cyan-300 transition hover:bg-cyan-500/20"
                  >
                    Open Tool
                  </a>
                )}
                <Link
                  href="/toolkit"
                  className="rounded-xl border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-medium text-white/90 transition hover:bg-white/10"
                >
                  View Toolkit
                </Link>
              </div>
            </div>
          )}

          {hideSubscriptions && !owned && billingState?.hasNiPaidPlan && (
            <div className="glass-panel mt-8 p-6 text-center">
              <p className="text-ni-muted">
                Add {tool.name} to your Toolkit under your NI {getNiTierConfig(billingState.niTier).name} plan.
              </p>
              <Link
                href="/toolkit"
                className="mt-4 inline-block rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-5 py-2.5 text-sm font-medium text-cyan-300 transition hover:bg-cyan-500/20"
              >
                Open Toolkit
              </Link>
            </div>
          )}

          {showGuestPricing && pricing && (
            <div className="mt-8">
              <ToolPricingGrid
                toolSlug={tool.slug}
                toolName={tool.name}
                pricing={pricing}
                isLoggedIn={false}
                returnPath={`/tools/${tool.slug}`}
              />
            </div>
          )}

          {showLoggedInSubscription && billingState && pricing && (
            <div className="mt-8">
              <ToolSubscriptionPanel
                toolSlug={tool.slug}
                toolName={tool.name}
                pricing={pricing}
                billingState={billingState}
                showPermanentOffer={showPermanentOffer}
              />
            </div>
          )}

          {!user && !owned && (
            <p className="mt-6 text-center text-sm text-ni-muted">
              <Link href="/auth/signin" className="text-cyan-300 hover:text-cyan-200">
                Sign In
              </Link>{" "}
              to manage your Toolkit and subscription options.
            </p>
          )}
        </div>
      </section>
      <Footer />
    </main>
  );
}
