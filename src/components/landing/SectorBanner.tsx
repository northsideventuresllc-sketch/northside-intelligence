import Image from "next/image";
import Link from "next/link";
import { SECTOR_BANNER_PROJECTS } from "@/lib/constants";
import { StatusBadge } from "@/components/ui/StatusBadge";

export function SectorBanner() {
  return (
    <section className="relative border-t border-white/5 px-6 py-14">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,212,255,0.04)_0%,transparent_70%)]" />
      <div className="relative mx-auto max-w-6xl">
        <div className="mb-8 text-center">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-ni-cyan/60">
            Ecosystem
          </p>
          <h2 className="text-xl font-semibold text-white sm:text-2xl">
            Sector 1A &amp; 1B Projects
          </h2>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10">
          {SECTOR_BANNER_PROJECTS.map((project) => {
            const inner = (
              <div className="group flex flex-col items-center gap-3 transition hover:-translate-y-1">
                <div className="relative rounded-2xl border border-cyan-500/20 bg-ni-navy/50 p-4 shadow-[0_8px_32px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(0,212,255,0.12)] transition group-hover:border-cyan-400/40 group-hover:shadow-[0_16px_48px_rgba(0,212,255,0.15)]">
                  <Image
                    src={project.logo}
                    alt={`${project.name} logo`}
                    width={80}
                    height={80}
                    className="h-16 w-16 object-contain sm:h-20 sm:w-20"
                  />
                  <div className="absolute -right-2 -top-2">
                    <StatusBadge status={project.status} />
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-white">{project.name}</p>
                  <p className="text-xs text-ni-muted">Sector {project.sector}</p>
                </div>
              </div>
            );

            return project.url ? (
              <Link
                key={project.name}
                href={project.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                {inner}
              </Link>
            ) : (
              <div key={project.name}>{inner}</div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
