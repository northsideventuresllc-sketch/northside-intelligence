"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import {
  BUDGET_OPTIONS,
  TEAM_SIZE_OPTIONS,
  TIMELINE_OPTIONS,
  type AccountType,
  type ServiceOffering,
} from "@/lib/services/offerings";
import type { ServiceQuoteResult } from "@/lib/services/pricing-engine";
import { QuoteLoadingScreen } from "@/components/services/QuoteLoadingScreen";
import { ServiceQuotePanel } from "@/components/services/ServiceQuotePanel";

type FormStep = "intake" | "loading" | "quote";

interface ServiceRequestFormProps {
  service: ServiceOffering;
  initialData: {
    contactName: string;
    email: string;
    accountType: AccountType;
    businessName: string;
  };
}

export function ServiceRequestForm({ service, initialData }: ServiceRequestFormProps) {
  const [step, setStep] = useState<FormStep>("intake");
  const [contactName, setContactName] = useState(initialData.contactName);
  const [email, setEmail] = useState(initialData.email);
  const [accountType, setAccountType] = useState<AccountType>(initialData.accountType);
  const [businessName, setBusinessName] = useState(initialData.businessName);
  const [industry, setIndustry] = useState("");
  const [currentSystems, setCurrentSystems] = useState("");
  const [painPoints, setPainPoints] = useState("");
  const [desiredOutcomes, setDesiredOutcomes] = useState("");
  const [timeline, setTimeline] = useState("");
  const [budgetRange, setBudgetRange] = useState("");
  const [customBudget, setCustomBudget] = useState("");
  const [teamSize, setTeamSize] = useState("");
  const [additionalContext, setAdditionalContext] = useState("");
  const [referralSource, setReferralSource] = useState("");
  const [error, setError] = useState("");

  const [quote, setQuote] = useState<(ServiceQuoteResult & { quoteId: string }) | null>(null);
  const [currentPriceCents, setCurrentPriceCents] = useState(0);

  async function handleGetQuote(e: FormEvent) {
    e.preventDefault();
    setError("");
    setStep("loading");

    const minDelay = new Promise((resolve) => setTimeout(resolve, 1800));

    try {
      const [res] = await Promise.all([
        fetch("/api/services/quote", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            serviceSlug: service.slug,
            contactName,
            email,
            accountType,
            businessName: accountType === "business" ? businessName : undefined,
            industry,
            currentSystems,
            painPoints,
            desiredOutcomes,
            timeline,
            budgetRange,
            customBudget: customBudget || undefined,
            teamSize,
            additionalContext,
            referralSource: referralSource || undefined,
          }),
        }),
        minDelay,
      ]);

      const quoteRes = res as Response;
      const data = (await quoteRes.json()) as (ServiceQuoteResult & { quoteId: string; error?: string });

      if (!quoteRes.ok) {
        setError(data.error ?? "Failed to generate quote");
        setStep("intake");
        return;
      }

      setQuote(data);
      setCurrentPriceCents(data.topPriceCents);
      setStep("quote");
    } catch {
      setError("Network error. Please try again.");
      setStep("intake");
    }
  }

  if (step === "loading") {
    return <QuoteLoadingScreen />;
  }

  if (step === "quote" && quote) {
    return (
      <ServiceQuotePanel
        quote={quote}
        currentPriceCents={currentPriceCents}
        onPriceChange={setCurrentPriceCents}
      />
    );
  }

  const inputClass =
    "w-full rounded-xl border border-white/10 bg-ni-bg/80 px-4 py-3 text-white outline-none transition focus:border-cyan-500/50";

  return (
    <form onSubmit={handleGetQuote} className="glass-panel space-y-6 p-8">
      {error && (
        <p
          className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300"
          role="alert"
        >
          {error}
        </p>
      )}

      <div>
        <h2 className="mb-4 text-lg font-semibold text-white">Contact Information</h2>
        <div className="space-y-4">
          <div>
            <label htmlFor="contactName" className="mb-1 block text-sm text-ni-muted">
              Full Name
            </label>
            <input
              id="contactName"
              type="text"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              required
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="email" className="mb-1 block text-sm text-ni-muted">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className={inputClass}
            />
          </div>
        </div>
      </div>

      <div>
        <h2 className="mb-4 text-lg font-semibold text-white">Account Type</h2>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setAccountType("personal")}
            className={`flex-1 rounded-xl border px-4 py-3 text-sm font-medium transition ${
              accountType === "personal"
                ? "border-cyan-500/40 bg-cyan-500/10 text-cyan-300"
                : "border-white/10 bg-white/5 text-ni-muted hover:border-white/20"
            }`}
          >
            Personal Account
          </button>
          <button
            type="button"
            onClick={() => setAccountType("business")}
            className={`flex-1 rounded-xl border px-4 py-3 text-sm font-medium transition ${
              accountType === "business"
                ? "border-cyan-500/40 bg-cyan-500/10 text-cyan-300"
                : "border-white/10 bg-white/5 text-ni-muted hover:border-white/20"
            }`}
          >
            Business Account
          </button>
        </div>
      </div>

      {accountType === "business" && (
        <div>
          <label htmlFor="businessName" className="mb-1 block text-sm text-ni-muted">
            Business / Organization Name
          </label>
          <input
            id="businessName"
            type="text"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            required
            className={inputClass}
          />
        </div>
      )}

      <div>
        <h2 className="mb-4 text-lg font-semibold text-white">About Your Needs</h2>
        <div className="space-y-4">
          <div>
            <label htmlFor="industry" className="mb-1 block text-sm text-ni-muted">
              Industry or Sector
            </label>
            <input
              id="industry"
              type="text"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              required
              placeholder="e.g. Healthcare, E-commerce, Nonprofit, Personal productivity"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="currentSystems" className="mb-1 block text-sm text-ni-muted">
              Current Systems & Tools
            </label>
            <textarea
              id="currentSystems"
              value={currentSystems}
              onChange={(e) => setCurrentSystems(e.target.value)}
              required
              rows={3}
              placeholder="What tools, platforms, and systems do you currently use?"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="painPoints" className="mb-1 block text-sm text-ni-muted">
              Primary Pain Points & Gaps
            </label>
            <textarea
              id="painPoints"
              value={painPoints}
              onChange={(e) => setPainPoints(e.target.value)}
              required
              rows={3}
              placeholder="What problems are you trying to solve?"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="desiredOutcomes" className="mb-1 block text-sm text-ni-muted">
              Desired Outcomes & Goals
            </label>
            <textarea
              id="desiredOutcomes"
              value={desiredOutcomes}
              onChange={(e) => setDesiredOutcomes(e.target.value)}
              required
              rows={3}
              placeholder="What does success look like?"
              className={inputClass}
            />
          </div>
        </div>
      </div>

      <div>
        <h2 className="mb-4 text-lg font-semibold text-white">Project Details</h2>
        <div className="space-y-4">
          <div>
            <label htmlFor="timeline" className="mb-1 block text-sm text-ni-muted">
              Timeline
            </label>
            <select
              id="timeline"
              value={timeline}
              onChange={(e) => setTimeline(e.target.value)}
              required
              className={inputClass}
            >
              <option value="">Select a timeline</option>
              {TIMELINE_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="budgetRange" className="mb-1 block text-sm text-ni-muted">
              Budget Range
            </label>
            <select
              id="budgetRange"
              value={budgetRange}
              onChange={(e) => setBudgetRange(e.target.value)}
              required
              className={inputClass}
            >
              <option value="">Select a budget range</option>
              {BUDGET_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="customBudget" className="mb-1 block text-sm text-ni-muted">
              Your Budget (Optional)
            </label>
            <input
              id="customBudget"
              type="text"
              value={customBudget}
              onChange={(e) => setCustomBudget(e.target.value)}
              placeholder="e.g. $2,500 — exact amount you can invest"
              className={inputClass}
            />
            <p className="mt-1 text-xs text-ni-muted">
              Providing your exact budget helps us tailor a quote within your range.
            </p>
          </div>
          <div>
            <label htmlFor="teamSize" className="mb-1 block text-sm text-ni-muted">
              Team Size / Users Affected
            </label>
            <select
              id="teamSize"
              value={teamSize}
              onChange={(e) => setTeamSize(e.target.value)}
              required
              className={inputClass}
            >
              <option value="">Select team size</option>
              {TEAM_SIZE_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="additionalContext" className="mb-1 block text-sm text-ni-muted">
              Additional Context & Requirements
            </label>
            <textarea
              id="additionalContext"
              value={additionalContext}
              onChange={(e) => setAdditionalContext(e.target.value)}
              rows={4}
              placeholder="Compliance requirements, integrations, security needs, etc."
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="referralSource" className="mb-1 block text-sm text-ni-muted">
              How Did You Hear About Us? (Optional)
            </label>
            <input
              id="referralSource"
              type="text"
              value={referralSource}
              onChange={(e) => setReferralSource(e.target.value)}
              placeholder="Referral, search, social media, etc."
              className={inputClass}
            />
          </div>
        </div>
      </div>

      <button
        type="submit"
        className="w-full rounded-xl border border-cyan-500/40 bg-cyan-500/10 py-3 text-sm font-medium text-cyan-300 transition hover:bg-cyan-500/20"
      >
        Get My Quote
      </button>

      <p className="text-center text-xs text-ni-muted">
        <Link href="/services" className="text-cyan-300/80 hover:underline">
          Back to Services
        </Link>
      </p>
    </form>
  );
}
