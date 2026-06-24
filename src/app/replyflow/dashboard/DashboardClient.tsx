"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ReplyFlowBackground } from "@/components/replyflow/ReplyFlowBackground";
import { ReplyFlowNav } from "@/components/replyflow/ReplyFlowNav";
import { Sector3LoadingBar } from "@/components/sector3/Sector3LoadingBar";
import { Sector3ToolDashboardFooter } from "@/components/sector3/Sector3ToolHelpModal";
import { CheckoutButton } from "@/components/billing/CheckoutButton";
import { getToolBrand } from "@/lib/constants";
import { getSector3ToolHelpContent } from "@/lib/sector3-tools/help-content";
import { replyflowPath } from "@/lib/replyflow/auth";
import { isHighestPaidNiTier } from "@/lib/billing/subscription-actions";
import type { NiTier } from "@/lib/billing/ni-tiers";
import type { ReplyFlowHistoryEntry } from "@/lib/replyflow/history";
import { createBrowserClient } from "@supabase/ssr";

const TONES = ["Professional", "Friendly", "Empathetic", "Firm"] as const;
const SCENARIOS = [
  { id: "refund", label: "Refund request", icon: "↩" },
  { id: "complaint", label: "Complaint", icon: "!" },
  { id: "shipping", label: "Shipping issue", icon: "📦" },
  { id: "tech", label: "Technical support", icon: "⚙" },
  { id: "general", label: "General inquiry", icon: "💬" },
] as const;

interface Props {
  email: string;
  plan: string;
  planLabel: string;
  repliesUsed: number;
  repliesLimit: number;
  hasUnlimitedAccess: boolean;
  niTier: string;
  initialTone?: string;
  initialScenario?: string;
  history: ReplyFlowHistoryEntry[];
  gated?: boolean;
  gateContent?: React.ReactNode;
}

function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

function isValidTone(value: string | undefined): value is (typeof TONES)[number] {
  return !!value && TONES.includes(value as (typeof TONES)[number]);
}

export default function DashboardClient({
  email,
  plan,
  planLabel,
  repliesUsed,
  repliesLimit,
  hasUnlimitedAccess,
  niTier,
  initialTone,
  initialScenario,
  history: initialHistory,
  gated = false,
  gateContent,
}: Props) {
  const [message, setMessage] = useState("");
  const [tone, setTone] = useState<(typeof TONES)[number]>(
    isValidTone(initialTone) ? initialTone : "Professional"
  );
  const [scenario, setScenario] = useState(initialScenario ?? "General inquiry");
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [used, setUsed] = useState(repliesUsed);
  const [history, setHistory] = useState(initialHistory);
  const router = useRouter();
  const supabase = createClient();
  const effectiveLimit = hasUnlimitedAccess ? 999999 : repliesLimit;
  const atLimit = !hasUnlimitedAccess && used >= effectiveLimit;
  const usagePercent = Math.min((used / (effectiveLimit === 999999 ? 1 : effectiveLimit)) * 100, 100);
  const showUpgrade = atLimit && !isHighestPaidNiTier(niTier as NiTier);

  async function handleGenerate() {
    if (!message.trim()) return;
    setLoading(true);
    setError("");
    setReply("");
    const res = await fetch("/api/replyflow/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, tone, scenario }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Something went wrong");
      return;
    }
    setReply(data.reply);
    if (data.usage) setUsed(data.usage.used);
    setHistory((prev) => [
      {
        id: crypto.randomUUID(),
        customerMessage: message,
        tone,
        scenario,
        generatedReply: data.reply,
        createdAt: new Date().toISOString(),
      },
      ...prev,
    ].slice(0, 50));
  }

  function loadHistoryEntry(entry: ReplyFlowHistoryEntry) {
    setMessage(entry.customerMessage);
    if (isValidTone(entry.tone)) setTone(entry.tone);
    setScenario(entry.scenario);
    setReply(entry.generatedReply);
    setError("");
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(reply);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push(replyflowPath("/"));
  }

  const upgradePayload =
    niTier === "free"
      ? { type: "ni_subscription" as const, tier: "core" as const, interval: "monthly" as const }
      : niTier === "core"
        ? { type: "ni_subscription" as const, tier: "pro" as const, interval: "monthly" as const }
        : niTier === "pro"
          ? { type: "ni_subscription" as const, tier: "power" as const, interval: "monthly" as const }
          : null;

  const replyflowHelp = getSector3ToolHelpContent("replyflow")!;
  const replyflowBrand = getToolBrand("replyflow");

  return (
    <div className="relative min-h-screen">
      <ReplyFlowBackground />
      <ReplyFlowNav email={email} planLabel={planLabel} onSignOut={handleSignOut} />
      <Sector3LoadingBar loading={loading} variant="replyflow" />

      <main className="relative z-10 mx-auto max-w-3xl space-y-6 px-4 py-10">
        {gated && gateContent ? (
          gateContent
        ) : (
          <>
        <div className="rf-glass rounded-2xl p-5">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium text-white/80">Monthly replies</span>
            <span className="text-sm text-rf-muted">
              <span className={atLimit ? "font-semibold text-rf-rose" : "font-semibold text-white"}>
                {used}
              </span>{" "}
              / {effectiveLimit === 999999 ? "∞" : effectiveLimit}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                atLimit
                  ? "bg-gradient-to-r from-rf-rose to-rf-coral"
                  : "bg-gradient-to-r from-rf-violet to-rf-rose"
              }`}
              style={{ width: `${usagePercent}%` }}
            />
          </div>
          {showUpgrade && upgradePayload && (
            <div className="mt-3 flex items-center justify-between gap-4">
              <p className="text-sm text-rf-rose">Limit reached — upgrade to keep going.</p>
              <CheckoutButton
                label="Upgrade Subscription"
                payload={upgradePayload}
                className="rounded-xl bg-gradient-to-r from-rf-rose to-rf-coral px-4 py-1.5 text-sm font-semibold text-white disabled:opacity-50"
              />
            </div>
          )}
        </div>

        <div className="rf-glass space-y-5 rounded-3xl p-6 shadow-rf-violet">
          <div>
            <label className="mb-2 block text-sm font-medium text-rf-muted">Customer message</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              placeholder="Paste the customer message here…"
              className="w-full resize-none rounded-2xl border border-white/10 bg-rf-bg/80 px-4 py-3 text-sm text-white outline-none transition focus:border-rf-rose/50 focus:ring-1 focus:ring-rf-rose/30"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-rf-muted">Tone</label>
            <div className="flex flex-wrap gap-2">
              {TONES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTone(t)}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                    tone === t
                      ? "border border-rf-rose/60 bg-rf-rose/20 text-rf-rose shadow-rf-glow"
                      : "border border-white/10 bg-white/5 text-rf-muted hover:border-rf-violet/40 hover:text-white"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-rf-muted">Scenario</label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {SCENARIOS.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setScenario(s.label)}
                  className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-sm transition ${
                    scenario === s.label
                      ? "border-rf-violet/50 bg-rf-violet/15 text-white"
                      : "border-white/10 bg-white/5 text-rf-muted hover:border-white/20"
                  }`}
                >
                  <span>{s.icon}</span>
                  <span>{s.label}</span>
                </button>
              ))}
            </div>
          </div>

          {error && (
            <p className="rounded-xl border border-rf-rose/30 bg-rf-rose/10 px-4 py-3 text-sm text-rf-rose">
              {error}
            </p>
          )}

          <button
            onClick={handleGenerate}
            disabled={loading || atLimit || !message.trim()}
            className="relative w-full overflow-hidden rounded-2xl bg-gradient-to-r from-rf-rose via-rf-coral to-rf-violet py-3.5 font-semibold text-white shadow-rf-glow transition hover:opacity-95 disabled:opacity-40"
          >
            {loading && <span className="absolute inset-0 rf-shimmer animate-shimmer" />}
            <span className="relative flex items-center justify-center gap-2">
              {loading ? (
                <>
                  {[0, 1, 2, 3, 4].map((i) => (
                    <span
                      key={i}
                      className="h-4 w-1 rounded-full bg-white/80 animate-wave"
                      style={{ animationDelay: `${i * 0.1}s` }}
                    />
                  ))}
                  Crafting Reply…
                </>
              ) : (
                "Generate Reply"
              )}
            </span>
          </button>
        </div>

        {reply && (
          <div className="rf-glass animate-bubble-in rounded-3xl p-6">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-medium text-rf-violet">Generated reply</span>
              <button
                onClick={handleCopy}
                className="text-sm font-medium text-rf-rose transition hover:text-rf-coral"
              >
                {copied ? "✓ Copied!" : "Copy"}
              </button>
            </div>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-white/90">{reply}</p>
          </div>
        )}

        {history.length > 0 && (
          <div className="rf-glass rounded-3xl p-6">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-rf-muted">
              Recent Replies
            </h2>
            <ul className="space-y-3">
              {history.map((entry) => (
                <li key={entry.id}>
                  <button
                    type="button"
                    onClick={() => loadHistoryEntry(entry)}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 p-4 text-left transition hover:border-rf-violet/40 hover:bg-white/10"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="line-clamp-2 text-sm text-white/90">{entry.customerMessage}</p>
                      <span className="shrink-0 text-xs text-rf-muted">
                        {new Date(entry.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-rf-muted">
                      {entry.tone} · {entry.scenario}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <Sector3ToolDashboardFooter
          summary={replyflowHelp.summary}
          slug="replyflow"
          displayName="ReplyFlow"
          brandColor={replyflowBrand.brandColor}
          faqs={replyflowHelp.faqs}
        />
          </>
        )}
      </main>
    </div>
  );
}
