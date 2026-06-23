"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { BRAND } from "@/lib/constants";
import { NI_TIERS } from "@/lib/billing/ni-tiers";
import { SECTOR3_TOOL_PRICING_CATALOG } from "@/lib/billing/sector3-tool-pricing";
import { SECTOR3_REGISTRY } from "@/lib/sector3-registry";

interface FaqItem {
  id: string;
  question: string;
  answer: ReactNode;
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      className={`h-5 w-5 shrink-0 text-cyan-400/80 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden
    >
      <path
        fillRule="evenodd"
        d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.25a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function FaqAccordionItem({ item, open, onToggle }: { item: FaqItem; open: boolean; onToggle: () => void }) {
  const panelId = `faq-panel-${item.id}`;
  const buttonId = `faq-button-${item.id}`;

  return (
    <div className="glass-panel overflow-hidden transition-colors hover:border-cyan-500/25">
      <button
        id={buttonId}
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={panelId}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left sm:px-6 sm:py-5"
      >
        <span className="text-sm font-medium text-white sm:text-[15px]">{item.question}</span>
        <ChevronIcon open={open} />
      </button>
      <div
        id={panelId}
        role="region"
        aria-labelledby={buttonId}
        className={`grid transition-[grid-template-rows] duration-200 ease-out ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
      >
        <div className="overflow-hidden">
          <div className="border-t border-white/5 px-5 pb-5 pt-4 text-sm leading-relaxed text-ni-muted sm:px-6 sm:pb-6">
            {item.answer}
          </div>
        </div>
      </div>
    </div>
  );
}

function buildFaqItems(): FaqItem[] {
  const liveTools = SECTOR3_REGISTRY.filter((t) => t.status === "LIVE");

  const toolList = liveTools.map((tool) => {
    const pricing = SECTOR3_TOOL_PRICING_CATALOG.find((p) => p.toolSlug === tool.slug);
    const freeCap = pricing
      ? `${pricing.freeTierMonthlyCap} free ${pricing.freeTierUnit} per month`
      : "free tier included";
    const paidPrice = pricing ? `from $${pricing.baseMonthlyUsd}/mo` : "paid plans available";

    return (
      <li key={tool.slug}>
        <span className="font-medium text-white/90">{tool.name}</span>
        {" — "}
        {tool.description}. Try it with {freeCap}, or {paidPrice}.
      </li>
    );
  });

  const individualPricing = SECTOR3_TOOL_PRICING_CATALOG.map((p) => (
    <li key={p.toolSlug}>
      <span className="font-medium text-white/90">{p.name}</span>: ${p.baseMonthlyUsd}/mo (or save with
      annual or lifetime access)
    </li>
  ));

  return [
    {
      id: "what-is-ni",
      question: "What is Northside Intelligence?",
      answer: (
        <>
          <p>
            {BRAND.company} builds practical AI products for everyday work — customer replies, grant
            writing, workflow checks, and more. Our tagline is &ldquo;{BRAND.tagline}&rdquo;
          </p>
          <p className="mt-3">
            Everything lives on one website: AI tools you can use in your browser, a daily deals store,
            and optional custom services if you need something built for your business. One free account
            unlocks the whole experience.
          </p>
        </>
      ),
    },
    {
      id: "what-is-this-site",
      question: "What is this website?",
      answer: (
        <>
          <p>
            This is the home for all Northside Intelligence products. When you create an account, you
            get a personal dashboard, a Toolkit to manage your AI tools, access to the Smart Store, and
            the ability to request custom services.
          </p>
          <p className="mt-3">
            There is nothing extra to install — sign up, pick what you want to use, and open it in your
            browser. Your account, billing, and tool access are all managed here in one place.
          </p>
        </>
      ),
    },
    {
      id: "intelligence-tools",
      question: "What are Intelligence Tools?",
      answer: (
        <>
          <p>
            Intelligence Tools are AI-powered apps built by Northside Intelligence. Each one solves a
            specific job — like drafting customer replies, finding grants, or spotting gaps in your
            workflow. They are separate from the Smart Store, which is a shopping experience for
            physical products.
          </p>
          <p className="mt-3">
            Before you use a tool, add it to your{" "}
            <Link href="/toolkit" className="text-cyan-300 transition hover:text-cyan-200">
              Toolkit
            </Link>
            . That is your personal collection of tools you have access to. You can try every tool on a
            free tier with monthly limits, then upgrade for unlimited use.
          </p>
        </>
      ),
    },
    {
      id: "available-tools",
      question: "What tools are available right now?",
      answer: (
        <>
          <p className="mb-3">These Intelligence Tools are live today:</p>
          <ul className="list-disc space-y-2 pl-5">{toolList}</ul>
          <p className="mt-4">
            Browse them in the{" "}
            <a href="#tools" className="text-cyan-300 transition hover:text-cyan-200">
              Tools
            </a>{" "}
            section above, or open any tool page to see a preview and start free.
          </p>
        </>
      ),
    },
    {
      id: "pricing",
      question: "How does pricing work?",
      answer: (
        <>
          <p className="mb-3">
            You have two ways to pay for Intelligence Tools — pick a monthly plan, or buy tools one at a
            time. The Smart Store is separate and does not require a subscription.
          </p>
          <p className="mb-2 font-medium text-white/90">NI subscription plans</p>
          <ul className="mb-4 list-disc space-y-2 pl-5">
            <li>
              <span className="font-medium text-white/90">Free</span> — $0/mo. Try every tool with
              limited monthly usage. Buy individual tools anytime.
            </li>
            <li>
              <span className="font-medium text-white/90">Core</span> — ${NI_TIERS.core.monthlyPriceUsd}
              /mo (${NI_TIERS.core.annualMonthlyUsd}/mo billed annually). 3 tool slots with unlimited
              usage on those tools.
            </li>
            <li>
              <span className="font-medium text-white/90">Pro</span> — ${NI_TIERS.pro.monthlyPriceUsd}
              /mo (${NI_TIERS.pro.annualMonthlyUsd}/mo billed annually). 10 tool slots with unlimited
              usage.
            </li>
            <li>
              <span className="font-medium text-white/90">Power</span> — ${NI_TIERS.power.monthlyPriceUsd}
              /mo (${NI_TIERS.power.annualMonthlyUsd}/mo billed annually). Unlimited tool slots and
              unlimited usage across all tools.
            </li>
          </ul>
          <p className="mb-2 font-medium text-white/90">Buy a single tool (à la carte)</p>
          <ul className="list-disc space-y-2 pl-5">{individualPricing}</ul>
          <p className="mt-4">
            See full plan details on the{" "}
            <a href="#pricing" className="text-cyan-300 transition hover:text-cyan-200">
              Pricing
            </a>{" "}
            section or visit{" "}
            <Link href="/subscriptions" className="text-cyan-300 transition hover:text-cyan-200">
              Subscription Info
            </Link>
            .
          </p>
        </>
      ),
    },
    {
      id: "smart-store",
      question: "What is the Smart Store?",
      answer: (
        <>
          <p>
            The{" "}
            <Link href="/store" className="text-cyan-300 transition hover:text-cyan-200">
              Smart Store
            </Link>{" "}
            is a separate shopping experience — not an AI tool. Every day we refresh a curated set of
            trending products scored from what is popular online and what shoppers on Northside
            Intelligence are buying.
          </p>
          <p className="mt-3">
            You can browse daily picks, search for specific items, or try surprise mode to discover
            something new. Add items to your cart and check out like any online store. If you are signed
            in, you can optionally turn on personalized recommendations based on your browsing.
          </p>
        </>
      ),
    },
    {
      id: "smart-store-pricing",
      question: "How does Smart Store pricing work?",
      answer: (
        <>
          <p>
            Every product price you see is the supplier&apos;s listing price plus a flat 10% service
            fee. We never show supplier costs — you only see the final price you pay.
          </p>
          <p className="mt-3">
            Prices are verified again at checkout, so what you see is what you get. There is no
            subscription required to shop — anyone can browse, and signing in lets you save preferences
            and track orders through your account.
          </p>
        </>
      ),
    },
    {
      id: "how-tools-work",
      question: "How do the AI tools actually work?",
      answer: (
        <>
          <p>
            Each Intelligence Tool runs in the cloud on Northside Intelligence servers — you do not
            need to download software or manage infrastructure. Open a tool in your browser, give it
            input (a customer message, a grant idea, a workflow to review), and the AI handles the
            heavy lifting.
          </p>
          <p className="mt-3">
            Tools are built to work on their own once you start a task: they analyze your input, apply
            specialized AI models, and return ready-to-use results. You stay in control — review,
            edit, and approve everything before it goes anywhere.
          </p>
          <p className="mt-3">
            Your usage counts against your free tier limits or your plan&apos;s unlimited access. All
            tools share one account, so you sign in once and move between tools without extra setup.
          </p>
        </>
      ),
    },
    {
      id: "services",
      question: "What are Intelligence Services?",
      answer: (
        <>
          <p>
            Intelligence Services are custom projects for people and businesses that need more than
            off-the-shelf tools — things like a tailored intelligence server, a workflow audit, or an AI
            strategy engagement.
          </p>
          <p className="mt-3">
            These are quoted individually based on scope. A free account is required to submit a
            request. Browse what is available on the{" "}
            <Link href="/services" className="text-cyan-300 transition hover:text-cyan-200">
              Intelligence Services
            </Link>{" "}
            page.
          </p>
        </>
      ),
    },
    {
      id: "ecosystem",
      question: "What is the Intelligence Ecosystem?",
      answer: (
        <>
          <p>
            The Intelligence Ecosystem is a collection of standalone ventures from Northside Intelligence
            Labs — separate products like Match Fit (athletic matching) that live outside the main tool
            suite.
          </p>
          <p className="mt-3">
            They are related to our broader mission but are their own apps with their own websites. The
            Intelligence Tools and Smart Store on this site are the core products you manage through your
            Northside Intelligence account.
          </p>
        </>
      ),
    },
    {
      id: "getting-started",
      question: "How do I get started?",
      answer: (
        <>
          <ol className="list-decimal space-y-2 pl-5">
            <li>
              <Link href="/auth/signup" className="text-cyan-300 transition hover:text-cyan-200">
                Create a free account
              </Link>{" "}
              — no credit card required.
            </li>
            <li>
              Browse{" "}
              <a href="#tools" className="text-cyan-300 transition hover:text-cyan-200">
                Intelligence Tools
              </a>{" "}
              and add the ones you want to your Toolkit.
            </li>
            <li>Try any tool free with monthly usage limits, or pick a plan for unlimited access.</li>
            <li>
              Visit the{" "}
              <Link href="/store" className="text-cyan-300 transition hover:text-cyan-200">
                Smart Store
              </Link>{" "}
              anytime — no subscription needed.
            </li>
          </ol>
          <p className="mt-4">
            Already have an account?{" "}
            <Link href="/auth/signin" className="text-cyan-300 transition hover:text-cyan-200">
              Sign In
            </Link>{" "}
            and open your{" "}
            <Link href="/toolkit" className="text-cyan-300 transition hover:text-cyan-200">
              Toolkit
            </Link>
            .
          </p>
        </>
      ),
    },
  ];
}

const FAQ_ITEMS = buildFaqItems();

export function FaqSection() {
  const [openIds, setOpenIds] = useState<Set<string>>(new Set());

  const toggle = (id: string) => {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <section id="faq" className="relative border-t border-white/5 px-6 py-20">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-cyan-500/[0.03] via-transparent to-transparent" />
      <div className="relative mx-auto max-w-3xl">
        <div className="mb-10 text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-ni-cyan/60">
            Learn More
          </p>
          <h2 className="text-2xl font-semibold text-white sm:text-3xl">
            <span className="bg-gradient-to-r from-white to-cyan-200/80 bg-clip-text pb-1 text-transparent">
              Common Questions
            </span>
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-ni-muted">
            New here? Expand any topic below to learn what Northside Intelligence offers and how
            everything fits together.
          </p>
        </div>

        <div className="space-y-3">
          {FAQ_ITEMS.map((item) => (
            <FaqAccordionItem
              key={item.id}
              item={item}
              open={openIds.has(item.id)}
              onToggle={() => toggle(item.id)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
