"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { INTELLIGENCE_TOOLS } from "@/lib/constants";
import type { ToolkitEntry } from "@/lib/billing/entitlements";
import { NI_TIERS, type NiTier } from "@/lib/billing/ni-tiers";

interface ToolkitGridProps {
  toolkit: ToolkitEntry[];
  niTier: NiTier;
  toolSlotsUsed: number;
  toolSlotLimit: number | null;
  canAddNiPlanTool: boolean;
  availableToAdd: string[];
  isMasterAccount?: boolean;
}

function accessLabel(type: ToolkitEntry["accessType"], isMasterAccount?: boolean): string {
  if (isMasterAccount && type === "lifetime") return "Master Access";
  if (type === "lifetime") return "Lifetime";
  if (type === "ni_plan") return "NI Plan";
  return "Subscription";
}

export function ToolkitGrid({
  toolkit,
  niTier,
  toolSlotsUsed,
  toolSlotLimit,
  canAddNiPlanTool,
  availableToAdd,
  isMasterAccount = false,
}: ToolkitGridProps) {
  const [adding, setAdding] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const ownedSlugs = new Set(toolkit.map((t) => t.toolSlug));
  const tierConfig = NI_TIERS[niTier];

  async function addTool(toolSlug: string) {
    setAdding(toolSlug);
    setError("");
    setMessage("");
    try {
      const res = await fetch("/api/billing/toolkit/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toolSlug }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Could not add tool");
        return;
      }
      setMessage("Tool added to your Toolkit. Refreshing…");
      window.location.reload();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setAdding(null);
    }
  }

  return (
    <div className="space-y-8">
      <section className="glass-panel p-6">
        <h2 className="mb-2 text-lg font-semibold text-white">Your NI Plan</h2>
        {isMasterAccount ? (
          <>
            <p className="text-2xl font-bold text-white">Master Account</p>
            <p className="mt-1 text-sm text-ni-muted">
              Permanent unlimited access to all Sector 3 tools and future NI products.
            </p>
          </>
        ) : (
          <>
            <p className="text-2xl font-bold capitalize text-white">{tierConfig.name}</p>
            <p className="mt-1 text-sm text-ni-muted">{tierConfig.description}</p>
            {toolSlotLimit !== null && niTier !== "free" && (
              <p className="mt-3 text-sm text-cyan-300/80">
                Tool slots: {toolSlotsUsed} / {toolSlotLimit}
              </p>
            )}
            {niTier === "free" && (
              <Link
                href="/#pricing"
                className="mt-4 inline-block rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-5 py-2.5 text-sm font-medium text-cyan-300 transition hover:bg-cyan-500/20"
              >
                View NI Plans
              </Link>
            )}
          </>
        )}
      </section>

      {message && (
        <p className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
          {message}
        </p>
      )}
      {error && (
        <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300" role="alert">
          {error}
        </p>
      )}

      <section>
        <h2 className="mb-4 text-lg font-semibold text-white">Your Tools</h2>
        {toolkit.length === 0 ? (
          <div className="glass-panel p-8 text-center">
            <p className="text-ni-muted">No tools in your Toolkit yet.</p>
            <Link
              href="/#tools"
              className="mt-4 inline-block text-sm font-medium text-cyan-300 hover:text-cyan-200"
            >
              Explore Intelligence Tools
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {toolkit.map((entry) => {
              const tool = INTELLIGENCE_TOOLS.find((t) => t.slug === entry.toolSlug);
              if (!tool) return null;
              return (
                <article
                  key={entry.id}
                  className="glass-panel flex flex-col items-center p-6 text-center"
                  style={{
                    boxShadow: `0 0 40px ${tool.brandColor}18`,
                    borderColor: `${tool.brandColor}33`,
                  }}
                >
                  <div
                    className="mb-3 flex h-20 w-20 items-center justify-center rounded-2xl border p-3"
                    style={{
                      borderColor: `${tool.brandColor}55`,
                      background: `linear-gradient(135deg, ${tool.brandColor}18, transparent)`,
                    }}
                  >
                    <Image
                      src={tool.logo}
                      alt={`${tool.name} logo`}
                      width={64}
                      height={64}
                      className="h-14 w-14 object-contain"
                    />
                  </div>
                  <h3 className="font-semibold text-white">{tool.name}</h3>
                  <p className="mt-1 text-xs uppercase tracking-wider text-cyan-300/70">
                    {accessLabel(entry.accessType, isMasterAccount)}
                  </p>
                  {entry.expiresAt && entry.accessType !== "lifetime" && (
                    <p className="mt-2 text-xs text-ni-muted">
                      Renews {new Date(entry.expiresAt).toLocaleDateString()}
                    </p>
                  )}
                  {tool.url ? (
                    <a
                      href={tool.url}
                      className="mt-4 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-300 transition hover:bg-cyan-500/20"
                    >
                      Open Tool
                    </a>
                  ) : (
                    <Link
                      href={`/tools/${tool.slug}`}
                      className="mt-4 rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white/80 transition hover:bg-white/10"
                    >
                      View Tool
                    </Link>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>

      {canAddNiPlanTool && availableToAdd.length > 0 && (
        <section>
          <h2 className="mb-4 text-lg font-semibold text-white">Add Tools to Your Plan</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {availableToAdd.map((slug) => {
              const tool = INTELLIGENCE_TOOLS.find((t) => t.slug === slug);
              if (!tool || ownedSlugs.has(slug)) return null;
              return (
                <article key={slug} className="glass-panel flex flex-col items-center p-6 text-center">
                  <Image
                    src={tool.logo}
                    alt={`${tool.name} logo`}
                    width={56}
                    height={56}
                    className="mb-3 h-14 w-14 object-contain"
                  />
                  <h3 className="font-semibold text-white">{tool.name}</h3>
                  <p className="mt-2 line-clamp-2 text-sm text-ni-muted">{tool.description}</p>
                  <button
                    type="button"
                    onClick={() => addTool(slug)}
                    disabled={adding === slug}
                    className="mt-4 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-300 transition hover:bg-cyan-500/20 disabled:opacity-50"
                  >
                    {adding === slug ? "Adding…" : "Add to Toolkit"}
                  </button>
                </article>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
