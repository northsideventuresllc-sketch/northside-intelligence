import type { ToolStatus } from "@/lib/constants";

interface StatusBadgeProps {
  status: ToolStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const isLive = status === "LIVE";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium tracking-wide ${
        isLive
          ? "bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30"
          : "bg-zinc-500/15 text-zinc-400 ring-1 ring-zinc-500/30"
      }`}
    >
      {status}
    </span>
  );
}
