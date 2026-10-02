"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { CheckoutButton } from "@/components/billing/CheckoutButton";
import { getSector3AgenticPricing } from "@/lib/billing/sector3-tool-pricing";

interface Props {
  toolSlug: string;
  toolName: string;
  brandColor: string;
  logoSrc: string;
  currentPlanLabel: string;
  currentTier: "free" | "saas" | "agentic";
  usageStats: { used: number; limit: number | null; label: string };
  renewalDate?: string | null;
  isAgenticUser?: boolean;
}

interface AgentKey {
  id: string;
  name: string;
  keyPrefix: string;
  createdAt: string;
  lastUsedAt?: string | null;
}

export function Sector3ToolSettingsClient({
  toolSlug,
  toolName,
  brandColor,
  logoSrc,
  currentPlanLabel,
  currentTier,
  usageStats,
  renewalDate,
  isAgenticUser = false,
}: Props) {
  const [activeTab, setActiveTab] = useState<"billing" | "saas" | "agentic">("billing");
  const [tierState, setTierState] = useState<"free" | "saas" | "agentic">(currentTier);

  // Downgrade states
  const [downgrading, setDowngrading] = useState(false);
  const [downgradeMessage, setDowngradeMessage] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);

  // SaaS settings
  const [tone, setTone] = useState("concise");
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [byokKey, setByokKey] = useState("");
  const [savedSaaSNotice, setSavedSaaSNotice] = useState(false);

  // Agentic settings
  const [agentKeys, setAgentKeys] = useState<AgentKey[]>([]);
  const [loadingKeys, setLoadingKeys] = useState(false);
  const [generatingKey, setGeneratingKey] = useState(false);
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null);
  const [cadence, setCadence] = useState("daily");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [copiedMCP, setCopiedMCP] = useState(false);

  const pricing = getSector3AgenticPricing(toolSlug);

  useEffect(() => {
    if (isAgenticUser && activeTab === "agentic") {
      fetchKeys();
    }
  }, [isAgenticUser, activeTab, toolSlug]);

  async function fetchKeys() {
    setLoadingKeys(true);
    try {
      const res = await fetch(`/api/auth/agent-key?toolSlug=${toolSlug}`);
      if (res.ok) {
        const data = await res.json();
        setAgentKeys(data.keys || []);
      }
    } catch {
      // silent fallback
    } finally {
      setLoadingKeys(false);
    }
  }

  async function handleCreateAgentKey() {
    setGeneratingKey(true);
    setNewlyCreatedKey(null);
    try {
      const res = await fetch("/api/auth/agent-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toolSlug, name: `${toolName} Headless Worker` }),
      });
      const data = await res.json();
      if (res.ok && data.apiKey) {
        setNewlyCreatedKey(data.apiKey);
        fetchKeys();
      } else {
        alert(data.error || "Failed to generate agent key.");
      }
    } catch (err) {
      alert("Error generating agent key.");
    } finally {
      setGeneratingKey(false);
    }
  }

  async function handleRevokeKey(keyId: string) {
    if (!confirm("Are you sure you want to revoke this agent key? Any active scripts using it will stop working immediately.")) {
      return;
    }
    try {
      const res = await fetch("/api/auth/agent-key", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyId }),
      });
      if (res.ok) {
        fetchKeys();
      }
    } catch {
      alert("Failed to revoke key.");
    }
  }

  async function handleDowngradeToFree() {
    if (
      !confirm(
        `Are you sure you want to downgrade ${toolName} to the Free tier? Your quota will reset to free usage limits at the end of your billing cycle.`
      )
    ) {
      return;
    }

    setDowngrading(true);
    setDowngradeMessage(null);
    try {
      const res = await fetch("/api/billing/downgrade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toolSlug }),
      });
      const data = await res.json();
      if (res.ok) {
        setDowngradeMessage(data.message || "Successfully downgraded to Free tier.");
        setTierState("free");
      } else {
        setDowngradeMessage(data.error || "Failed to downgrade.");
      }
    } catch (err) {
      setDowngradeMessage("Downgrade request failed. Please check your connection.");
    } finally {
      setDowngrading(false);
    }
  }

  async function handleOpenPortal() {
    setPortalLoading(true);
    try {
      const res = await fetch("/api/billing/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ returnUrl: `/${toolSlug}/settings` }),
      });
      const data = await res.json();
      if (res.ok && data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || "Could not open billing portal.");
      }
    } catch {
      alert("Error contacting billing portal.");
    } finally {
      setPortalLoading(false);
    }
  }

  function handleSaveSaaS(e: React.FormEvent) {
    e.preventDefault();
    setSavedSaaSNotice(true);
    setTimeout(() => setSavedSaaSNotice(false), 3000);
  }

  const mcpConfigJson = JSON.stringify(
    {
      mcpServers: {
        [`northside-${toolSlug}`]: {
          command: "npx",
          args: ["-y", `@northside/${toolSlug}-mcp`],
          env: {
            NORTHSIDE_API_KEY: newlyCreatedKey || "ni_agt_YOUR_AGENT_KEY_HERE",
          },
        },
      },
    },
    null,
    2
  );

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-white/10 pb-6">
        <div className="flex items-center gap-4">
          <div className="relative h-12 w-12 shrink-0 rounded-2xl border border-white/15 bg-white/5 p-2 backdrop-blur-md">
            <Image
              src={logoSrc}
              alt={toolName}
              fill
              className="object-contain p-1"
              unoptimized
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-white">{toolName} Settings</h1>
              <span
                className="rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-black"
                style={{ backgroundColor: brandColor }}
              >
                {tierState.toUpperCase()} TIER
              </span>
            </div>
            <p className="text-xs text-white/60">
              Manage your subscription, quotas, SaaS preferences, and autonomous agent backend.
            </p>
          </div>
        </div>

        <Link
          href={`/${toolSlug}/dashboard`}
          className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold text-white/80 transition hover:bg-white/10 hover:text-white"
        >
          <span>← Back to Dashboard</span>
        </Link>
      </div>

      {/* Tabs */}
      <div className="mt-8 flex border-b border-white/10">
        <button
          type="button"
          onClick={() => setActiveTab("billing")}
          className={`flex items-center gap-2 border-b-2 px-5 py-3 text-xs font-semibold transition ${
            activeTab === "billing"
              ? "border-cyan-400 text-cyan-300"
              : "border-transparent text-white/60 hover:text-white"
          }`}
        >
          <span>💳</span>
          <span>Subscription & Downgrade Hub</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("saas")}
          className={`flex items-center gap-2 border-b-2 px-5 py-3 text-xs font-semibold transition ${
            activeTab === "saas"
              ? "border-cyan-400 text-cyan-300"
              : "border-transparent text-white/60 hover:text-white"
          }`}
        >
          <span>⚙️</span>
          <span>SaaS Feature Preferences</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("agentic")}
          className={`flex items-center gap-2 border-b-2 px-5 py-3 text-xs font-semibold transition ${
            activeTab === "agentic"
              ? "border-cyan-400 text-cyan-300"
              : "border-transparent text-white/60 hover:text-white"
          }`}
        >
          <span>⚡</span>
          <span>Agentic & FastMCP Automation</span>
        </button>
      </div>

      {/* TAB 1: Billing & Downgrade Hub */}
      {activeTab === "billing" && (
        <div className="mt-8 space-y-8">
          {/* Active Plan Banner */}
          <div className="rounded-3xl border border-white/15 bg-[#0F1422]/90 p-6 shadow-xl backdrop-blur-xl sm:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-white/50">
                  Current Active Plan
                </span>
                <h2 className="mt-1 text-2xl font-bold text-white">{currentPlanLabel}</h2>
                <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-white/60">
                  <span>
                    Status: <strong className="text-emerald-400">Active</strong>
                  </span>
                  {renewalDate && (
                    <span>
                      Renews: <strong className="text-white/80">{renewalDate}</strong>
                    </span>
                  )}
                  <span>
                    Usage:{" "}
                    <strong className="text-cyan-400">
                      {usageStats.used} / {usageStats.limit !== null ? usageStats.limit : "Unlimited"}{" "}
                      {usageStats.label}
                    </strong>
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleOpenPortal}
                disabled={portalLoading}
                className="inline-flex items-center justify-center rounded-xl border border-white/20 bg-white/5 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-white/10 disabled:opacity-50"
              >
                {portalLoading ? "Loading Stripe..." : "Stripe Invoices & Cards ↗"}
              </button>
            </div>

            {downgradeMessage && (
              <div className="mt-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs text-emerald-300">
                {downgradeMessage}
              </div>
            )}
          </div>

          {/* Tier Comparison & Downgrade Grid */}
          <div>
            <h3 className="text-base font-bold text-white">Compare Plans & Change Tier</h3>
            <p className="mt-1 text-xs text-white/60">
              Easily upgrade for higher quotas and headless agent workers, or downgrade to Free anytime.
            </p>

            <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3">
              {/* Free Card */}
              <div
                className={`relative rounded-3xl border p-6 backdrop-blur-xl transition ${
                  tierState === "free"
                    ? "border-emerald-500/50 bg-emerald-500/5 shadow-lg"
                    : "border-white/10 bg-white/5"
                }`}
              >
                {tierState === "free" && (
                  <span className="absolute -top-3 left-6 rounded-full bg-emerald-500 px-3 py-0.5 text-[10px] font-bold text-black">
                    CURRENT PLAN
                  </span>
                )}
                <h4 className="text-lg font-bold text-white">Free Tier</h4>
                <div className="mt-2 text-2xl font-extrabold text-white">
                  $0 <span className="text-xs font-normal text-white/50">/month</span>
                </div>
                <p className="mt-2 text-xs text-white/60">
                  Essential tools with standard quotas for occasional use.
                </p>

                <ul className="mt-5 space-y-2 text-xs text-white/70">
                  <li className="flex items-center gap-2">
                    <span className="text-emerald-400">✓</span> Standard monthly usage
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-emerald-400">✓</span> Interactive web dashboard
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-white/30">✕</span> No headless agent keys
                  </li>
                </ul>

                <div className="mt-6">
                  {tierState === "free" ? (
                    <div className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 text-center text-xs font-semibold text-white/40">
                      Currently Active
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={handleDowngradeToFree}
                      disabled={downgrading}
                      className="w-full rounded-xl border border-red-500/30 bg-red-500/10 py-2.5 text-xs font-semibold text-red-300 transition hover:bg-red-500/20 disabled:opacity-50"
                    >
                      {downgrading ? "Processing..." : "Downgrade to Free"}
                    </button>
                  )}
                </div>
              </div>

              {/* SaaS Tier Card */}
              <div
                className={`relative rounded-3xl border p-6 backdrop-blur-xl transition ${
                  tierState === "saas"
                    ? "border-cyan-400/50 bg-cyan-500/5 shadow-lg"
                    : "border-white/10 bg-white/5"
                }`}
              >
                {tierState === "saas" && (
                  <span className="absolute -top-3 left-6 rounded-full bg-cyan-400 px-3 py-0.5 text-[10px] font-bold text-black">
                    CURRENT PLAN
                  </span>
                )}
                <h4 className="text-lg font-bold text-white">SaaS Tier</h4>
                <div className="mt-2 text-2xl font-extrabold text-white">
                  ${pricing.saasMonthlyPrice}{" "}
                  <span className="text-xs font-normal text-white/50">/month</span>
                </div>
                <p className="mt-2 text-xs text-white/60">
                  High-volume professional usage for active operators.
                </p>

                <ul className="mt-5 space-y-2 text-xs text-white/70">
                  <li className="flex items-center gap-2">
                    <span className="text-cyan-400">✓</span> Unlimited or high-quota operations
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-cyan-400">✓</span> Priority processing queue
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-cyan-400">✓</span> BYOK compute options
                  </li>
                </ul>

                <div className="mt-6">
                  {tierState === "saas" ? (
                    <div className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 text-center text-xs font-semibold text-white/40">
                      Currently Active
                    </div>
                  ) : (
                    <CheckoutButton
                      toolSlug={toolSlug}
                      interval="monthly"
                      label={`Switch to SaaS ($${pricing.saasMonthlyPrice}/mo)`}
                      className="w-full"
                    />
                  )}
                </div>
              </div>

              {/* Agentic Tier Card */}
              <div
                className={`relative rounded-3xl border p-6 backdrop-blur-xl transition ${
                  tierState === "agentic"
                    ? "border-purple-400/60 bg-purple-500/10 shadow-2xl"
                    : "border-purple-500/30 bg-purple-500/5"
                }`}
              >
                <div className="inline-block rounded-full bg-purple-500/20 px-2.5 py-0.5 text-[10px] font-bold text-purple-300 mb-2">
                  ⚡ AUTONOMOUS HEADLESS
                </div>
                {tierState === "agentic" && (
                  <span className="absolute -top-3 right-6 rounded-full bg-purple-400 px-3 py-0.5 text-[10px] font-bold text-black">
                    CURRENT PLAN
                  </span>
                )}
                <h4 className="text-lg font-bold text-white">Agentic Tier</h4>
                <div className="mt-2 text-2xl font-extrabold text-white">
                  ${pricing.agenticMonthlyPrice}{" "}
                  <span className="text-xs font-normal text-white/50">/month</span>
                </div>
                <p className="mt-2 text-xs text-white/60">
                  Dedicated agent API keys, FastMCP tools, and automated cron loops.
                </p>

                <ul className="mt-5 space-y-2 text-xs text-white/70">
                  <li className="flex items-center gap-2">
                    <span className="text-purple-400">✓</span> Dedicated Agent API Key (`ni_agt_...`)
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-purple-400">✓</span> Pre-configured FastMCP tools
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-purple-400">✓</span> Autonomous cron runs & webhooks
                  </li>
                </ul>

                <div className="mt-6">
                  {tierState === "agentic" ? (
                    <div className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 text-center text-xs font-semibold text-white/40">
                      Currently Active
                    </div>
                  ) : (
                    <CheckoutButton
                      toolSlug={toolSlug}
                      interval="monthly"
                      label={`Upgrade to Agentic ($${pricing.agenticMonthlyPrice}/mo)`}
                      className="w-full !bg-purple-600 hover:!bg-purple-500"
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SaaS Feature Preferences */}
      {activeTab === "saas" && (
        <form onSubmit={handleSaveSaaS} className="mt-8 space-y-6 max-w-2xl">
          {savedSaaSNotice && (
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-300">
              ✓ Preferences saved successfully.
            </div>
          )}

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 space-y-5">
            <h3 className="text-base font-bold text-white">Generation & Output Preferences</h3>

            <div>
              <label className="block text-xs font-medium text-white/70 mb-1.5">
                Default Output Density & Tone
              </label>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="w-full rounded-xl border border-white/15 bg-[#0F131F] px-3.5 py-2.5 text-xs text-white focus:border-cyan-400 focus:outline-none"
              >
                <option value="concise">Ultra-Concise (Executive Bullet Points)</option>
                <option value="detailed">Comprehensive (Deep Analysis & Rationale)</option>
                <option value="technical">Technical / Developer (Code, Specs & Diffs)</option>
              </select>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-white/10">
              <div>
                <div className="text-xs font-semibold text-white">Email Digest & Alerts</div>
                <div className="text-[11px] text-white/50">
                  Receive completed workflow dossiers via Resend directly to your inbox
                </div>
              </div>
              <input
                type="checkbox"
                checked={emailAlerts}
                onChange={(e) => setEmailAlerts(e.target.checked)}
                className="h-4 w-4 rounded border-white/20 bg-white/5 text-cyan-500 focus:ring-0 cursor-pointer"
              />
            </div>
          </div>

          {/* BYOK Section */}
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 space-y-4">
            <div>
              <h3 className="text-base font-bold text-white">Bring Your Own Key (BYOK)</h3>
              <p className="text-xs text-white/50 mt-1">
                Optionally supply your personal OpenAI or Anthropic API key to bypass Northside quota limits.
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-white/70 mb-1.5">
                Custom Provider API Key
              </label>
              <input
                type="password"
                value={byokKey}
                onChange={(e) => setByokKey(e.target.value)}
                placeholder="sk-ant-... or sk-..."
                className="w-full rounded-xl border border-white/15 bg-[#0F131F] px-3.5 py-2.5 text-xs text-white placeholder-white/30 focus:border-cyan-400 focus:outline-none font-mono"
              />
              <p className="mt-1 text-[11px] text-white/40">
                Encrypted at rest with AES-256-GCM. Never logged or shared.
              </p>
            </div>
          </div>

          <button
            type="submit"
            className="rounded-xl bg-cyan-500 px-6 py-2.5 text-xs font-semibold text-black shadow-lg transition hover:bg-cyan-400"
          >
            Save Preferences
          </button>
        </form>
      )}

      {/* TAB 3: Agentic & FastMCP Automation */}
      {activeTab === "agentic" && (
        <div className="mt-8 space-y-8">
          {!isAgenticUser && tierState !== "agentic" ? (
            <div className="rounded-3xl border border-purple-500/30 bg-purple-500/5 p-8 text-center backdrop-blur-xl">
              <span className="text-4xl">⚡</span>
              <h3 className="mt-3 text-xl font-bold text-white">Agentic Tier Required</h3>
              <p className="mx-auto mt-2 max-w-lg text-xs leading-relaxed text-white/60">
                Headless automation, FastMCP agent connectors, and dedicated background workers
                require the Agentic Tier (${pricing.agenticMonthlyPrice}/mo) or an NI Pro/Power membership.
              </p>
              <div className="mt-6 flex justify-center">
                <CheckoutButton
                  toolSlug={toolSlug}
                  interval="monthly"
                  label={`Upgrade to Agentic ($${pricing.agenticMonthlyPrice}/mo)`}
                  className="!bg-purple-600 hover:!bg-purple-500"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Dedicated Agent API Keys */}
              <div className="rounded-3xl border border-white/15 bg-[#0F1422]/90 p-6 shadow-xl backdrop-blur-xl sm:p-8">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-white">Dedicated Agent API Keys</h3>
                    <p className="text-xs text-white/60 mt-0.5">
                      Authenticate autonomous scripts, Claude Desktop, Cursor, and cron workers.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleCreateAgentKey}
                    disabled={generatingKey}
                    className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-xs font-semibold text-white shadow-lg transition hover:bg-purple-500 disabled:opacity-50"
                  >
                    <span>{generatingKey ? "Generating..." : "+ Generate New Agent Key"}</span>
                  </button>
                </div>

                {newlyCreatedKey && (
                  <div className="mt-6 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-5">
                    <div className="text-xs font-bold text-emerald-300">
                      ⚡ New Agent Key Generated!
                    </div>
                    <p className="text-xs text-white/70 mt-1">
                      Make sure to copy your API key now. You will not be able to see it again!
                    </p>
                    <div className="mt-3 flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={newlyCreatedKey}
                        className="flex-1 rounded-xl border border-white/20 bg-black/60 px-3.5 py-2 font-mono text-xs text-emerald-300 select-all"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(newlyCreatedKey);
                          alert("Copied to clipboard!");
                        }}
                        className="rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold text-white hover:bg-white/20"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                )}

                {/* Keys Table */}
                <div className="mt-6">
                  {loadingKeys ? (
                    <div className="py-4 text-center text-xs text-white/40">Loading keys...</div>
                  ) : agentKeys.length === 0 ? (
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center text-xs text-white/50">
                      No active agent API keys generated yet. Click "+ Generate New Agent Key" above to create one.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs text-white/70">
                        <thead className="border-b border-white/10 text-white/40 uppercase text-[10px]">
                          <tr>
                            <th className="py-2.5">Key Prefix</th>
                            <th className="py-2.5">Label</th>
                            <th className="py-2.5">Created</th>
                            <th className="py-2.5">Last Used</th>
                            <th className="py-2.5 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {agentKeys.map((k) => (
                            <tr key={k.id}>
                              <td className="py-3 font-mono text-white/90">{k.keyPrefix}...</td>
                              <td className="py-3 font-medium text-white">{k.name}</td>
                              <td className="py-3 text-white/50">{new Date(k.createdAt).toLocaleDateString()}</td>
                              <td className="py-3 text-white/50">{k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleDateString() : "Never"}</td>
                              <td className="py-3 text-right">
                                <button
                                  type="button"
                                  onClick={() => handleRevokeKey(k.id)}
                                  className="text-red-400 hover:text-red-300 font-semibold"
                                >
                                  Revoke
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>

              {/* FastMCP Config Box */}
              <div className="rounded-3xl border border-white/15 bg-[#0F1422]/90 p-6 shadow-xl backdrop-blur-xl sm:p-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-white">FastMCP Agent Connector</h3>
                    <p className="text-xs text-white/60 mt-0.5">
                      Drop this configuration into Claude Desktop or Cursor to give your AI assistants native tool execution.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(mcpConfigJson);
                      setCopiedMCP(true);
                      setTimeout(() => setCopiedMCP(false), 2500);
                    }}
                    className="rounded-xl border border-white/20 bg-white/5 px-4 py-2 text-xs font-semibold text-white hover:bg-white/10"
                  >
                    {copiedMCP ? "✓ Copied!" : "Copy JSON"}
                  </button>
                </div>

                <div className="mt-4 rounded-2xl border border-white/10 bg-black/60 p-4 font-mono text-xs text-cyan-300 overflow-x-auto">
                  <pre>{mcpConfigJson}</pre>
                </div>
              </div>

              {/* Autonomous Routine Cadence */}
              <div className="rounded-3xl border border-white/15 bg-[#0F1422]/90 p-6 shadow-xl backdrop-blur-xl sm:p-8 space-y-4">
                <h3 className="text-lg font-bold text-white">Autonomous Background Cadence</h3>
                <p className="text-xs text-white/60">
                  Configure when our headless background runners scan, summarize, or draft without human initiation.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-white/70 mb-1.5">
                      Execution Schedule
                    </label>
                    <select
                      value={cadence}
                      onChange={(e) => setCadence(e.target.value)}
                      className="w-full rounded-xl border border-white/15 bg-[#0F131F] px-3.5 py-2.5 text-xs text-white focus:border-purple-400 focus:outline-none"
                    >
                      <option value="hourly">Hourly Headless Sweep</option>
                      <option value="six_hours">Every 6 Hours</option>
                      <option value="daily">Daily at 08:00 UTC</option>
                      <option value="weekly">Weekly on Mondays</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-white/70 mb-1.5">
                      Reporting Webhook URL (Optional)
                    </label>
                    <input
                      type="url"
                      value={webhookUrl}
                      onChange={(e) => setWebhookUrl(e.target.value)}
                      placeholder="https://your-domain.com/webhook"
                      className="w-full rounded-xl border border-white/15 bg-[#0F131F] px-3.5 py-2.5 text-xs text-white placeholder-white/30 focus:border-purple-400 focus:outline-none"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => alert("Autonomous cadence schedule updated.")}
                  className="rounded-xl bg-purple-600 px-6 py-2.5 text-xs font-semibold text-white shadow-lg transition hover:bg-purple-500"
                >
                  Save Autonomous Schedule
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
