import { redirectLoggedInSector3ToDashboard } from "@/lib/sector3-auth-redirect";
import Link from "next/link";
import { ReplyFlowBackground } from "@/components/replyflow/ReplyFlowBackground";
import { ReplyFlowNav } from "@/components/replyflow/ReplyFlowNav";
import { ReplyFlowPricingSection } from "@/components/replyflow/ReplyFlowPricingSection";
import { portalSignUpUrl, replyflowPath } from "@/lib/replyflow/auth";

const tones = ["Professional", "Friendly", "Empathetic", "Firm"];

export default async function ReplyFlowHome() {
  await redirectLoggedInSector3ToDashboard("/replyflow");

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
              Start Free — 10 Replies/Mo
            </a>
            <Link
              href={replyflowPath("/dashboard")}
              className="rounded-2xl border border-white/15 bg-white/5 px-8 py-3.5 text-lg font-semibold text-white/90 transition hover:border-rf-rose/40 hover:bg-white/10"
            >
              Open Dashboard
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

        <ReplyFlowPricingSection />
      </main>
    </div>
  );
}
