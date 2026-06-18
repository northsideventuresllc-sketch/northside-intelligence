"use client";

import { FormEvent, useState } from "react";
import type { AccountPageData } from "@/lib/account/get-account-page-data";

type AccountType = "personal" | "business";

interface AccountTypeSectionProps {
  initialProfile: AccountPageData["initialProfile"];
}

export function AccountTypeSection({ initialProfile }: AccountTypeSectionProps) {
  const [accountType, setAccountType] = useState<AccountType>(initialProfile.accountType);
  const [businessName, setBusinessName] = useState(initialProfile.businessName ?? "");
  const [businessWebsite, setBusinessWebsite] = useState(initialProfile.businessWebsite ?? "");
  const [businessSize, setBusinessSize] = useState(initialProfile.businessSize ?? "");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function saveAccountType(e: FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);
    try {
      const res = await fetch("/api/account/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountType,
          businessName: accountType === "business" ? businessName : null,
          businessWebsite: accountType === "business" ? businessWebsite : null,
          businessSize: accountType === "business" ? businessSize : null,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Failed to update account type");
        return;
      }
      setMessage("Account type updated.");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      {message && (
        <p className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
          {message}
        </p>
      )}
      {error && (
        <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300" role="alert">
          {error}
        </p>
      )}

      <section className="glass-panel p-6">
        <h2 className="mb-1 text-lg font-semibold text-white">Account Type</h2>
        <p className="mb-4 text-sm text-ni-muted">
          Choose whether you use NI as an individual or on behalf of a business or organization.
        </p>
        <form onSubmit={saveAccountType} className="space-y-4">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setAccountType("personal")}
              className={`flex-1 rounded-xl border px-4 py-3 text-sm font-medium transition ${
                accountType === "personal"
                  ? "border-cyan-500/40 bg-cyan-500/10 text-cyan-300"
                  : "border-white/10 bg-white/5 text-ni-muted hover:border-white/20"
              }`}
            >
              Personal Account
            </button>
            <button
              type="button"
              onClick={() => setAccountType("business")}
              className={`flex-1 rounded-xl border px-4 py-3 text-sm font-medium transition ${
                accountType === "business"
                  ? "border-cyan-500/40 bg-cyan-500/10 text-cyan-300"
                  : "border-white/10 bg-white/5 text-ni-muted hover:border-white/20"
              }`}
            >
              Business Account
            </button>
          </div>
          {accountType === "business" && (
            <>
              <div>
                <label htmlFor="businessName" className="mb-1 block text-sm text-ni-muted">
                  Business / Organization Name
                </label>
                <input
                  id="businessName"
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  required
                  className="w-full rounded-xl border border-white/10 bg-ni-bg/80 px-4 py-3 text-white outline-none transition focus:border-cyan-500/50"
                />
              </div>
              <div>
                <label htmlFor="businessWebsite" className="mb-1 block text-sm text-ni-muted">
                  Business Website (Optional)
                </label>
                <input
                  id="businessWebsite"
                  type="url"
                  value={businessWebsite}
                  onChange={(e) => setBusinessWebsite(e.target.value)}
                  placeholder="https://"
                  className="w-full rounded-xl border border-white/10 bg-ni-bg/80 px-4 py-3 text-white outline-none transition focus:border-cyan-500/50"
                />
              </div>
              <div>
                <label htmlFor="businessSize" className="mb-1 block text-sm text-ni-muted">
                  Organization Size (Optional)
                </label>
                <select
                  id="businessSize"
                  value={businessSize}
                  onChange={(e) => setBusinessSize(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-ni-bg/80 px-4 py-3 text-white outline-none transition focus:border-cyan-500/50"
                >
                  <option value="">Select size</option>
                  <option value="1-10">1–10 employees</option>
                  <option value="11-50">11–50 employees</option>
                  <option value="51-200">51–200 employees</option>
                  <option value="200+">200+ employees</option>
                </select>
              </div>
            </>
          )}
          <button
            type="submit"
            disabled={loading}
            className="rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-5 py-2.5 text-sm font-medium text-cyan-300 transition hover:bg-cyan-500/20 disabled:opacity-50"
          >
            {loading ? "Saving…" : "Save Account Type"}
          </button>
        </form>
      </section>
    </div>
  );
}
