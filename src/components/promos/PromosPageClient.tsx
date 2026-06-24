"use client";

import { useCallback, useEffect, useState } from "react";
import { PromoCard } from "@/components/promos/PromoCard";
import { PromoEmailGate } from "@/components/promos/PromoEmailGate";
import type { UserPromo } from "@/lib/promos/types";

export function PromosPageClient() {
  const [emailListRequired, setEmailListRequired] = useState<boolean | null>(null);
  const [promos, setPromos] = useState<UserPromo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadPromos = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/promos");
      if (res.status === 401) {
        window.location.href = "/auth/signin?returnTo=/promos";
        return;
      }
      const data = (await res.json()) as {
        emailListRequired?: boolean;
        promos?: UserPromo[];
        error?: string;
      };
      if (!res.ok) {
        setError(data.error ?? "Could not load promos");
        return;
      }
      setEmailListRequired(data.emailListRequired ?? false);
      setPromos(data.promos ?? []);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPromos();
  }, [loadPromos]);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-ni-muted">Loading your promos…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  if (emailListRequired) {
    return <PromoEmailGate onSubscribed={loadPromos} />;
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Your Promos</h1>
        <p className="mt-2 text-ni-muted">
          Personalized offers refreshed weekly. Each promo includes an expiration date — claim
          them before they expire.
        </p>
      </div>

      {promos.length === 0 ? (
        <div className="rounded-xl border border-white/10 bg-ni-navy/30 px-6 py-12 text-center">
          <p className="text-ni-muted">
            No active promos right now. Check back soon — new offers are added every week.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {promos.map((promo) => (
            <PromoCard key={promo.id} promo={promo} />
          ))}
        </div>
      )}
    </div>
  );
}
