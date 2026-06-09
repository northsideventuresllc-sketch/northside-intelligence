import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckoutButton } from "@/components/billing/CheckoutButton";
import { Footer } from "@/components/landing/Footer";
import { Nav } from "@/components/landing/Nav";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  getUserBillingState,
  shouldHideToolSubscriptions,
  userOwnsTool,
} from "@/lib/billing/entitlements";
import { mapDbPricing } from "@/lib/billing/tool-pricing";
import { INTELLIGENCE_TOOLS } from "@/lib/constants";
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

  let billingState = null;
  if (user) {
    billingState = await getUserBillingState(user.id);
  }

  const owned = billingState ? userOwnsTool(billingState, tool.slug) : false;
  const hideSubscriptions = billingState
    ? shouldHideToolSubscriptions(billingState, tool.slug)
    : false;
  const showPricing = !owned && !hideSubscriptions && pricing;

  return (
    <main className="min-h-screen bg-ni-bg">
      <Nav />
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
                Add {tool.name} from your Toolkit under your NI {billingState.niTier} plan.
              </p>
              <Link
                href="/toolkit"
                className="mt-4 inline-block rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-5 py-2.5 text-sm font-medium text-cyan-300 transition hover:bg-cyan-500/20"
              >
                Open Toolkit
              </Link>
            </div>
          )}

          {showPricing && pricing && (
            <div className="mt-8 space-y-4">
              <h2 className="text-center text-lg font-semibold text-white">Get Unlimited Access</h2>
              <p className="text-center text-xs text-ni-muted">
                Market-adjusted pricing · Demand multiplier {pricing.demandMultiplier.toFixed(2)}×
              </p>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="glass-panel p-5 text-center">
                  <p className="text-2xl font-bold text-white">
                    ${pricing.monthlyPriceUsd.toFixed(0)}
                    <span className="text-sm font-normal text-ni-muted">/mo</span>
                  </p>
                  <p className="mt-1 text-sm text-ni-muted">Monthly</p>
                  {user ? (
                    <div className="mt-4">
                      <CheckoutButton
                        label="Subscribe Monthly"
                        payload={{
                          type: "tool_subscription",
                          toolSlug: tool.slug,
                          interval: "monthly",
                        }}
                      />
                    </div>
                  ) : (
                    <Link
                      href={`/auth/signup?returnTo=/tools/${tool.slug}`}
                      className="mt-4 block rounded-xl border border-cyan-500/30 bg-cyan-500/10 py-2.5 text-sm font-medium text-cyan-300"
                    >
                      Sign Up to Subscribe
                    </Link>
                  )}
                </div>

                <div className="glass-panel p-5 text-center ring-1 ring-cyan-400/30">
                  <p className="text-2xl font-bold text-white">
                    ${pricing.annualPriceUsd.toFixed(0)}
                    <span className="text-sm font-normal text-ni-muted">/yr</span>
                  </p>
                  <p className="mt-1 text-sm text-ni-muted">Annual</p>
                  {user ? (
                    <div className="mt-4">
                      <CheckoutButton
                        label="Subscribe Annually"
                        payload={{
                          type: "tool_subscription",
                          toolSlug: tool.slug,
                          interval: "annual",
                        }}
                      />
                    </div>
                  ) : (
                    <Link
                      href={`/auth/signup?returnTo=/tools/${tool.slug}`}
                      className="mt-4 block rounded-xl border border-cyan-500/30 bg-cyan-500/10 py-2.5 text-sm font-medium text-cyan-300"
                    >
                      Sign Up to Subscribe
                    </Link>
                  )}
                </div>

                <div className="glass-panel p-5 text-center">
                  <p className="text-2xl font-bold text-white">
                    ${pricing.lifetimePriceUsd.toFixed(0)}
                  </p>
                  <p className="mt-1 text-sm text-ni-muted">Lifetime</p>
                  {user ? (
                    <div className="mt-4">
                      <CheckoutButton
                        label="Buy Lifetime"
                        payload={{ type: "tool_lifetime", toolSlug: tool.slug }}
                      />
                    </div>
                  ) : (
                    <Link
                      href={`/auth/signup?returnTo=/tools/${tool.slug}`}
                      className="mt-4 block rounded-xl border border-cyan-500/30 bg-cyan-500/10 py-2.5 text-sm font-medium text-cyan-300"
                    >
                      Sign Up to Purchase
                    </Link>
                  )}
                </div>
              </div>

              <p className="text-center text-xs text-ni-muted">
                Lifetime pricing adjusts with market demand. Or{" "}
                <a href="/#pricing" className="text-cyan-300 hover:text-cyan-200">
                  upgrade your NI plan
                </a>{" "}
                for bundled unlimited access.
              </p>
            </div>
          )}

          {!user && !owned && (
            <p className="mt-6 text-center text-sm text-ni-muted">
              <Link href="/auth/signin" className="text-cyan-300 hover:text-cyan-200">
                Sign In
              </Link>{" "}
              to see your Toolkit and pricing options.
            </p>
          )}
        </div>
      </section>
      <Footer />
    </main>
  );
}
