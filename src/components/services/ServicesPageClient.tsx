"use client";

import { useEffect, useState } from "react";
import { BRAND } from "@/lib/constants";
import { INTELLIGENCE_SERVICES } from "@/lib/services/offerings";
import { ServiceOfferingCard } from "@/components/services/ServiceOfferingCard";
import { TailoredServerModal } from "@/components/services/TailoredServerModal";

export function ServicesPageClient() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data: { user?: unknown }) => {
        if (!cancelled) setIsLoggedIn(!!data.user);
      })
      .catch(() => {
        if (!cancelled) setIsLoggedIn(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("service") === "tailored-intelligence-server") {
      setModalOpen(true);
    }
  }, []);

  function handleLearnMore(slug: string) {
    if (slug === "tailored-intelligence-server") {
      setModalOpen(true);
    }
  }

  return (
    <>
      <div className="mb-12 text-center">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-ni-cyan/60">
          Services
        </p>
        <h1 className="mb-4 bg-gradient-to-r from-white via-cyan-100 to-cyan-300 bg-clip-text text-4xl font-semibold text-transparent sm:text-5xl">
          Intelligence Services
        </h1>
        <p className="mx-auto max-w-2xl text-ni-muted">
          {BRAND.company} delivers tailored intelligence solutions for individuals and
          businesses — from custom server builds and workflow audits to enterprise AI strategy
          and ongoing support.
        </p>
      </div>

      <div className="mb-10 rounded-2xl border border-cyan-500/15 bg-cyan-500/5 p-6 text-center">
        <p className="text-sm text-ni-muted">
          To order a service, you&apos;ll need an{" "}
          <span className="text-cyan-300">NI Portal account</span>. Browse our offerings below,
          then sign up or sign in when you&apos;re ready to submit a request.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        {INTELLIGENCE_SERVICES.map((service) => (
          <ServiceOfferingCard
            key={service.slug}
            service={service}
            onLearnMore={handleLearnMore}
          />
        ))}
      </div>

      <TailoredServerModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        isLoggedIn={isLoggedIn}
      />
    </>
  );
}
