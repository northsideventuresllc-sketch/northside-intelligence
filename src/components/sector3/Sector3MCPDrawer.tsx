"use client";

import { useEffect } from "react";
import { CheckoutButton } from "@/components/billing/CheckoutButton";
import { getSector3AgenticPricing } from "@/lib/billing/sector3-tool-pricing";

interface Props {
  open?: boolean;
  isOpen?: boolean;
  onClose: () => void;
  toolSlug: string;
  toolName?: string;
  brandColor: string;
  isAgenticUser?: boolean;
}

export function Sector3MCPDrawer({
  open,
  isOpen,
  onClose,
  toolSlug,
  toolName,
  brandColor,
  isAgenticUser = false,
}: Props) {
  const isDrawerOpen = open ?? isOpen ?? false;
  const displayName = toolName || (toolSlug.charAt(0).toUpperCase() + toolSlug.slice(1));
  const pricing = getSector3AgenticPricing(toolSlug);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (isDrawerOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isDrawerOpen, onClose]);

  if (!isDrawerOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div
        className="relative z-10 w-full max-w-2xl rounded-3xl border border-white/15 bg-[#0A0D14]/95 p-6 shadow-2xl backdrop-blur-2xl sm:p-8"
        style={{
          boxShadow: `0 0 50px ${brandColor}22, 0 20px 40px rgba(0,0,0,0.8)`,
        }}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-5">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-300">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
              ⚡ Agentic Service Tier
            </div>
            <h2 className="mt-2 text-2xl font-bold text-white">
              {displayName} Autonomous Agentic Stack
            </h2>
            <p className="mt-1 text-sm text-white/60">
              Unlock pre-configured MCP connectors, autonomous agent loops, and BYOK compute
              failover.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-white/10 p-2 text-white/50 transition hover:bg-white/10 hover:text-white"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="my-6 max-h-[60vh] space-y-6 overflow-y-auto pr-1">
          {/* Pre-configured MCP Connectors */}
          <div>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-white/50">
              Pre-Configured MCP Connectors
            </h3>
            <div className="grid gap-3 sm:grid-cols-3">
              {pricing.mcps.map((mcp) => (
                <div
                  key={mcp.id}
                  className="rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:border-white/20"
                >
                  <div className="text-2xl">{mcp.icon}</div>
                  <h4 className="mt-2 font-semibold text-white text-sm">{mcp.name}</h4>
                  <p className="mt-1 text-xs leading-relaxed text-white/60">{mcp.description}</p>
                  <div className="mt-3 flex items-center gap-1.5">
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        isAgenticUser ? "bg-emerald-400" : "bg-amber-400"
                      }`}
                    />
                    <span className="text-[11px] font-medium text-white/50">
                      {isAgenticUser ? "Active & Ready" : "Agentic Tier"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Core Agentic Features */}
          <div className="grid gap-4 rounded-2xl border border-white/10 bg-white/[0.02] p-4 sm:grid-cols-2">
            <div className="flex gap-3">
              <span className="text-lg text-cyan-300">⚡</span>
              <div>
                <h4 className="text-sm font-semibold text-white">Custom MCP Server Builder</h4>
                <p className="mt-0.5 text-xs text-white/60">
                  Connect custom SSE, HTTP stream, and stdio Model Context Protocol servers
                  directly to your workspace.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="text-lg text-emerald-300">🔑</span>
              <div>
                <h4 className="text-sm font-semibold text-white">BYOK Compute Failover</h4>
                <p className="mt-0.5 text-xs text-white/60">
                  Zero downtime: automatically falls back to your private OpenAI, Anthropic, or
                  Gemini keys when compute quota is reached.
                </p>
              </div>
            </div>
          </div>

          {/* Pricing & Subscription Card */}
          <div
            className="flex flex-col items-center justify-between gap-4 rounded-2xl border p-5 sm:flex-row"
            style={{
              borderColor: `${brandColor}44`,
              background: `linear-gradient(135deg, ${brandColor}11, transparent)`,
            }}
          >
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-white">
                  ${pricing.agenticMonthlyUsd.toFixed(2)}
                </span>
                <span className="text-xs text-white/50">/month</span>
                <span className="rounded-full bg-cyan-500/20 px-2 py-0.5 text-[10px] font-semibold text-cyan-300">
                  Base SaaS + 50%
                </span>
              </div>
              <p className="mt-1 text-xs text-white/60">
                Includes full {toolName} unlimited SaaS access + all 3 MCP connectors.
              </p>
            </div>

            {isAgenticUser ? (
              <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-300">
                ✓ Active On Agentic Tier
              </div>
            ) : (
              <CheckoutButton
                label="Subscribe to Agentic Tier"
                payload={{
                  type: "tool_subscription",
                  toolSlug,
                  interval: "monthly",
                }}
                className="w-full sm:w-auto rounded-xl px-5 py-2.5 text-sm font-semibold text-[#07080C] shadow-lg transition hover:scale-[1.02]"
                style={{ backgroundColor: brandColor }}
              />
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end border-t border-white/10 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-white/80 transition hover:bg-white/10 hover:text-white"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
