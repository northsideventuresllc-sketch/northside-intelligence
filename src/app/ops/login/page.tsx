"use client";

import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState, Suspense } from "react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from") ?? "/ops";
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/ops/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        setError(data.error ?? "Invalid credentials");
        return;
      }

      router.push(from);
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
      <div>
        <label htmlFor="password" className="mb-1 block text-sm text-ni-muted">
          Admin password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
          className="w-full rounded-lg border border-white/10 bg-ni-bg px-4 py-3 text-white outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30"
          placeholder="Enter NI admin secret"
        />
      </div>
      {error && (
        <p className="text-sm text-red-400" role="alert">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-cyan-500/20 py-3 font-medium text-cyan-300 ring-1 ring-cyan-500/40 transition hover:bg-cyan-500/30 disabled:opacity-50"
      >
        {loading ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}

export default function OpsLoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-ni-bg px-6">
      <div className="mb-8 flex flex-col items-center">
        <Image src="/logo.png" alt="NI" width={64} height={64} className="mb-4" />
        <h1 className="text-xl font-semibold text-white">NI Ops Login</h1>
        <p className="mt-1 text-sm text-ni-muted">Authorized access only</p>
      </div>
      <Suspense fallback={<p className="text-ni-muted">Loading…</p>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
