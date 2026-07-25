import Link from "next/link";
import { AxonWaitlistForm } from "@/components/axon/AxonWaitlistForm";

/**
 * Homepage AXON waitlist capture band.
 * The /axon landing page and its API both worked, but nothing on the homepage
 * linked to them — which is why axon_waitlist sat at zero. This puts the actual
 * capture form on the highest-traffic page instead of one click away.
 */
export function AxonWaitlistBand() {
  return (
    <section id="axon-waitlist" className="border-y border-axon-gold/20 bg-ni-bg px-6 py-16">
      <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
        <span className="rounded-full border border-axon-gold/40 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-axon-gold">
          Early Access
        </span>
        <h2 className="mt-5 text-3xl font-extrabold text-white sm:text-4xl">
          AXON — The World&apos;s First Neurodivergent AI
        </h2>
        <p className="mt-4 max-w-xl text-base text-ni-muted">
          AXON learns how you actually think and work, and keeps your data private. Join the
          waitlist to get in before public release.
        </p>
        <div className="mt-7 w-full max-w-md">
          <AxonWaitlistForm />
        </div>
        <Link href="/axon" className="mt-5 text-sm font-semibold text-axon-gold underline">
          See What AXON Does
        </Link>
      </div>
    </section>
  );
}
