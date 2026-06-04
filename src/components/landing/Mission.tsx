import { BRAND } from "@/lib/constants";

export function Mission() {
  return (
    <section id="mission" className="relative px-6 py-10 sm:py-12">
      <div className="mx-auto max-w-2xl">
        <div className="rounded-xl border border-white/[0.04] bg-white/[0.02] px-5 py-4 text-center backdrop-blur-sm">
          <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.3em] text-ni-muted/70">
            Mission
          </p>
          <p className="text-sm leading-relaxed text-ni-muted/90 sm:text-[15px]">
            {BRAND.mission}
          </p>
        </div>
      </div>
    </section>
  );
}
