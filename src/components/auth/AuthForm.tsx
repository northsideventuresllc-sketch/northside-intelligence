"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import { AnimatedBackground } from "@/components/landing/AnimatedBackground";
import { Logo3D } from "@/components/landing/Logo3D";
import { buildPortalAuthUrl, resolvePostAuthRedirect } from "@/lib/ni-auth";

type AuthMode = "signin" | "signup";
type Step = "credentials" | "verify";

interface AuthFormProps {
  mode: AuthMode;
}

export function AuthForm({ mode }: AuthFormProps) {
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo");
  const [step, setStep] = useState<Step>("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const alternateHref = useMemo(() => {
    const other: AuthMode = mode === "signup" ? "signin" : "signup";
    return buildPortalAuthUrl(other, returnTo);
  }, [mode, returnTo]);

  async function handleCredentialsSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const endpoint = mode === "signup" ? "/api/auth/signup" : "/api/auth/signin";
      const body =
        mode === "signup"
          ? { email, password, fullName: fullName || undefined, returnTo }
          : { email, password, returnTo };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = (await res.json()) as { error?: string; step?: string; email?: string };

      if (!res.ok) {
        setError(data.error ?? "Something went wrong");
        return;
      }

      if (data.email) setEmail(data.email);
      setStep("verify");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifySubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });

      const data = (await res.json()) as { error?: string; returnTo?: string };

      if (!res.ok) {
        setError(data.error ?? "Invalid verification code");
        return;
      }

      window.location.href = resolvePostAuthRedirect(data.returnTo ?? returnTo);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const title = mode === "signup" ? "Create your NI account" : "Welcome back";
  const subtitle =
    step === "verify"
      ? `Enter the 6-digit code sent to ${email}`
      : mode === "signup"
        ? "One account for every Northside Intelligence tool"
        : "Sign in to access all Sector 3 tools";

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 py-24">
      <AnimatedBackground />
      <div
        className="relative z-10 w-full max-w-md"
        style={{ perspective: "1200px", transformStyle: "preserve-3d" }}
      >
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-6" style={{ transform: "translateZ(40px)" }}>
            <Logo3D variant="full" />
          </div>
          <h1 className="text-2xl font-semibold text-white">{title}</h1>
          <p className="mt-2 text-sm text-ni-muted">{subtitle}</p>
          {returnTo && step === "credentials" && (
            <p className="mt-2 text-xs text-cyan-400/80">
              After verification you&apos;ll return to your tool.
            </p>
          )}
        </div>

        <div
          className="glass-panel p-8 shadow-[0_24px_80px_rgba(0,0,0,0.5),0_0_60px_rgba(0,212,255,0.08)]"
          style={{
            transform: "rotateX(2deg) translateZ(20px)",
            transformStyle: "preserve-3d",
          }}
        >
          {step === "credentials" ? (
            <form onSubmit={handleCredentialsSubmit} className="space-y-4">
              {mode === "signup" && (
                <div>
                  <label htmlFor="fullName" className="mb-1 block text-sm text-ni-muted">
                    Full name
                  </label>
                  <input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    autoComplete="name"
                    className="w-full rounded-xl border border-white/10 bg-ni-bg/80 px-4 py-3 text-white outline-none transition focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30"
                    placeholder="Optional"
                  />
                </div>
              )}
              <div>
                <label htmlFor="email" className="mb-1 block text-sm text-ni-muted">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="w-full rounded-xl border border-white/10 bg-ni-bg/80 px-4 py-3 text-white outline-none transition focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30"
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <label htmlFor="password" className="mb-1 block text-sm text-ni-muted">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  autoComplete={mode === "signup" ? "new-password" : "current-password"}
                  className="w-full rounded-xl border border-white/10 bg-ni-bg/80 px-4 py-3 text-white outline-none transition focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30"
                  placeholder="At least 8 characters"
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
                className="w-full rounded-xl border border-cyan-500/50 bg-cyan-500/15 py-3 font-medium text-cyan-300 shadow-[0_8px_32px_rgba(0,212,255,0.15)] transition hover:border-cyan-400/70 hover:bg-cyan-500/25 disabled:opacity-50"
              >
                {loading ? "Sending code…" : mode === "signup" ? "Create account" : "Continue"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifySubmit} className="space-y-4">
              <div>
                <label htmlFor="code" className="mb-1 block text-sm text-ni-muted">
                  Verification code
                </label>
                <input
                  id="code"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  required
                  autoComplete="one-time-code"
                  className="w-full rounded-xl border border-white/10 bg-ni-bg/80 px-4 py-3 text-center text-2xl tracking-[0.4em] text-white outline-none transition focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30"
                  placeholder="000000"
                />
              </div>
              {error && (
                <p className="text-sm text-red-400" role="alert">
                  {error}
                </p>
              )}
              <button
                type="submit"
                disabled={loading || code.length !== 6}
                className="w-full rounded-xl border border-cyan-500/50 bg-cyan-500/15 py-3 font-medium text-cyan-300 shadow-[0_8px_32px_rgba(0,212,255,0.15)] transition hover:border-cyan-400/70 hover:bg-cyan-500/25 disabled:opacity-50"
              >
                {loading ? "Verifying…" : "Verify & continue"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setStep("credentials");
                  setCode("");
                  setError("");
                }}
                className="w-full text-sm text-ni-muted transition hover:text-cyan-300"
              >
                ← Back
              </button>
            </form>
          )}

          <p className="mt-6 text-center text-sm text-ni-muted">
            {mode === "signup" ? (
              <>
                Already have an account?{" "}
                <Link href={alternateHref} className="text-cyan-400 hover:text-cyan-300">
                  Sign in
                </Link>
              </>
            ) : (
              <>
                New here?{" "}
                <Link href={alternateHref} className="text-cyan-400 hover:text-cyan-300">
                  Create an account
                </Link>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
