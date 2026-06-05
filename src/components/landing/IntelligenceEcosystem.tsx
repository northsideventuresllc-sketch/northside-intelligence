"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ECOSYSTEM_LABS_COMING_SOON,
  ECOSYSTEM_LABS_LIVE,
  type EcosystemProject,
} from "@/lib/constants";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useTilt } from "@/hooks/useTilt";

function ProjectTile({
  name,
  tagline,
  url,
  logo,
  status,
}: EcosystemProject) {
  const { ref, handleMove, handleLeave } = useTilt({ maxTilt: 10, scale: 1.02 });

  const content = (
    <article
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      className="group relative flex min-h-[180px] flex-col items-center justify-center rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-ni-navy/80 via-ni-navy/40 to-ni-bg/90 p-6 text-center shadow-[0_12px_40px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(0,212,255,0.15)] backdrop-blur-md transition hover:border-cyan-400/40"
      style={{ transformStyle: "preserve-3d" }}
    >
      <div style={{ transform: "translateZ(24px)" }} className="flex flex-col items-center">
        <Image
          src={logo}
          alt={`${name} logo`}
          width={72}
          height={72}
          className="mb-4 h-16 w-16 object-contain drop-shadow-[0_0_20px_rgba(0,212,255,0.3)]"
        />
        <div className="mb-2 flex items-center justify-center gap-2">
          <h3 className="text-lg font-semibold text-white">{name}</h3>
          <StatusBadge status={status} />
        </div>
        <p className="max-w-[220px] text-sm text-ni-muted">{tagline}</p>
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

function ProjectGroup({
  title,
  projects,
}: {
  title: string;
  projects: EcosystemProject[];
}) {
  return (
    <div>
      <h3 className="mb-5 text-center text-sm font-semibold uppercase tracking-[0.2em] text-ni-cyan/70">
        {title}
      </h3>
      <div
        className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
        style={{ perspective: "1200px" }}
      >
        {projects.map((project) => (
          <ProjectTile key={project.name} {...project} />
        ))}
      </div>
    </div>
  );
}

export function IntelligenceEcosystem() {
  return (
    <section id="ecosystem" className="relative border-t border-white/5 px-6 py-20">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,212,255,0.04)_0%,transparent_70%)]" />
      <div className="relative mx-auto max-w-5xl">
        <div className="mb-12 text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-ni-cyan/60">
            Ecosystem
          </p>
          <h2 className="text-2xl font-semibold text-white sm:text-3xl">
            <span className="bg-gradient-to-r from-white to-cyan-200/80 bg-clip-text pb-1 text-transparent">
              Intelligence Ecosystem
            </span>
          </h2>
        </div>

        <div className="mb-10 text-center">
          <h3 className="text-lg font-medium text-white sm:text-xl">
            Intelligence Ecosystem Labs
          </h3>
          <p className="mx-auto mt-2 max-w-xl text-sm text-ni-muted">
            Live ventures and confirmed products in development.
          </p>
        </div>

        <div className="space-y-12">
          <ProjectGroup title="Live" projects={ECOSYSTEM_LABS_LIVE} />
          <ProjectGroup title="Coming Soon" projects={ECOSYSTEM_LABS_COMING_SOON} />
        </div>
      </div>
    </section>
  );
}
