"use client";

import Image from "next/image";
import type { EcosystemProject } from "@/lib/constants";
import { StatusBadge } from "@/components/ui/StatusBadge";

interface EcosystemCardProps {
  project: EcosystemProject;
  variant?: "center" | "side";
}

function CardShell({
  project,
  isCenter,
  children,
}: {
  project: EcosystemProject;
  isCenter: boolean;
  children: React.ReactNode;
}) {
  return (
    <article
      className={`relative flex h-full min-h-[300px] w-full max-w-[300px] flex-col items-center overflow-hidden rounded-2xl border p-5 text-center backdrop-blur-md transition-all duration-500 sm:min-h-[320px] sm:p-6 ${
        isCenter
          ? "border-cyan-500/30 shadow-[0_24px_70px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.12)]"
          : "border-white/10 bg-ni-navy/30 opacity-60"
      }`}
      style={{
        background: isCenter
          ? "linear-gradient(145deg, rgba(0,212,255,0.08) 0%, rgba(10,22,40,0.85) 45%, rgba(7,8,12,0.95) 100%)"
          : undefined,
        boxShadow: isCenter ? "0 0 60px rgba(0,212,255,0.12)" : undefined,
      }}
    >
      {children}
    </article>
  );
}

export function EcosystemCard({ project, variant = "center" }: EcosystemCardProps) {
  const isCenter = variant === "center";

  const inner = (
    <>
      <div className="mb-3 flex w-full shrink-0 flex-col items-center gap-2">
        <Image
          src={project.logo}
          alt={`${project.name} logo`}
          width={isCenter ? 80 : 64}
          height={isCenter ? 80 : 64}
          className={`object-contain drop-shadow-[0_0_20px_rgba(0,212,255,0.3)] ${
            isCenter ? "h-20 w-20" : "h-16 w-16"
          }`}
        />
        <h3
          className={`font-semibold leading-tight text-white ${isCenter ? "text-lg sm:text-xl" : "text-base"}`}
        >
          {project.name}
        </h3>
        {isCenter && <StatusBadge status={project.status} />}
      </div>

      {isCenter && (
        <p className="line-clamp-4 flex-1 px-1 text-sm leading-relaxed text-ni-muted">
          {project.tagline}
        </p>
      )}
    </>
  );

  if (isCenter && project.url) {
    return (
      <a
        href={project.url}
        target="_blank"
        rel="noopener noreferrer"
        className="block h-full transition hover:-translate-y-1"
        aria-label={`Visit ${project.name}`}
      >
        <CardShell project={project} isCenter={isCenter}>
          {inner}
        </CardShell>
      </a>
    );
  }

  return (
    <CardShell project={project} isCenter={isCenter}>
      {inner}
    </CardShell>
  );
}
