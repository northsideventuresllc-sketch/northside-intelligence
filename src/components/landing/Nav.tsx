"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { SignOutButton } from "@/components/auth/SignOutButton";

type PortalUser = {
  id: string;
  email: string;
  fullName: string | null;
};

function displayLabel(user: PortalUser) {
  return user.fullName?.trim() || user.email.split("@")[0] || user.email;
}

export function Nav() {
  const [user, setUser] = useState<PortalUser | null>(null);
  const [loaded, setLoaded] = useState(false);

  const loadUser = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", { cache: "no-store" });
      const data = (await res.json()) as { user: PortalUser | null };
      setUser(data.user);
    } catch {
      setUser(null);
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    void loadUser();
  }, [loadUser]);

  return (
    <header className="fixed top-0 z-50 w-full border-b border-cyan-500/10 bg-ni-bg/70 shadow-[0_4px_30px_rgba(0,0,0,0.3),inset_0_-1px_0_rgba(0,212,255,0.1)] backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="group flex items-center gap-3 transition">
          <div className="rounded-xl border border-cyan-500/20 bg-ni-navy/50 p-1 shadow-[0_0_20px_rgba(0,212,255,0.1)] transition group-hover:border-cyan-400/40 group-hover:shadow-[0_0_30px_rgba(0,212,255,0.2)]">
            <Image
              src="/ni-emblem.svg"
              alt="Northside Intelligence"
              width={48}
              height={48}
              className="h-8 w-8 object-contain drop-shadow-[0_0_12px_rgba(0,212,255,0.35)]"
              priority
            />
          </div>
          <span className="hidden text-sm font-medium text-white/90 sm:inline">
            Northside Intelligence
          </span>
        </Link>
        <nav className="flex items-center gap-3 sm:gap-6">
          <a
            href="/#tools"
            className="text-sm text-ni-muted transition hover:text-cyan-300"
          >
            Tools
          </a>
          <a
            href="/#mission"
            className="hidden text-sm text-ni-muted transition hover:text-cyan-300 sm:inline"
          >
            Mission
          </a>
          <a
            href="/#ecosystem"
            className="text-sm text-ni-muted transition hover:text-cyan-300"
          >
            Ecosystem
          </a>
          {!loaded ? (
            <span className="hidden h-4 w-20 animate-pulse rounded bg-white/10 sm:inline" aria-hidden />
          ) : user ? (
            <>
              <span className="hidden max-w-[160px] truncate text-sm text-ni-muted sm:inline">
                {displayLabel(user)}
              </span>
              <Link
                href="/account"
                className="text-sm text-ni-muted transition hover:text-cyan-300"
              >
                Account
              </Link>
              <SignOutButton variant="nav" onSignedOut={() => setUser(null)} />
            </>
          ) : (
            <>
              <Link
                href="/auth/signin"
                className="text-sm text-ni-muted transition hover:text-cyan-300"
              >
                Sign in
              </Link>
              <Link
                href="/auth/signup"
                className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-3 py-1.5 text-sm font-medium text-cyan-300 transition hover:border-cyan-400/50 hover:bg-cyan-500/20"
              >
                Sign up
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
