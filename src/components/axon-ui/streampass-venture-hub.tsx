import { fetchStreamPassHub } from '@/lib/axon/streampass-hub';

const ACCENT = '#00D4FF';

export async function StreamPassVentureHub() {
  const hub = await fetchStreamPassHub();

  return (
    <div className="space-y-8 p-6">
      <header>
        <p className="text-xs uppercase tracking-[0.2em] text-axon-muted">Ventures · Sector 1B</p>
        <h1 className="mt-1 text-2xl font-semibold text-white">StreamPass</h1>
        <p className="mt-2 max-w-2xl text-sm text-axon-muted">
          Cross-platform subscription intelligence — watchlist, watch parties, subscription
          tracking. Status: <span className="text-white">Building</span> — NI-Brain schema is
          live, product UI has not been built yet.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Profiles (schema rows)', value: String(hub.profiles) },
          { label: 'Tracked titles', value: String(hub.trackedTitles) },
          { label: 'Watch rooms', value: String(hub.watchRooms) },
          { label: 'Watchlist rows', value: String(hub.watchlistRows) },
        ].map((c) => (
          <div
            key={c.label}
            className="rounded-xl border border-white/10 bg-axon-surface p-4"
            style={{ borderTopColor: ACCENT, borderTopWidth: 2 }}
          >
            <p className="text-xs text-axon-muted">{c.label}</p>
            <p className="mt-1 text-lg font-semibold text-white">{c.value}</p>
          </div>
        ))}
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-medium uppercase tracking-wider text-axon-muted">
          Build status
        </h2>
        <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-axon-muted">
          <p>
            <span className="text-white">Schema:</span> live — 7 NI-Brain tables (profiles,
            services, watchlist, tracked titles, watch rooms + members + messages).
          </p>
          <p className="mt-2">
            <span className="text-white">App route:</span> none in this repo yet. No
            /streampass page exists — this is the first real gap to close next.
          </p>
          <p className="mt-2">
            <span className="text-white">Domain:</span> not yet configured.
          </p>
        </div>
      </section>
    </div>
  );
}
