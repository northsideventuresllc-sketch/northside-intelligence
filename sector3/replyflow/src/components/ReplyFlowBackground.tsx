'use client'

export function ReplyFlowBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
      <div className="absolute -left-32 top-20 h-96 w-96 rounded-full bg-rf-rose/10 blur-3xl animate-pulse-glow" />
      <div className="absolute -right-24 bottom-32 h-80 w-80 rounded-full bg-rf-violet/15 blur-3xl animate-pulse-glow" style={{ animationDelay: '1s' }} />
      <div className="absolute left-1/2 top-1/3 h-64 w-64 -translate-x-1/2 rounded-full bg-rf-coral/10 blur-3xl" />

      {/* Floating message bubbles */}
      {[
        { top: '18%', left: '8%', delay: '0s', w: 'w-28' },
        { top: '62%', left: '78%', delay: '1.2s', w: 'w-36' },
        { top: '38%', left: '85%', delay: '2.4s', w: 'w-24' },
        { top: '72%', left: '12%', delay: '0.8s', w: 'w-32' },
      ].map((b, i) => (
        <div
          key={i}
          className={`absolute ${b.w} animate-float-bubble rounded-2xl border border-rf-rose/20 bg-rf-card/40 px-3 py-2 text-[10px] text-rf-muted/60`}
          style={{ top: b.top, left: b.left, animationDelay: b.delay }}
        >
          <div className="mb-1 h-1.5 w-8 rounded-full bg-rf-rose/30" />
          <div className="h-1 w-full rounded-full bg-white/10" />
          <div className="mt-1 h-1 w-2/3 rounded-full bg-white/5" />
        </div>
      ))}

      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            'radial-gradient(circle at 50% 0%, rgba(251,113,133,0.12), transparent 50%), radial-gradient(circle at 100% 100%, rgba(167,139,250,0.1), transparent 40%)',
        }}
      />
    </div>
  )
}
