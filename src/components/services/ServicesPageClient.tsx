"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BRAND } from "@/lib/constants";
import {
  getServiceBySlug,
  getServicesByAudience,
  SERVICE_ACCOUNT_NOTE,
} from "@/lib/services/offerings";
import { ServiceOfferingCard } from "@/components/services/ServiceOfferingCard";
import { ServiceDetailModal } from "@/components/services/ServiceDetailModal";
import {
  ServiceAudienceFilter,
  type AudienceFilter,
} from "@/components/services/ServiceAudienceFilter";
import { ServiceReviews } from "@/components/services/ServiceReviews";
import { ServiceAssistantWidget } from "@/components/services/ServiceAssistantWidget";
import { buildPortalAuthUrl } from "@/lib/ni-auth";

export function ServicesPageClient() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [audienceFilter, setAudienceFilter] = useState<AudienceFilter>("all");
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
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
    const serviceParam = params.get("service");
    if (serviceParam && getServiceBySlug(serviceParam)) {
      setSelectedSlug(serviceParam);
      setModalOpen(true);
    }
  }, []);

  const filteredServices = useMemo(
    () => getServicesByAudience(audienceFilter),
    [audienceFilter]
  );

  const selectedService = selectedSlug ? getServiceBySlug(selectedSlug) ?? null : null;

  function handleLearnMore(slug: string) {
    setSelectedSlug(slug);
    setModalOpen(true);
  }

  function handleCloseModal() {
    setModalOpen(false);
    setSelectedSlug(null);
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

      <div className="mb-8 flex justify-center">
        <ServiceAudienceFilter value={audienceFilter} onChange={setAudienceFilter} />
      </div>

      {!isLoggedIn && (
        <div className="mb-10 rounded-2xl border border-cyan-500/15 bg-cyan-500/5 p-6 text-center">
          <p className="text-sm text-ni-muted">
            {SERVICE_ACCOUNT_NOTE}{" "}
            <Link
              href={buildPortalAuthUrl("signup", "/services")}
              className="font-medium text-cyan-300 underline-offset-2 hover:underline"
            >
              Create Free Account
            </Link>
          </p>
        </div>
      )}

      <div className="grid gap-6 sm:grid-cols-2">
        {filteredServices.map((service) => (
          <ServiceOfferingCard
            key={service.slug}
            service={service}
            onLearnMore={handleLearnMore}
          />
        ))}
      </div>

      {filteredServices.length === 0 && (
        <p className="mt-8 text-center text-ni-muted">No services match this filter.</p>
      )}

      <ServiceReviews />

      <ServiceDetailModal
        service={selectedService}
        isOpen={modalOpen}
        onClose={handleCloseModal}
        isLoggedIn={isLoggedIn}
      />

      <ServiceAssistantWidget
        onServiceSelect={(slug) => {
          setSelectedSlug(slug);
          setModalOpen(true);
        }}
      />
    </>
  );
}
