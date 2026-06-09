import Link from "next/link";
import { buildPortalAuthUrl } from "@/lib/ni-auth";

interface PricingPlan {
  name: string;
  price: string;
  desc: string;
  accent: string;
  popular?: boolean;
}

const PLANS: PricingPlan[] = [
  {
    name: "Free",
    price: "$0",
    desc: "10 replies per month across NI tools",
    accent: "from-white/5 to-cyan-500/5",
  },
  {
    name: "Solo",
    price: "$9",
    desc: "100 replies per month",
    accent: "from-cyan-500/15 to-cyan-400/5",
    popular: true,
  },
  {
    name: "Team",
    price: "$49",
    desc: "1,000 replies per month",
    accent: "from-cyan-500/10 to-blue-500/10",
  },
  {
    name: "Agency",
    price: "$99",
    desc: "Unlimited scale for growing teams",
    accent: "from-blue-500/10 to-purple-500/10",
  },
];

export function PricingSection() {
  const signupUrl = buildPortalAuthUrl("signup");

  return (
    <section id="pricing" className="relative border-t border-white/5 px-6 py-20">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-cyan-500/[0.04] via-transparent to-transparent" />
      <div className="relative mx-auto max-w-5xl">
        <div className="mb-12 text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-ni-cyan/60">
            Pricing
          </p>
          <h2 className="text-2xl font-semibold text-white sm:text-3xl">
            <span className="bg-gradient-to-r from-white to-cyan-200/80 bg-clip-text pb-1 text-transparent">
              Northside Intelligence Pricing
            </span>
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-ni-muted">
            One account unlocks every intelligence tool. Upgrade when you need more capacity.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`glass-panel relative bg-gradient-to-br ${plan.accent} p-6 ${
                plan.popular ? "ring-1 ring-cyan-400/40" : ""
              }`}
            >
              {plan.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full border border-cyan-400/40 bg-cyan-500/20 px-3 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-cyan-300">
                  Popular
                </span>
              )}
              <p className="text-3xl font-bold text-white">
                {plan.price}
                <span className="text-sm font-normal text-ni-muted">/mo</span>
              </p>
              <p className="mt-1 font-semibold text-white">{plan.name}</p>
              <p className="mt-2 text-sm text-ni-muted">{plan.desc}</p>
              <Link
                href={signupUrl}
                className="mt-6 block rounded-xl border border-cyan-500/30 bg-cyan-500/10 py-2.5 text-center text-sm font-medium text-cyan-300 transition hover:border-cyan-400/50 hover:bg-cyan-500/20"
              >
                Get Started
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
