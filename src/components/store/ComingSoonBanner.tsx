import type { StoreGateStatus } from "@/lib/store/types";

export function ComingSoonBanner({ gate }: { gate: StoreGateStatus }) {
  if (gate.live) return null;

  return (
    <div
      className="mb-8 rounded-2xl border border-amber-400/30 bg-amber-500/10 px-5 py-4 text-center"
      role="status"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-200/90">
        Coming Soon
      </p>
      <p className="mt-2 text-sm text-amber-100/90">{gate.message}</p>
    </div>
  );
}
