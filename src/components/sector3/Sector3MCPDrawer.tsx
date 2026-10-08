"use client";

import { useEffect, useState } from "react";
import { SECTOR3_DEFAULT_MCPS } from "@/lib/billing/sector3-tool-pricing";

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
}: Props) {
  const isDrawerOpen = open ?? isOpen ?? false;
  const displayName = toolName || (toolSlug.charAt(0).toUpperCase() + toolSlug.slice(1));
  const mcps = SECTOR3_DEFAULT_MCPS[toolSlug] ?? [];
  const [notified, setNotified] = useState(false);

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
        className="relative z-10 w-full max-w-2xl rounded-3xl border border-cyan-500/30 bg-[#0A0D14]/95 p-6 shadow-2xl backdrop-blur-2xl sm:p-8"
        style={{
          boxShadow: `0 0 50px ${brandColor}22, 0 20px 40px rgba(0,0,0,0.8)`,
        }}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-5">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/50 bg-cyan-950/40 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
              Agentic Tier Coming Soon
            </div>
            <h2 className="mt-2 text-2xl font-bold text-white">
              {displayName} Autonomous Agentic Stack
            </h2>
            <p className="mt-1 text-sm text-white/60">
              Future autonomous capability tier: multi-agent runtime, background routines, and direct integrations.
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
          {/* Core Feature Description (Plain Language, Strictly No Prices) */}
          <div className="rounded-2xl border border-cyan-500/30 bg-cyan-950/20 p-5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-cyan-300 mb-3">
              What the Agentic Tier Will Do
            </h3>
            <ul className="space-y-3 text-xs text-white/80">
              <li className="flex items-start gap-2.5">
                <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-bold">
                  ✓
                </span>
                <span>
                  <strong className="text-white font-medium">Autonomous background monitoring</strong> and scheduled routine execution.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-bold">
                  ✓
                </span>
                <span>
                  <strong className="text-white font-medium">Multi-agent synthesis</strong> without manual prompting.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-bold">
                  ✓
                </span>
                <span>
                  <strong className="text-white font-medium">Direct webhook, CRM,</strong> and communication dispatch.
                </span>
              </li>
            </ul>
          </div>

          {/* Pre-Configured MCP Connectors Preview */}
          <div>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-white/50">
              Autonomous MCP Tool Connectors (Planned)
            </h3>
            <div className="grid gap-3 sm:grid-cols-3">
              {mcps.map((mcp) => (
                <div
                  key={mcp.id}
                  className="rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:border-white/20"
                >
                  <div className="text-2xl">{mcp.icon}</div>
                  <h4 className="mt-2 font-semibold text-white text-sm">{mcp.name}</h4>
                  <p className="mt-1 text-xs leading-relaxed text-white/60">{mcp.description}</p>
                  <div className="mt-3 flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
                    <span className="text-[11px] font-medium text-cyan-300">
                      Coming in Agentic Tier
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Prominent Card (Strictly No Prices) */}
          <div
            className="flex flex-col items-center justify-between gap-4 rounded-2xl border p-5 sm:flex-row"
            style={{
              borderColor: `${brandColor}44`,
              background: `linear-gradient(135deg, ${brandColor}15, transparent)`,
            }}
          >
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full border border-cyan-400/30 bg-cyan-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-cyan-300 mb-1.5">
                Agentic Tier Coming Soon
              </div>
              <h4 className="text-base font-bold text-white">
                Autonomous Headless Tier
              </h4>
              <p className="mt-1 text-xs text-white/60">
                Future availability will be announced on the portal. No pricing is active at this stage.
              </p>
            </div>

            {notified ? (
              <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-xs font-semibold text-emerald-300">
                ✓ You&apos;re on the early list
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setNotified(true)}
                className="w-full sm:w-auto rounded-xl px-5 py-2.5 text-xs font-semibold text-[#07080C] shadow-lg transition hover:scale-[1.02]"
                style={{ backgroundColor: brandColor }}
              >
                Notify Me When Live
              </button>
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
