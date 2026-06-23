"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GrantBotBackground } from "@/components/grantbot/GrantBotBackground";
import { GrantBotNav } from "@/components/grantbot/GrantBotNav";
import { GrantListingBubble } from "@/components/grantbot/GrantListingBubble";
import { Sector3LoadingBar } from "@/components/sector3/Sector3LoadingBar";
import { CheckoutButton } from "@/components/billing/CheckoutButton";
import { grantbotPath } from "@/lib/grantbot/auth";
import { isHighestPaidNiTier } from "@/lib/billing/subscription-actions";
import type { NiTier } from "@/lib/billing/ni-tiers";
import type { GrantBotHistoryEntry } from "@/lib/grantbot/history";
import { parseGrantListings, type GrantListing } from "@/lib/grantbot/listings";
import {
  buildEnrichedOrgProfile,
  parseStoredClarifyingAnswers,
  type ClarifyingQuestion,
} from "@/lib/grantbot/questions";
import { createBrowserClient } from "@supabase/ssr";

const CATEGORIES = [
  "Nonprofit",
  "Creator",
  "Research",
  "Small Business",
  "Arts & Culture",
] as const;

type FlowStep = "intake" | "questions";

interface DraftState {
  loading: boolean;
  text?: string;
  error?: string;
  copied?: boolean;
}

interface Props {
  email: string;
  planLabel: string;
  grantsUsed: number;
  grantsLimit: number;
  hasUnlimitedAccess: boolean;
  niTier: string;
  initialCategory?: string;
  history: GrantBotHistoryEntry[];
  gated?: boolean;
  gateContent?: React.ReactNode;
}

function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

function isValidCategory(value: string | undefined): value is (typeof CATEGORIES)[number] {
  return !!value && CATEGORIES.includes(value as (typeof CATEGORIES)[number]);
}

export default function DashboardClient({
  email,
  planLabel,
  grantsUsed,
  grantsLimit,
  hasUnlimitedAccess,
  niTier,
  initialCategory,
  history: initialHistory,
  gated = false,
  gateContent,
}: Props) {
  const [flowStep, setFlowStep] = useState<FlowStep>("intake");
  const [orgDescription, setOrgDescription] = useState("");
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>(
    isValidCategory(initialCategory) ? initialCategory : "Nonprofit"
  );
  const [clarifyingQuestions, setClarifyingQuestions] = useState<ClarifyingQuestion[]>([]);
  const [clarifyingAnswers, setClarifyingAnswers] = useState<Record<string, string>>({});
  const [listings, setListings] = useState<GrantListing[]>([]);
  const [drafts, setDrafts] = useState<Record<string, DraftState>>({});
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState("");
  const [used, setUsed] = useState(grantsUsed);
  const [history, setHistory] = useState(initialHistory);
  const router = useRouter();
  const supabase = createClient();
  const effectiveLimit = hasUnlimitedAccess ? 999999 : grantsLimit;
  const atLimit = !hasUnlimitedAccess && used >= effectiveLimit;
  const usagePercent = Math.min((used / (effectiveLimit === 999999 ? 1 : effectiveLimit)) * 100, 100);
  const showUpgrade = atLimit && !isHighestPaidNiTier(niTier as NiTier);

  function requestPayload(extra: Record<string, unknown> = {}) {
    return {
      orgDescription,
      category,
      clarifyingQuestions,
      clarifyingAnswers,
      ...extra,
    };
  }

  async function handleContinue() {
    if (!orgDescription.trim()) return;

    setQuestionsLoading(true);
    setError("");
    setListings([]);
    setDrafts({});
    setClarifyingQuestions([]);
    setClarifyingAnswers({});

    const res = await fetch("/api/grantbot/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode: "questions",
        orgDescription,
        category,
      }),
    });
    const data = await res.json();
    setQuestionsLoading(false);

    if (!res.ok) {
      setError(data.error || "Something went wrong");
      return;
    }

    const questions = (data.questions ?? []) as ClarifyingQuestion[];
    setClarifyingQuestions(questions);
    setClarifyingAnswers(
      Object.fromEntries(questions.map((q) => [q.id, ""]))
    );
    setFlowStep("questions");
  }

  async function handleSearch() {
    if (!orgDescription.trim()) return;

    setSearchLoading(true);
    setError("");
    setListings([]);
    setDrafts({});

    const res = await fetch("/api/grantbot/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode: "search",
        ...requestPayload(),
      }),
    });
    const data = await res.json();
    setSearchLoading(false);

    if (!res.ok) {
      setError(data.error || "Something went wrong");
      return;
    }

    setListings(data.grants ?? []);
    if (data.usage) setUsed(data.usage.used);
    setHistory((prev) =>
      [
        {
          id: crypto.randomUUID(),
          mode: "search" as const,
          orgDescription,
          category,
          promptQuestions: JSON.stringify({ answers: clarifyingAnswers }),
          resultText: JSON.stringify({ grants: data.grants ?? [] }),
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ].slice(0, 50)
    );
  }

  async function handleDraft(listing: GrantListing) {
    if (atLimit) {
      setDrafts((prev) => ({
        ...prev,
        [listing.id]: { loading: false, error: "Monthly generation limit reached." },
      }));
      return;
    }

    setDrafts((prev) => ({
      ...prev,
      [listing.id]: { loading: true, error: undefined, text: prev[listing.id]?.text },
    }));

    const res = await fetch("/api/grantbot/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode: "draft",
        ...requestPayload({
          grantTitle: listing.name,
          funder: listing.funder,
          platform: listing.platform,
          platformUrl: listing.platformUrl,
          awardRange: listing.awardRange,
          fitReason: listing.fitReason,
        }),
      }),
    });
    const data = await res.json();

    if (!res.ok) {
      setDrafts((prev) => ({
        ...prev,
        [listing.id]: { loading: false, error: data.error || "Could not generate draft" },
      }));
      return;
    }

    if (data.usage) setUsed(data.usage.used);
    setDrafts((prev) => ({
      ...prev,
      [listing.id]: { loading: false, text: data.draft, copied: false },
    }));
    setHistory((prev) =>
      [
        {
          id: crypto.randomUUID(),
          mode: "draft" as const,
          orgDescription,
          category,
          grantTitle: listing.name,
          funder: listing.funder,
          resultText: data.draft,
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ].slice(0, 50)
    );
  }

  function loadHistoryEntry(entry: GrantBotHistoryEntry) {
    const restoredAnswers = parseStoredClarifyingAnswers(entry.promptQuestions);
    setOrgDescription(entry.orgDescription);
    if (isValidCategory(entry.category)) setCategory(entry.category);
    setError("");
    setClarifyingAnswers(restoredAnswers);
    setClarifyingQuestions([]);
    setFlowStep("intake");

    if (entry.mode === "search") {
      const parsed = parseGrantListings(entry.resultText);
      setListings(parsed);
      setDrafts({});
      if (Object.keys(restoredAnswers).length > 0) {
        setFlowStep("questions");
      }
      return;
    }

    const draftListing: GrantListing = {
      id: entry.id,
      name: entry.grantTitle ?? "Grant application",
      funder: entry.funder ?? "",
      platform: "Official site",
      platformUrl: entry.promptQuestions ?? "https://www.grants.gov",
      awardRange: "Varies",
      fitReason: buildEnrichedOrgProfile(entry.orgDescription, [], restoredAnswers).slice(0, 160),
      nextStep: "Review and edit your draft below.",
    };
    setListings([draftListing]);
    setDrafts({ [draftListing.id]: { loading: false, text: entry.resultText } });
  }

  async function handleCopyDraft(listingId: string, text: string) {
    await navigator.clipboard.writeText(text);
    setDrafts((prev) => ({
      ...prev,
      [listingId]: { ...prev[listingId], copied: true },
    }));
    setTimeout(() => {
      setDrafts((prev) => ({
        ...prev,
        [listingId]: { ...prev[listingId], copied: false },
      }));
    }, 2000);
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push(grantbotPath("/"));
  }

  const upgradePayload =
    niTier === "free"
      ? { type: "ni_subscription" as const, tier: "core" as const, interval: "monthly" as const }
      : niTier === "core"
        ? { type: "ni_subscription" as const, tier: "pro" as const, interval: "monthly" as const }
        : niTier === "pro"
          ? { type: "ni_subscription" as const, tier: "power" as const, interval: "monthly" as const }
          : null;

  const isGenerating =
    questionsLoading ||
    searchLoading ||
    Object.values(drafts).some((draft) => draft.loading);

  return (
    <div className="relative min-h-screen">
      <GrantBotBackground />
      <GrantBotNav email={email} planLabel={planLabel} onSignOut={handleSignOut} />
      <Sector3LoadingBar loading={isGenerating} variant="grantbot" />

      <main className="relative z-10 mx-auto max-w-3xl space-y-6 px-4 py-10">
        {gated && gateContent ? (
          gateContent
        ) : (
          <>
            <div className="gb-glass rounded-2xl p-5">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-medium text-white/80">Monthly Generations</span>
                <span className="text-sm text-gb-muted">
                  <span className={atLimit ? "font-semibold text-gb-amber" : "font-semibold text-white"}>
                    {used}
                  </span>{" "}
                  / {effectiveLimit === 999999 ? "∞" : effectiveLimit}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    atLimit
                      ? "bg-gradient-to-r from-gb-amber to-orange-500"
                      : "bg-gradient-to-r from-gb-emerald to-gb-teal"
                  }`}
                  style={{ width: `${usagePercent}%` }}
                />
              </div>
              {showUpgrade && upgradePayload && (
                <div className="mt-3 flex items-center justify-between gap-4">
                  <p className="text-sm text-gb-amber">Limit reached — upgrade to keep going.</p>
                  <CheckoutButton
                    label="Upgrade Subscription"
                    payload={upgradePayload}
                    className="rounded-xl bg-gradient-to-r from-gb-emerald to-gb-amber px-4 py-1.5 text-sm font-semibold text-gb-bg disabled:opacity-50"
                  />
                </div>
              )}
            </div>

            <div className="gb-glass space-y-5 rounded-3xl p-6 shadow-gb-glow">
              <div>
                <label className="mb-2 block text-sm font-medium text-gb-muted">
                  Organization / project description
                </label>
                <textarea
                  value={orgDescription}
                  onChange={(e) => {
                    setOrgDescription(e.target.value);
                    if (flowStep === "questions") {
                      setFlowStep("intake");
                      setClarifyingQuestions([]);
                      setClarifyingAnswers({});
                    }
                  }}
                  rows={4}
                  placeholder="Describe your mission, audience, location, and what funding would support…"
                  className="w-full resize-none rounded-2xl border border-white/10 bg-gb-bg/80 px-4 py-3 text-sm text-white outline-none transition focus:border-gb-emerald/50 focus:ring-1 focus:ring-gb-emerald/30"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gb-muted">Category</label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCategory(c)}
                      className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                        category === c
                          ? "border border-gb-emerald/60 bg-gb-emerald/20 text-gb-emerald shadow-gb-glow"
                          : "border border-white/10 bg-white/5 text-gb-muted hover:border-gb-teal/40 hover:text-white"
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <p className="rounded-xl border border-gb-amber/30 bg-gb-amber/10 px-4 py-3 text-sm text-gb-amber">
                  {error}
                </p>
              )}

              {flowStep === "intake" && (
                <button
                  type="button"
                  onClick={handleContinue}
                  disabled={questionsLoading || !orgDescription.trim()}
                  className="relative w-full overflow-hidden rounded-2xl bg-gradient-to-r from-gb-emerald via-gb-teal to-gb-amber py-3.5 font-semibold text-gb-bg shadow-gb-glow transition hover:opacity-95 disabled:opacity-40"
                >
                  {questionsLoading && (
                    <span className="absolute inset-0 gb-shimmer animate-shimmer" />
                  )}
                  <span className="relative flex items-center justify-center gap-2">
                    {questionsLoading ? (
                      <>
                        {[0, 1, 2, 3, 4].map((i) => (
                          <span
                            key={i}
                            className="h-4 w-1 rounded-full bg-gb-bg/80 animate-wave"
                            style={{ animationDelay: `${i * 0.1}s` }}
                          />
                        ))}
                        Preparing Questions…
                      </>
                    ) : (
                      "Continue"
                    )}
                  </span>
                </button>
              )}
            </div>

            {flowStep === "questions" && clarifyingQuestions.length > 0 && (
              <div className="gb-glass space-y-5 rounded-3xl p-6 shadow-gb-glow">
                <div>
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-gb-emerald">
                    A Few More Details
                  </h2>
                  <p className="mt-2 text-sm text-gb-muted">
                    Answer these so we can match you to grants that actually fit your organization.
                  </p>
                </div>

                <div className="space-y-4">
                  {clarifyingQuestions.map((q) => (
                    <div key={q.id}>
                      <label className="mb-2 block text-sm font-medium text-white/90">
                        {q.question}
                      </label>
                      <input
                        value={clarifyingAnswers[q.id] ?? ""}
                        onChange={(e) =>
                          setClarifyingAnswers((prev) => ({
                            ...prev,
                            [q.id]: e.target.value,
                          }))
                        }
                        placeholder={q.placeholder ?? "Your answer…"}
                        className="w-full rounded-2xl border border-white/10 bg-gb-bg/80 px-4 py-3 text-sm text-white outline-none transition focus:border-gb-emerald/50 focus:ring-1 focus:ring-gb-emerald/30"
                      />
                    </div>
                  ))}
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => {
                      setFlowStep("intake");
                      setClarifyingQuestions([]);
                      setClarifyingAnswers({});
                    }}
                    className="rounded-2xl border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-white/90 transition hover:border-gb-emerald/40 hover:bg-white/10"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handleSearch}
                    disabled={searchLoading || atLimit}
                    className="relative flex-1 overflow-hidden rounded-2xl bg-gradient-to-r from-gb-emerald via-gb-teal to-gb-amber py-3 text-sm font-semibold text-gb-bg shadow-gb-glow transition hover:opacity-95 disabled:opacity-40"
                  >
                    {searchLoading && (
                      <span className="absolute inset-0 gb-shimmer animate-shimmer" />
                    )}
                    <span className="relative flex items-center justify-center gap-2">
                      {searchLoading ? (
                        <>
                          {[0, 1, 2, 3, 4].map((i) => (
                            <span
                              key={i}
                              className="h-4 w-1 rounded-full bg-gb-bg/80 animate-wave"
                              style={{ animationDelay: `${i * 0.1}s` }}
                            />
                          ))}
                          Finding Grants…
                        </>
                      ) : (
                        "Find Grants"
                      )}
                    </span>
                  </button>
                </div>
              </div>
            )}

            {listings.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-gb-muted">
                  Grant Matches
                </h2>
                {listings.map((listing) => (
                  <GrantListingBubble
                    key={listing.id}
                    listing={listing}
                    draftState={drafts[listing.id]}
                    draftDisabled={atLimit}
                    onDraft={handleDraft}
                    onCopyDraft={handleCopyDraft}
                  />
                ))}
              </div>
            )}

            {history.length > 0 && (
              <div className="gb-glass rounded-3xl p-6">
                <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gb-muted">
                  Recent Sessions
                </h2>
                <ul className="space-y-3">
                  {history.map((entry) => (
                    <li key={entry.id}>
                      <button
                        type="button"
                        onClick={() => loadHistoryEntry(entry)}
                        className="w-full rounded-2xl border border-white/10 bg-white/5 p-4 text-left transition hover:border-gb-emerald/40 hover:bg-white/10"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <p className="line-clamp-2 text-sm text-white/90">
                            {entry.mode === "search"
                              ? entry.orgDescription
                              : entry.grantTitle ?? entry.orgDescription}
                          </p>
                          <span className="shrink-0 text-xs text-gb-muted">
                            {new Date(entry.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="mt-2 text-xs text-gb-muted">
                          {entry.mode === "search" ? "Find Grants" : "Application Draft"} ·{" "}
                          {entry.category}
                        </p>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
