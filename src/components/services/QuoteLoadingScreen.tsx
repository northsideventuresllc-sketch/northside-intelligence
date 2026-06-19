"use client";

export function QuoteLoadingScreen() {
  return (
    <div className="glass-panel flex flex-col items-center justify-center p-12 text-center">
      <div className="relative mb-8 h-20 w-20">
        <div className="absolute inset-0 animate-ping rounded-full border border-cyan-500/30 bg-cyan-500/10" />
        <div className="absolute inset-2 animate-spin rounded-full border-2 border-transparent border-t-cyan-400 border-r-cyan-400/40" />
        <div className="absolute inset-0 flex items-center justify-center">
          <svg
            className="h-8 w-8 text-cyan-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
            />
          </svg>
        </div>
      </div>

      <p className="mb-2 text-lg font-semibold text-white">Calculating Your Quote</p>
      <p className="max-w-sm text-sm text-ni-muted">
        Analyzing your requirements, scope, and budget to generate a competitive custom price…
      </p>

      <div className="mt-8 flex gap-2">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-1.5 w-8 animate-pulse rounded-full bg-cyan-500/40"
            style={{ animationDelay: `${i * 200}ms` }}
          />
        ))}
      </div>
    </div>
  );
}
