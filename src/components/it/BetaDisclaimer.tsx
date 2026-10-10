import Link from "next/link";

interface BetaDisclaimerProps {
  toolName?: string;
  toolSlug?: string;
}

/**
 * BETA disclaimer shown at the bottom of every IT page.
 * Asks users to report bugs and submit ideas.
 */
export function BetaDisclaimer({ toolName, toolSlug }: BetaDisclaimerProps) {
  const feedbackHref = toolSlug ? `/feedback?tool=${toolSlug}` : "/feedback";
  return (
    <section
      aria-label="Beta disclaimer"
      className="mx-auto w-full max-w-5xl px-6 pb-12 pt-4"
    >
      <div className="rounded-xl border border-white/10 bg-white/[0.03] px-5 py-4 text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-amber-300/90">
          Beta
        </p>
        <p className="mx-auto mt-2 max-w-2xl text-sm text-white/70">
          {toolName ? `${toolName} is` : "This tool is"} currently in BETA. If you
          find any bugs or experience technical difficulties, please{" "}
          <Link
            href={feedbackHref}
            className="font-medium text-cyan-300 underline-offset-2 hover:underline"
          >
            report them here
          </Link>
          . We also encourage you to submit ideas to make the platform better —
          your feedback shapes what we build next.
        </p>
      </div>
    </section>
  );
}
