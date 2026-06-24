"use client";

import Image from "next/image";
import Link from "next/link";
import { AccountMenuDropdown } from "@/components/account/AccountMenuDropdown";
import { NotificationsDropdown } from "@/components/notifications/NotificationsDropdown";

interface NavProps {
  isLoggedIn: boolean;
  isMasterAccount: boolean;
  unreadNotificationCount?: number;
}

export function Nav({ isLoggedIn, isMasterAccount, unreadNotificationCount = 0 }: NavProps) {
  return (
    <header className="fixed top-0 z-50 w-full border-b border-cyan-500/10 bg-ni-bg/70 shadow-[0_4px_30px_rgba(0,0,0,0.3),inset_0_-1px_0_rgba(0,212,255,0.1)] backdrop-blur-xl">
      <div className="mx-auto flex min-h-16 max-w-6xl items-center justify-between gap-4 px-4 py-2 sm:px-6">
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
        <nav className="flex flex-wrap items-center justify-end gap-x-3 gap-y-1 sm:gap-x-4 md:gap-x-6">
          {isLoggedIn ? (
            <>
              <Link
                href="/toolkit"
                className="whitespace-nowrap text-sm text-ni-muted transition hover:text-cyan-300"
              >
                Toolkit
              </Link>
              <Link
                href="/store"
                className="whitespace-nowrap text-sm text-ni-muted transition hover:text-cyan-300"
              >
                Smart Store
              </Link>
              <Link
                href="/services"
                className="whitespace-nowrap text-sm text-ni-muted transition hover:text-cyan-300"
              >
                Services
              </Link>
              {isMasterAccount && (
                <Link
                  href="/admin"
                  className="text-sm text-ni-muted transition hover:text-cyan-300"
                >
                  Admin Dashboard
                </Link>
              )}
              <Link
                href="/promos"
                className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-sm font-medium text-amber-300 transition hover:border-amber-400/50 hover:bg-amber-500/20"
              >
                Promos
              </Link>
              <NotificationsDropdown initialUnreadCount={unreadNotificationCount} />
              <AccountMenuDropdown />
            </>
          ) : (
            <>
              <a
                href="/#tools"
                className="text-sm text-ni-muted transition hover:text-cyan-300"
              >
                Tools
              </a>
              <Link
                href="/store"
                className="text-sm text-ni-muted transition hover:text-cyan-300"
              >
                Smart Store
              </Link>
              <Link
                href="/services"
                className="whitespace-nowrap text-sm text-ni-muted transition hover:text-cyan-300"
              >
                Services
              </Link>
              <Link
                href="/promos"
                className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-sm font-medium text-amber-300 transition hover:border-amber-400/50 hover:bg-amber-500/20"
              >
                Promos
              </Link>
              <a
                href="/#pricing"
                className="hidden text-sm text-ni-muted transition hover:text-cyan-300 sm:inline"
              >
                Plans
              </a>
              <a
                href="/#faq"
                className="hidden text-sm text-ni-muted transition hover:text-cyan-300 md:inline"
              >
                FAQ
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
              <Link
                href="/auth/signin"
                className="text-sm text-ni-muted transition hover:text-cyan-300"
              >
                Sign In
              </Link>
              <Link
                href="/auth/signup"
                className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-3 py-1.5 text-sm font-medium text-cyan-300 transition hover:border-cyan-400/50 hover:bg-cyan-500/20"
              >
                Sign Up
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
