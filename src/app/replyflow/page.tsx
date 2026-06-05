import Link from "next/link";
import { ReplyFlowBackground } from "@/components/replyflow/ReplyFlowBackground";
import { ReplyFlowNav } from "@/components/replyflow/ReplyFlowNav";
import { portalSignUpUrl, replyflowPath } from "@/lib/replyflow/auth";

const plans = [
  { name: "Solo", price: "$9", desc: "100 replies / month", accent: "from-rf-rose/20 to-rf-coral/10" },
  {
    name: "Team",
    price: "$49",
    desc: "1,000 replies / month",
    accent: "from-rf-violet/30 to-rf-rose/10",
    popular: true,
  },
  { name: "Agency", price: "$99", desc: "Unlimited scale", accent: "from-rf-coral/20 to-rf-violet/20" },
];

const tones = ["Professional", "Friendly", "Empathetic", "Firm"];

export default function ReplyFlowHome() {
  const signupUrl = portalSignUpUrl();

  return (
    <div className="relative min-h-screen overflow-hidden">
      <ReplyFlowBackground />
      <ReplyFlowNav />

      <main className="relative z-10">
        <section className="mx-auto flex max-w-5xl flex-col items-center px-6 pb-20 pt-24 text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-rf-rose/30 bg-rf-rose/10 px-4 py-1.5 text-sm text-rf-rose">
            <span className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="inline-block h-1.5 w-1.5 rounded-full bg-rf-rose animate-wave"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </span>
            Powered by Claude · Part of Northside Intelligence
          </div>

          <h1 className="max-w-3xl text-4xl font-bold leading-tight sm:text-5xl md:text-6xl">
            <span className="rf-gradient-text">Customer replies</span>
            <br />
            <span className="text-white">that sound human, ship fast</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-rf-muted">
            Paste any message. Pick a tone. ReplyFlow crafts on-brand responses in seconds — one NI
            account unlocks everything.
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <a
              href={signupUrl}
              className="rounded-2xl bg-gradient-to-r from-rf-rose via-rf-coral to-rf-violet px-8 py-3.5 text-lg font-semibold text-white shadow-rf-glow transition hover:scale-[1.02] hover:opacity-95"
            >
              Start free — 10 replies/mo
            </a>
            <Link
              href={replyflowPath("/dashboard")}
              className="rounded-2xl border border-white/15 bg-white/5 px-8 py-3.5 text-lg font-semibold text-white/90 transition hover:border-rf-rose/40 hover:bg-white/10"
            >
              Open dashboard →
            </Link>
          </div>

          <div className="rf-glass mt-16 w-full max-w-2xl rounded-3xl p-6 text-left shadow-rf-violet">
            <p className="mb-3 text-xs font-medium uppercase tracking-widest text-rf-muted">
              Live preview
            </p>
            <div className="mb-4 rounded-2xl border border-white/10 bg-rf-bg/60 p-4 text-sm text-rf-muted">
              &ldquo;I&apos;ve been waiting 2 weeks for my refund. This is unacceptable.&rdquo;
            </div>
            <div className="mb-4 flex flex-wrap gap-2">
              {tones.map((t) => (
                <span
                  key={t}
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    t === "Empathetic"
                      ? "border border-rf-rose/50 bg-rf-rose/20 text-rf-rose"
                      : "border border-white/10 bg-white/5 text-rf-muted"
                  }`}
                >
                  {t}
                </span>
              ))}
            </div>
            <div className="rounded-2xl border border-rf-violet/30 bg-gradient-to-br from-rf-violet/10 to-rf-rose/5 p-4 text-sm leading-relaxed text-white/90">
              Thank you for your patience — I completely understand how frustrating this delay must
              feel. I&apos;ve escalated your refund and you&apos;ll see it within 3–5 business days.
            </div>
          </div>
        </section>

        <section id="pricing" className="border-t border-white/10 px-6 py-20">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-center text-3xl font-bold rf-gradient-text">Simple pricing</h2>
            <p className="mt-2 text-center text-rf-muted">
              One Northside Intelligence account. Upgrade when you&apos;re ready.
            </p>
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {plans.map((p) => (
                <div
                  key={p.name}
                  className={`rf-glass relative rounded-2xl bg-gradient-to-br ${p.accent} p-6 ${
                    p.popular ? "ring-2 ring-rf-rose/50 shadow-rf-glow" : ""
                  }`}
                >
                  {p.popular && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-rf-rose px-3 py-0.5 text-xs font-bold text-white">
                      Popular
                    </span>
                  )}
                  <p className="text-3xl font-bold text-white">
                    {p.price}
                    <span className="text-sm font-normal text-rf-muted">/mo</span>
                  </p>
                  <p className="mt-1 font-semibold text-white">{p.name}</p>
                  <p className="mt-2 text-sm text-rf-muted">{p.desc}</p>
                  <a
                    href={signupUrl}
                    className="mt-6 block rounded-xl border border-white/20 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-white/10"
                  >
                    Get started
                  </a>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-white/10 py-8 text-center text-sm text-rf-muted">
        <p>
          © {new Date().getFullYear()} ReplyFlow ·{" "}
          <a href="https://northsideintelligence.com" className="text-rf-rose hover:underline">
            Northside Intelligence
          </a>
        </p>
      </footer>
    </div>
  );
}
