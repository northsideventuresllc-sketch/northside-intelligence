"use client";

export function AxonLoadingScreen({ label = "Initializing AXON" }: { label?: string }) {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
      <div className="relative mb-8 h-24 w-24">
        <div className="absolute inset-0 rounded-full border border-cyan-400/20" />
        <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-cyan-400 border-r-cyan-400/40" />
        <div className="absolute inset-3 animate-pulse rounded-full bg-cyan-500/10 shadow-[0_0_40px_rgba(0,212,255,0.35)]" />
        <div className="absolute inset-0 flex items-center justify-center text-xs font-semibold uppercase tracking-[0.35em] text-cyan-200">
          AXON
        </div>
      </div>
      <p className="text-sm font-medium uppercase tracking-[0.25em] text-cyan-300/80">{label}</p>
      <p className="mt-3 max-w-sm text-xs text-ni-muted">Securing neural interface channel…</p>
      <div className="mt-6 flex gap-1">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-400"
            style={{ animationDelay: `${i * 180}ms` }}
          />
        ))}
      </div>
    </div>
  );
}
