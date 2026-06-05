"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { Nav } from "@/components/landing/Nav";
import { Footer } from "@/components/landing/Footer";

export default function ShareIdeaPage() {
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
        <h1 className="mb-2 text-3xl font-semibold text-white">Share an Idea</h1>
        <p className="mb-8 text-ni-muted">
          Have a feature request or product idea? We&apos;d love to hear it.
        </p>
        {submitted ? (
          <div className="glass-panel p-8 text-center">
            <p className="text-cyan-300">Thanks for sharing your idea with us.</p>
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
              <label htmlFor="title" className="mb-1 block text-sm text-ni-muted">
                Idea title
              </label>
              <input
                id="title"
                name="title"
                type="text"
                required
                className="w-full rounded-xl border border-white/10 bg-ni-bg/80 px-4 py-3 text-white outline-none focus:border-cyan-500/40"
              />
            </div>
            <div>
              <label htmlFor="idea" className="mb-1 block text-sm text-ni-muted">
                Describe your idea
              </label>
              <textarea
                id="idea"
                name="idea"
                required
                rows={5}
                className="w-full rounded-xl border border-white/10 bg-ni-bg/80 px-4 py-3 text-white outline-none focus:border-cyan-500/40"
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-xl border border-cyan-500/50 bg-cyan-500/15 py-3 font-medium text-cyan-300 transition hover:bg-cyan-500/25"
            >
              Submit idea
            </button>
          </form>
        )}
      </div>
      <Footer />
    </main>
  );
}
