"use client";

import Image from "next/image";
import Link from "next/link";
import { SECTOR_1A_PROJECTS } from "@/lib/constants";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useTilt } from "@/hooks/useTilt";

function ProjectTile({
  name,
  tagline,
  url,
  logo,
  status,
}: (typeof SECTOR_1A_PROJECTS)[number]) {
  const { ref, handleMove, handleLeave } = useTilt({ maxTilt: 12, scale: 1.03 });

  const content = (
    <article
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      className="group relative flex h-full min-h-[200px] flex-col items-center justify-center rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-ni-navy/80 via-ni-navy/40 to-ni-bg/90 p-6 text-center shadow-[0_12px_40px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(0,212,255,0.15)] backdrop-blur-md transition hover:border-cyan-400/40"
      style={{ transformStyle: "preserve-3d" }}
    >
      <div style={{ transform: "translateZ(30px)" }}>
        <Image
          src={logo}
          alt={`${name} logo`}
          width={72}
          height={72}
          className="mx-auto mb-4 h-16 w-16 object-contain drop-shadow-[0_0_20px_rgba(0,212,255,0.3)]"
        />
        <div className="mb-2 flex items-center justify-center gap-2">
          <h3 className="text-lg font-semibold text-white">{name}</h3>
          <StatusBadge status={status} />
        </div>
        <p className="text-sm text-ni-muted">{tagline}</p>
        {url && (
          <p className="mt-3 text-xs font-medium text-cyan-400/80 group-hover:text-cyan-300">
            Visit project →
          </p>
        )}
      </div>
    </article>
  );

  if (url) {
    return (
      <Link href={url} target="_blank" rel="noopener noreferrer" className="block h-full">
        {content}
      </Link>
    );
  }

  return content;
}

export function Sector1AHub() {
  return (
    <section id="sector-1a" className="relative border-t border-white/5 px-6 py-20">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-cyan-500/[0.03] via-transparent to-transparent" />
      <div className="relative mx-auto max-w-5xl">
        <div className="mb-10 text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-ni-cyan/60">
            Sector 1A
          </p>
          <h2 className="text-2xl font-semibold text-white sm:text-3xl">
            <span className="bg-gradient-to-r from-white to-cyan-200/80 bg-clip-text pb-1 text-transparent">
              Marketplace &amp; Fit Projects
            </span>
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-ni-muted">
            All Sector 1A ventures in one place — live products and what&apos;s coming next.
          </p>
        </div>
        <div
          className="grid gap-6 sm:grid-cols-2"
          style={{ perspective: "1200px" }}
        >
          {SECTOR_1A_PROJECTS.map((project) => (
            <ProjectTile key={project.name} {...project} />
          ))}
        </div>
      </div>
    </section>
  );
}
