"use client";

interface Props {
  toolSlug: string;
  brandColor?: string;
  isAgenticUser?: boolean;
  onOpenAgenticDrawer: () => void;
}

export function Sector3TierSwitcher({
  toolSlug,
  brandColor = "#38bdf8",
  isAgenticUser = false,
  onOpenAgenticDrawer,
}: Props) {
  return (
    <div className="inline-flex items-center rounded-2xl border border-white/10 bg-white/5 p-1 shadow-inner backdrop-blur-md">
      <div className="flex items-center gap-1.5 rounded-xl bg-white/10 px-3 py-1.5 text-xs font-semibold text-white shadow-sm">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
        <span>Web App</span>
      </div>

      <button
        type="button"
        onClick={onOpenAgenticDrawer}
        className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition hover:bg-white/10 text-white/70 hover:text-white"
        title="View Agentic Stack & MCP Connectors"
      >
        <span className="text-cyan-400">⚡</span>
        <span>Agentic Worker</span>
        {isAgenticUser ? (
          <span className="rounded-full bg-cyan-500/20 px-1.5 py-0.5 text-[10px] font-mono text-cyan-300">
            Active
          </span>
        ) : (
          <span
            className="rounded-full px-1.5 py-0.5 text-[10px] font-medium text-[#07080C]"
            style={{ backgroundColor: brandColor }}
          >
            2.5x
          </span>
        )}
      </button>
    </div>
  );
}
