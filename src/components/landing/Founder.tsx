import { BRAND } from "@/lib/constants";

/**
 * Added 2026-08-13 (NI Repo Agent, backlog item "add JB bio to NVG landing
 * page"). No founder/bio section existed anywhere on this page before this —
 * confirmed by reading the full landing tree first. Kept short and in the
 * same visual register as Mission.tsx; JB should edit the copy to taste.
 */
export function Founder() {
  return (
    <section id="founder" className="relative px-6 py-10 sm:py-12">
      <div className="mx-auto max-w-2xl">
        <div className="rounded-xl border border-white/[0.04] bg-white/[0.02] px-5 py-4 text-center backdrop-blur-sm">
          <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.3em] text-ni-muted/70">
            Founder
          </p>
          <p className="text-sm leading-relaxed text-ni-muted/90 sm:text-[15px]">
            JB founded {BRAND.venturesGroup}, the parent company behind {BRAND.company} and its
            sibling ventures. A self-taught software developer and 10+ year audio engineer, he
            builds lean and ships fast — profit-first, fewer layers, real ownership. Based in the
            Atlanta area.
          </p>
        </div>
      </div>
    </section>
  );
}
