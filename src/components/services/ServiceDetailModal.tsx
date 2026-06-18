"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import type { ServiceOffering } from "@/lib/services/offerings";
import { formatServicePrice, SERVICE_ACCOUNT_NOTE } from "@/lib/services/offerings";
import { buildPortalAuthUrl } from "@/lib/ni-auth";

interface ServiceDetailModalProps {
  service: ServiceOffering | null;
  isOpen: boolean;
  onClose: () => void;
  isLoggedIn: boolean;
}

export function ServiceDetailModal({
  service,
  isOpen,
  onClose,
  isLoggedIn,
}: ServiceDetailModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen || !service) return null;

  const requestPath = `/services/${service.slug}/request`;
  const ctaHref = isLoggedIn ? requestPath : buildPortalAuthUrl("signup", requestPath);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" role="presentation">
      <button
        type="button"
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        aria-label="Close dialog"
        onClick={onClose}
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="service-modal-title"
        className="glass-panel relative z-10 max-h-[90vh] w-full max-w-2xl overflow-y-auto p-8"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1 text-ni-muted transition hover:text-white"
          aria-label="Close"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-ni-cyan/60">
          Intelligence Services
        </p>
        <h2 id="service-modal-title" className="mb-1 text-2xl font-semibold text-white">
          {service.name}
        </h2>
        <p className="mb-4 text-sm text-cyan-300/80">{service.modalCopy.subtitle}</p>

        <div className="mb-6 rounded-xl border border-cyan-500/20 bg-cyan-500/5 px-4 py-3">
          <p className="text-lg font-semibold text-white">{formatServicePrice(service.pricing)}</p>
          {service.pricing.note && (
            <p className="mt-0.5 text-xs text-ni-muted">{service.pricing.note}</p>
          )}
        </div>

        <p className="mb-6 leading-relaxed text-ni-muted">{service.modalCopy.description}</p>

        <div className="mb-8 space-y-5">
          {service.modalCopy.sections.map((section) => (
            <div key={section.heading}>
              <h3 className="mb-1 text-sm font-semibold text-white">{section.heading}</h3>
              <p className="text-sm leading-relaxed text-ni-muted">{section.body}</p>
            </div>
          ))}
        </div>

        {!isLoggedIn && (
          <div className="mb-6 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3">
            <p className="text-sm text-amber-200/90">{SERVICE_ACCOUNT_NOTE}</p>
          </div>
        )}

        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href={ctaHref}
            className="rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-6 py-3 text-center text-sm font-medium text-cyan-300 transition hover:bg-cyan-500/20"
          >
            {isLoggedIn ? service.modalCopy.ctaLabel : "Create Free Account & Order"}
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-white/15 bg-white/5 px-6 py-3 text-sm font-medium text-white/90 transition hover:bg-white/10"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
