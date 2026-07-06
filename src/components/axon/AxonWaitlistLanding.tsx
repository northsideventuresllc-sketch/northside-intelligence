import { Footer } from "@/components/landing/Footer";
import { NavServer } from "@/components/landing/NavServer";
import { AxonWaitlistForm } from "@/components/axon/AxonWaitlistForm";

const DIFFERENTIATORS = [
  {
    title: "Individualized, not generalized",
    body: "General models serve everyone the same. AXON is not built to be generalized — it is individualized, and it learns infinitely for one person: you.",
  },
  {
    title: "Your data stays yours",
    body: "Your data lives in your vault. No resale, no training on your data without written consent, and one user's AXON is never accessible to another.",
  },
  {
    title: "Morality before profit",
    body: "A published morality code runs before profit logic. AXON refuses actions that violate it — no workarounds.",
  },
  {
    title: "You hold the controls",
    body: "You control cognition mode, outbound actions, and sharing. Nothing is shared without a separate, plain-language consent step.",
  },
] as const;

export function AxonWaitlistLanding() {
  return (
    <main className="min-h-screen bg-axon-bg text-axon-text">
      <NavServer />

      <section className="relative overflow-hidden px-6 pb-20 pt-32">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_-10%,rgba(96,165,250,0.14),transparent_55%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_70%,rgba(201,169,98,0.08),transparent_45%)]" />

        <div className="relative mx-auto max-w-3xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-axon-gold">
            AXON by NORTHSiDE Intelligence
          </p>
          <h1 className="mt-6 text-4xl font-bold leading-tight sm:text-5xl">
            The world&apos;s first neurodivergent artificial intelligence.
          </h1>
          <p className="mt-6 text-lg text-axon-muted sm:text-xl">
            AXON is built to learn who <span className="font-semibold text-axon-text">YOU</span> are
            — and keep all of your data private and secure.
          </p>
          <p className="mt-4 text-sm text-axon-muted">
            Not a chatbot. An operating system for your life and work — tasks, tools, connectors,
            goals, and cognition that adapts to one person only.
          </p>

          <div className="mx-auto mt-10 max-w-xl">
            <AxonWaitlistForm />
          </div>
        </div>
      </section>

      <section className="relative px-6 pb-24">
        <div className="mx-auto grid max-w-4xl gap-4 sm:grid-cols-2">
          {DIFFERENTIATORS.map(({ title, body }) => (
            <div
              key={title}
              className="rounded-xl border border-axon-border bg-axon-surface p-6"
            >
              <h2 className="text-sm font-semibold text-axon-gold">{title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-axon-muted">{body}</p>
            </div>
          ))}
        </div>
        <p className="mx-auto mt-10 max-w-2xl text-center text-xs text-axon-muted/70">
          AXON does not diagnose conditions, is not a medical device, and does not replace therapy.
          Neurodivergent AI means anti-generalization architecture — inclusive, without
          gatekeeping.
        </p>
      </section>

      <Footer />
    </main>
  );
}
