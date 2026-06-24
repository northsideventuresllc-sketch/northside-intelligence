"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sector3ToolBackground } from "@/components/sector3/Sector3ToolBackground";
import { Sector3ToolNav } from "@/components/sector3/Sector3ToolNav";
import { Sector3LoadingBar } from "@/components/sector3/Sector3LoadingBar";
import { Sector3ToolDashboardFooter } from "@/components/sector3/Sector3ToolHelpModal";
import { Sector3ToolResult } from "@/components/sector3/results/Sector3ToolResult";
import { CheckoutButton } from "@/components/billing/CheckoutButton";
import { isHighestPaidNiTier } from "@/lib/billing/subscription-actions";
import type { NiTier } from "@/lib/billing/ni-tiers";
import { getToolBrand } from "@/lib/constants";
import type { Sector3ToolRuntimeConfig, Sector3SessionRow } from "@/lib/sector3-tools/types";
import { createBrowserClient } from "@supabase/ssr";

export interface DashboardField {
  id: string;
  label: string;
  placeholder: string;
  multiline?: boolean;
  required?: boolean;
  chipOptions?: string[];
}

interface Props {
  config: Sector3ToolRuntimeConfig;
  apiPath: string;
  fields: DashboardField[];
  primaryLabel: string;
  history: Sector3SessionRow[];
  email: string;
  planLabel: string;
  usageCount: number;
  usageLimit: number;
  hasUnlimitedAccess: boolean;
  niTier: string;
  gated?: boolean;
  gateContent?: React.ReactNode;
}

function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

function usageUnitLabel(unit: string, count: number): string {
  if (count === 1) return unit.replace(/s$/, "");
  return unit;
}

export function Sector3ToolDashboard({
  config,
  apiPath,
  fields,
  primaryLabel,
  history: initialHistory,
  email,
  planLabel,
  usageCount,
  usageLimit,
  hasUnlimitedAccess,
  niTier,
  gated = false,
  gateContent,
}: Props) {
  const brand = getToolBrand(config.slug);
  const initialValues = Object.fromEntries(
    fields.map((f) => [f.id, f.chipOptions?.[0] ?? ""])
  );

  const [values, setValues] = useState<Record<string, string>>(initialValues);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState("");
  const [lastContext, setLastContext] = useState<Record<string, string>>({});
  const [used, setUsed] = useState(usageCount);
  const [history, setHistory] = useState(initialHistory);
  const router = useRouter();
  const supabase = createClient();

  const effectiveLimit = hasUnlimitedAccess ? 999999 : usageLimit;
  const atLimit = !hasUnlimitedAccess && used >= effectiveLimit;
  const usagePercent = Math.min(
    (used / (effectiveLimit === 999999 ? 1 : effectiveLimit)) * 100,
    100
  );
  const showUpgrade = atLimit && !isHighestPaidNiTier(niTier as NiTier);

  const upgradePayload =
    niTier === "free"
      ? { type: "ni_subscription" as const, tier: "core" as const, interval: "monthly" as const }
      : niTier === "core"
        ? { type: "ni_subscription" as const, tier: "pro" as const, interval: "monthly" as const }
        : niTier === "pro"
          ? { type: "ni_subscription" as const, tier: "power" as const, interval: "monthly" as const }
          : null;

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.refresh();
  }

  async function handleGenerate() {
    for (const field of fields) {
      if (field.required !== false && !values[field.id]?.trim()) {
        setError(`Please fill in ${field.label}.`);
        return;
      }
    }
    if (atLimit) return;

    setLoading(true);
    setError("");
    setResult("");

    const res = await fetch(apiPath, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    const data = (await res.json().catch(() => ({}))) as {
      error?: string;
      result?: string;
      usageCount?: number;
    };

    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Generation failed");
      return;
    }

    setResult(data.result ?? "");
    setLastContext({ ...values });
    if (typeof data.usageCount === "number") setUsed(data.usageCount);

    const summary =
      fields
        .map((f) => values[f.id]?.trim())
        .filter(Boolean)
        .join(" · ")
        .slice(0, 120) || primaryLabel;

    setHistory((prev) =>
      [
        {
          id: crypto.randomUUID(),
          input_summary: summary,
          result_text: data.result ?? "",
          created_at: new Date().toISOString(),
        },
        ...prev,
      ].slice(0, 20)
    );
  }

  const glassStyle = {
    boxShadow: `0 0 40px ${brand.brandColor}22`,
  };

  return (
    <div className="relative min-h-screen overflow-hidden text-white">
      <Sector3ToolBackground slug={config.slug} />
      <Sector3ToolNav
        config={config}
        email={email}
        planLabel={planLabel}
        onSignOut={handleSignOut}
      />
      <Sector3LoadingBar loading={loading} />

      <main className="relative z-10 mx-auto max-w-3xl space-y-6 px-4 py-10">
        {gated && gateContent ? (
          gateContent
        ) : (
          <>
            <div
              className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl"
              style={glassStyle}
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-medium text-white/80">
                  Monthly {usageUnitLabel(config.usageUnit, 2)}
                </span>
                <span className="text-sm text-white/50">
                  <span
                    className="font-semibold"
                    style={{ color: atLimit ? "#fbbf24" : "white" }}
                  >
                    {used}
                  </span>{" "}
                  / {effectiveLimit === 999999 ? "∞" : effectiveLimit}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${usagePercent}%`,
                    background: atLimit
                      ? "linear-gradient(to right, #fbbf24, #f97316)"
                      : `linear-gradient(to right, ${brand.brandColor}, ${brand.brandColor}99)`,
                  }}
                />
              </div>
              {showUpgrade && upgradePayload && (
                <div className="mt-3 flex items-center justify-between gap-4">
                  <p className="text-sm text-amber-300">Limit reached — upgrade to keep going.</p>
                  <CheckoutButton
                    label="Upgrade Subscription"
                    payload={upgradePayload}
                    className="rounded-xl px-4 py-1.5 text-sm font-semibold text-[#07080C] disabled:opacity-50"
                  />
                </div>
              )}
            </div>

            <div
              className="space-y-5 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl"
              style={glassStyle}
            >
              {fields.map((field) => (
                <div key={field.id}>
                  <label className="mb-2 block text-sm font-medium text-white/60">
                    {field.label}
                  </label>
                  {field.chipOptions ? (
                    <div className="flex flex-wrap gap-2">
                      {field.chipOptions.map((option) => {
                        const selected = values[field.id] === option;
                        return (
                          <button
                            key={option}
                            type="button"
                            onClick={() =>
                              setValues((v) => ({ ...v, [field.id]: option }))
                            }
                            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                              selected
                                ? "border text-white shadow-lg"
                                : "border border-white/10 bg-white/5 text-white/60 hover:border-white/20 hover:text-white"
                            }`}
                            style={
                              selected
                                ? {
                                    borderColor: `${brand.brandColor}99`,
                                    backgroundColor: `${brand.brandColor}22`,
                                    color: brand.brandColor,
                                    boxShadow: `0 0 24px ${brand.brandColor}33`,
                                  }
                                : undefined
                            }
                          >
                            {option}
                          </button>
                        );
                      })}
                    </div>
                  ) : field.multiline ? (
                    <textarea
                      value={values[field.id] ?? ""}
                      onChange={(e) =>
                        setValues((v) => ({ ...v, [field.id]: e.target.value }))
                      }
                      placeholder={field.placeholder}
                      rows={5}
                      className="w-full resize-none rounded-2xl border border-white/10 bg-[#07080C]/80 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-white/25"
                    />
                  ) : (
                    <input
                      value={values[field.id] ?? ""}
                      onChange={(e) =>
                        setValues((v) => ({ ...v, [field.id]: e.target.value }))
                      }
                      placeholder={field.placeholder}
                      className="w-full rounded-2xl border border-white/10 bg-[#07080C]/80 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/30 focus:ring-1"
                    />
                  )}
                </div>
              ))}

              {error && (
                <p className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
                  {error}
                </p>
              )}

              {showUpgrade && !upgradePayload && (
                <p className="text-sm text-amber-300">
                  Limit reached —{" "}
                  <Link href={`${config.basePath}#pricing`} className="underline">
                    Upgrade Your Plan
                  </Link>
                </p>
              )}

              <button
                type="button"
                onClick={handleGenerate}
                disabled={loading || atLimit}
                className="relative w-full overflow-hidden rounded-2xl py-3.5 font-semibold text-[#07080C] transition hover:opacity-95 disabled:opacity-40"
                style={{
                  background: `linear-gradient(to right, ${brand.brandColor}, ${brand.brandColor}cc)`,
                  boxShadow: `0 0 32px ${brand.brandColor}44`,
                }}
              >
                {loading ? "Generating…" : primaryLabel}
              </button>
            </div>

            {result && (
              <Sector3ToolResult
                slug={config.slug}
                result={result}
                brandColor={brand.brandColor}
                sourceSystem={lastContext.sourceSystem}
                targetSystem={lastContext.targetSystem}
              />
            )}

            {history.length > 0 && (
              <div
                className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl"
                style={glassStyle}
              >
                <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white/50">
                  Recent Sessions
                </h2>
                <ul className="space-y-3">
                  {history.map((item) => (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => setResult(item.result_text)}
                        className="w-full rounded-2xl border border-white/10 bg-white/5 p-4 text-left transition hover:border-white/20 hover:bg-white/10"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <p className="line-clamp-2 text-sm text-white/90">
                            {item.input_summary}
                          </p>
                          <span className="shrink-0 text-xs text-white/40">
                            {new Date(item.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <Sector3ToolDashboardFooter
              summary={config.summary}
              slug={config.slug}
              displayName={config.displayName}
              brandColor={brand.brandColor}
              faqs={config.faqs}
            />
          </>
        )}
      </main>
    </div>
  );
}
