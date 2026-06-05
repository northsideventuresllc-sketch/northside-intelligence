"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { Nav } from "@/components/landing/Nav";
import { Footer } from "@/components/landing/Footer";

export default function ReportBugPage() {
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitted(true);
  }

  return (
    <main className="min-h-screen bg-ni-bg">
      <Nav />
      <div className="mx-auto max-w-xl px-6 pb-16 pt-28">
        <Link href="/" className="mb-8 inline-block text-sm text-ni-muted transition hover:text-cyan-300">
          ← Back to home
        </Link>
        <h1 className="mb-2 text-3xl font-semibold text-white">Report a Bug</h1>
        <p className="mb-8 text-ni-muted">
          Found something broken? Tell us what happened and we&apos;ll investigate.
        </p>
        {submitted ? (
          <div className="glass-panel p-8 text-center">
            <p className="text-cyan-300">Thanks — your report was received.</p>
            <p className="mt-2 text-sm text-ni-muted">
              For urgent issues, email{" "}
              <a href="mailto:support@northsideintelligence.com" className="text-cyan-400">
                support@northsideintelligence.com
              </a>
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="glass-panel space-y-4 p-8">
            <div>
              <label htmlFor="email" className="mb-1 block text-sm text-ni-muted">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="w-full rounded-xl border border-white/10 bg-ni-bg/80 px-4 py-3 text-white outline-none focus:border-cyan-500/40"
              />
            </div>
            <div>
              <label htmlFor="product" className="mb-1 block text-sm text-ni-muted">
                Product / page
              </label>
              <input
                id="product"
                name="product"
                type="text"
                required
                placeholder="e.g. ReplyFlow, signup, match-fit.net"
                className="w-full rounded-xl border border-white/10 bg-ni-bg/80 px-4 py-3 text-white outline-none focus:border-cyan-500/40"
              />
            </div>
            <div>
              <label htmlFor="details" className="mb-1 block text-sm text-ni-muted">
                What went wrong?
              </label>
              <textarea
                id="details"
                name="details"
                required
                rows={5}
                className="w-full rounded-xl border border-white/10 bg-ni-bg/80 px-4 py-3 text-white outline-none focus:border-cyan-500/40"
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-xl border border-cyan-500/50 bg-cyan-500/15 py-3 font-medium text-cyan-300 transition hover:bg-cyan-500/25"
            >
              Submit report
            </button>
          </form>
        )}
      </div>
      <Footer />
    </main>
  );
}
