"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GrantBotBackground } from "@/components/grantbot/GrantBotBackground";
import { GrantBotNav } from "@/components/grantbot/GrantBotNav";
import { CheckoutButton } from "@/components/billing/CheckoutButton";
import { grantbotPath } from "@/lib/grantbot/auth";
import { isHighestPaidNiTier } from "@/lib/billing/subscription-actions";
import type { NiTier } from "@/lib/billing/ni-tiers";
import type { GrantBotHistoryEntry, GrantBotMode } from "@/lib/grantbot/history";
import { createBrowserClient } from "@supabase/ssr";

const CATEGORIES = [
  "Nonprofit",
  "Creator",
  "Research",
  "Small Business",
  "Arts & Culture",
] as const;

interface Props {
  email: string;
  plan: string;
  planLabel: string;
  grantsUsed: number;
  grantsLimit: number;
  hasUnlimitedAccess: boolean;
  niTier: string;
  initialMode?: GrantBotMode;
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
  plan,
  planLabel,
  grantsUsed,
  grantsLimit,
  hasUnlimitedAccess,
  niTier,
  initialMode,
  initialCategory,
  history: initialHistory,
  gated = false,
  gateContent,
}: Props) {
  const [mode, setMode] = useState<GrantBotMode>(initialMode ?? "search");
  const [orgDescription, setOrgDescription] = useState("");
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>(
    isValidCategory(initialCategory) ? initialCategory : "Nonprofit"
  );
  const [grantTitle, setGrantTitle] = useState("");
  const [funder, setFunder] = useState("");
  const [promptQuestions, setPromptQuestions] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [used, setUsed] = useState(grantsUsed);
  const [history, setHistory] = useState(initialHistory);
  const router = useRouter();
  const supabase = createClient();
  const effectiveLimit = hasUnlimitedAccess ? 999999 : grantsLimit;
  const atLimit = !hasUnlimitedAccess && used >= effectiveLimit;
  const usagePercent = Math.min((used / (effectiveLimit === 999999 ? 1 : effectiveLimit)) * 100, 100);
  const showUpgrade = atLimit && !isHighestPaidNiTier(niTier as NiTier);

  async function handleGenerate() {
    if (!orgDescription.trim()) return;
    if (mode === "draft" && (!grantTitle.trim() || !promptQuestions.trim())) return;

    setLoading(true);
    setError("");
    setResult("");

    const res = await fetch("/api/grantbot/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode,
        orgDescription,
        category,
        grantTitle,
        funder,
        promptQuestions,
      }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Something went wrong");
      return;
    }

    setResult(data.result);
    if (data.usage) setUsed(data.usage.used);
    setHistory((prev) =>
      [
        {
          id: crypto.randomUUID(),
          mode,
          orgDescription,
          category,
          grantTitle: mode === "draft" ? grantTitle : undefined,
          funder: mode === "draft" ? funder : undefined,
          promptQuestions: mode === "draft" ? promptQuestions : undefined,
          resultText: data.result,
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ].slice(0, 50)
    );
  }

  function loadHistoryEntry(entry: GrantBotHistoryEntry) {
    setMode(entry.mode);
    setOrgDescription(entry.orgDescription);
    if (isValidCategory(entry.category)) setCategory(entry.category);
    setGrantTitle(entry.grantTitle ?? "");
    setFunder(entry.funder ?? "");
    setPromptQuestions(entry.promptQuestions ?? "");
    setResult(entry.resultText);
    setError("");
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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

  const canSubmit =
    orgDescription.trim() &&
    (mode === "search" || (grantTitle.trim() && promptQuestions.trim()));

  return (
    <div className="relative min-h-screen">
      <GrantBotBackground />
      <GrantBotNav email={email} planLabel={planLabel} onSignOut={handleSignOut} />

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

            <div className="flex gap-2">
              {(["search", "draft"] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setMode(tab)}
                  className={`flex-1 rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${
                    mode === tab
                      ? "border-gb-emerald/50 bg-gb-emerald/15 text-gb-emerald"
                      : "border-white/10 bg-white/5 text-gb-muted hover:border-white/20"
                  }`}
                >
                  {tab === "search" ? "Find Grants" : "Draft Application"}
                </button>
              ))}
            </div>

            <div className="gb-glass space-y-5 rounded-3xl p-6 shadow-gb-glow">
              <div>
                <label className="mb-2 block text-sm font-medium text-gb-muted">
                  Organization / project description
                </label>
                <textarea
                  value={orgDescription}
                  onChange={(e) => setOrgDescription(e.target.value)}
                  rows={4}
                  placeholder="Describe your mission, audience, location, and what funding would support…"
                  className="w-full resize-none rounded-2xl border border-white/10 bg-gb-bg/80 px-4 py-3 text-sm text-white outline-none transition focus:border-gb-emerald/50 focus:ring-1 focus:ring-gb-emerald/30"
                />
              </div>

              {mode === "search" ? (
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
              ) : (
                <>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gb-muted">Grant name</label>
                      <input
                        value={grantTitle}
                        onChange={(e) => setGrantTitle(e.target.value)}
                        placeholder="e.g. Community Impact Fund"
                        className="w-full rounded-2xl border border-white/10 bg-gb-bg/80 px-4 py-3 text-sm text-white outline-none transition focus:border-gb-emerald/50"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gb-muted">Funder</label>
                      <input
                        value={funder}
                        onChange={(e) => setFunder(e.target.value)}
                        placeholder="e.g. Ford Foundation"
                        className="w-full rounded-2xl border border-white/10 bg-gb-bg/80 px-4 py-3 text-sm text-white outline-none transition focus:border-gb-emerald/50"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gb-muted">
                      Application prompts
                    </label>
                    <textarea
                      value={promptQuestions}
                      onChange={(e) => setPromptQuestions(e.target.value)}
                      rows={4}
                      placeholder="Paste the grant questions or prompts you need answered…"
                      className="w-full resize-none rounded-2xl border border-white/10 bg-gb-bg/80 px-4 py-3 text-sm text-white outline-none transition focus:border-gb-emerald/50 focus:ring-1 focus:ring-gb-emerald/30"
                    />
                  </div>
                </>
              )}

              {error && (
                <p className="rounded-xl border border-gb-amber/30 bg-gb-amber/10 px-4 py-3 text-sm text-gb-amber">
                  {error}
                </p>
              )}

              <button
                onClick={handleGenerate}
                disabled={loading || atLimit || !canSubmit}
                className="relative w-full overflow-hidden rounded-2xl bg-gradient-to-r from-gb-emerald via-gb-teal to-gb-amber py-3.5 font-semibold text-gb-bg shadow-gb-glow transition hover:opacity-95 disabled:opacity-40"
              >
                {loading && <span className="absolute inset-0 gb-shimmer animate-shimmer" />}
                <span className="relative flex items-center justify-center gap-2">
                  {loading ? (
                    <>
                      {[0, 1, 2, 3, 4].map((i) => (
                        <span
                          key={i}
                          className="h-4 w-1 rounded-full bg-gb-bg/80 animate-wave"
                          style={{ animationDelay: `${i * 0.1}s` }}
                        />
                      ))}
                      {mode === "search" ? "Finding Grants…" : "Drafting Application…"}
                    </>
                  ) : mode === "search" ? (
                    "Find Grants"
                  ) : (
                    "Generate Draft"
                  )}
                </span>
              </button>
            </div>

            {result && (
              <div className="gb-glass animate-bubble-in rounded-3xl p-6">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm font-medium text-gb-teal">
                    {mode === "search" ? "Grant matches" : "Application draft"}
                  </span>
                  <button
                    onClick={handleCopy}
                    className="text-sm font-medium text-gb-emerald transition hover:text-gb-teal"
                  >
                    {copied ? "✓ Copied!" : "Copy"}
                  </button>
                </div>
                <div className="whitespace-pre-wrap text-sm leading-relaxed text-white/90">{result}</div>
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
                          {entry.mode === "search" ? "Find Grants" : "Draft"} · {entry.category}
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
