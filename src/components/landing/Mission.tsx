export function Mission() {
  return (
    <section id="mission" className="relative border-t border-white/5 px-6 py-20">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,212,255,0.04)_0%,transparent_70%)]" />
      <div className="relative mx-auto max-w-3xl">
        <div className="rounded-2xl border border-cyan-500/15 bg-gradient-to-br from-ni-navy/60 via-ni-navy/30 to-ni-bg/80 p-10 text-center shadow-[0_16px_48px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(0,212,255,0.12)] backdrop-blur-md transition hover:border-cyan-400/25 hover:shadow-[0_20px_60px_rgba(0,212,255,0.08)]">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.25em] text-ni-cyan/60">
            Our Mission
          </p>
          <h2 className="mb-6 text-2xl font-semibold text-white">
            AI that works for humans
          </h2>
          <p className="text-lg leading-relaxed text-ni-muted">
            Northside Intelligence is a tech and AI company built on the belief that AI
            should work for humans, not replace them. We build tools that close the gaps.
          </p>
        </div>
      </div>
    </section>
  );
}
