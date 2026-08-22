const ACCENT = '#00D4FF';

/**
 * WavScope has NO NI-Brain tables and no app route (confirmed live 2026-08-13,
 * NI Repo Agent — no wavscope_* schema exists anywhere in kxijunwgbrlfzvgkhklo).
 * This hub is deliberately static / honest about that rather than querying
 * tables that don't exist. Per the 2026-07-07 MVP audit, step 1 (JB confirms
 * the MVP table) has to happen before any build work starts.
 */
export function WavScopeVentureHub() {
  return (
    <div className="space-y-8 p-6">
      <header>
        <p className="text-xs uppercase tracking-[0.2em] text-axon-muted">Ventures · Sector 1B</p>
        <h1 className="mt-1 text-2xl font-semibold text-white">WavScope</h1>
        <p className="mt-2 max-w-2xl text-sm text-axon-muted">
          AI music metadata tool for producers/artists. Status:{' '}
          <span className="text-white">Queued</span> — behind StreamPass, nothing built yet.
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="text-sm font-medium uppercase tracking-wider text-axon-muted">
          Build status
        </h2>
        <div
          className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-axon-muted"
          style={{ borderTopColor: ACCENT, borderTopWidth: 2 }}
        >
          <p>
            <span className="text-white">Schema:</span> none — zero wavscope_* tables in
            NI-Brain.
          </p>
          <p className="mt-2">
            <span className="text-white">App route:</span> none.
          </p>
          <p className="mt-2">
            <span className="text-white">Blocked on:</span> JB confirming the MVP table
            (uploads / metadata / tiers) from the 2026-07-07 audit — nothing should get built
            ahead of that confirm.
          </p>
        </div>
      </section>
    </div>
  );
}
