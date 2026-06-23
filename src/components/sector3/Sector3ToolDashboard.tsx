"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sector3ToolBackground } from "@/components/sector3/Sector3ToolBackground";
import { Sector3ToolNav } from "@/components/sector3/Sector3ToolNav";
import { Sector3LoadingBar } from "@/components/sector3/Sector3LoadingBar";
import { isHighestPaidNiTier } from "@/lib/billing/subscription-actions";
import type { NiTier } from "@/lib/billing/ni-tiers";
import type { Sector3ToolRuntimeConfig, Sector3SessionRow } from "@/lib/sector3-tools/types";
import { createBrowserClient } from "@supabase/ssr";

export interface DashboardField {
  id: string;
  label: string;
  placeholder: string;
  multiline?: boolean;
  required?: boolean;
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
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(fields.map((f) => [f.id, ""]))
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState("");
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
    if (typeof data.usageCount === "number") setUsed(data.usageCount);

    const summary =
      fields
        .map((f) => values[f.id]?.trim())
        .filter(Boolean)
        .join(" · ")
        .slice(0, 120) || primaryLabel;

    setHistory((prev) => [
      {
        id: crypto.randomUUID(),
        input_summary: summary,
        result_text: data.result ?? "",
        created_at: new Date().toISOString(),
      },
      ...prev,
    ].slice(0, 20));
  }

  return (
    <div className="relative min-h-screen overflow-hidden text-white">
      <Sector3ToolBackground slug={config.slug} />
      <Sector3ToolNav
        config={config}
        email={email}
        planLabel={planLabel}
        onSignOut={handleSignOut}
      />

      <main className="relative z-10 mx-auto max-w-5xl px-6 py-10">
        {gated && gateContent ? (
          <div className="py-16">{gateContent}</div>
        ) : (
          <>
            <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold">{config.displayName} Dashboard</h1>
                <p className="mt-1 text-sm text-white/60">
                  {hasUnlimitedAccess
                    ? "Unlimited usage"
                    : `${used} / ${usageLimit} ${config.usageUnit} this month`}
                </p>
              </div>
              {!hasUnlimitedAccess && (
                <div className="h-2 w-48 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-sky-400 transition-all"
                    style={{ width: `${usagePercent}%` }}
                  />
                </div>
              )}
            </div>

            <div className="grid gap-8 lg:grid-cols-5">
              <div className="space-y-4 lg:col-span-3">
                {fields.map((field) => (
                  <div key={field.id}>
                    <label className="mb-2 block text-sm font-medium text-white/80">
                      {field.label}
                    </label>
                    {field.multiline ? (
                      <textarea
                        value={values[field.id] ?? ""}
                        onChange={(e) =>
                          setValues((v) => ({ ...v, [field.id]: e.target.value }))
                        }
                        placeholder={field.placeholder}
                        rows={5}
                        className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-sky-400/50 focus:outline-none"
                      />
                    ) : (
                      <input
                        value={values[field.id] ?? ""}
                        onChange={(e) =>
                          setValues((v) => ({ ...v, [field.id]: e.target.value }))
                        }
                        placeholder={field.placeholder}
                        className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-sky-400/50 focus:outline-none"
                      />
                    )}
                  </div>
                ))}

                {error && (
                  <p className="text-sm text-rose-400">{error}</p>
                )}

                {showUpgrade && (
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
                  className="w-full rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-500 px-6 py-3.5 font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
                >
                  {loading ? "Generating…" : primaryLabel}
                </button>

                <Sector3LoadingBar loading={loading} />

                {result && (
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                    <p className="mb-3 text-xs font-medium uppercase tracking-widest text-white/50">
                      Result
                    </p>
                    <div className="prose prose-invert max-w-none whitespace-pre-wrap text-sm text-white/90">
                      {result}
                    </div>
                  </div>
                )}
              </div>

              <aside className="lg:col-span-2">
                <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-white/50">
                  Recent Runs
                </h2>
                <div className="space-y-3">
                  {history.length === 0 ? (
                    <p className="text-sm text-white/40">No runs yet.</p>
                  ) : (
                    history.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setResult(item.result_text)}
                        className="w-full rounded-xl border border-white/10 bg-white/5 p-4 text-left transition hover:border-white/20"
                      >
                        <p className="text-xs text-white/40">
                          {new Date(item.created_at).toLocaleString()}
                        </p>
                        <p className="mt-1 line-clamp-2 text-sm text-white/80">
                          {item.input_summary}
                        </p>
                      </button>
                    ))
                  )}
                </div>
              </aside>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
