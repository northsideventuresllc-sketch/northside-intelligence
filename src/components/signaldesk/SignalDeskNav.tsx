"use client";

import Link from "next/link";
import Image from "next/image";
import { AccountMenuDropdown } from "@/components/account/AccountMenuDropdown";

interface Props {
  email?: string;
  planLabel?: string;
  onSignOut?: () => void;
}

export function SignalDeskNav({ email, planLabel, onSignOut }: Props) {
  return (
    <header className="relative z-20 border-b border-white/10 bg-black/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/signaldesk" className="group flex items-center gap-3">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-1.5 transition group-hover:scale-105 group-hover:border-emerald-500/60 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
            <Image
              src="/logos/signaldesk.svg"
              alt="Signal Desk"
              width={26}
              height={26}
              className="transition"
            />
          </div>
          <div>
            <span className="text-lg font-bold tracking-tight text-white group-hover:text-emerald-400 transition">
              Signal Desk
            </span>
            <span className="ml-2 text-[10px] font-mono uppercase tracking-wider text-emerald-400/80 rounded bg-emerald-950/60 border border-emerald-800/50 px-1.5 py-0.5">
              Live Intel Feed
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-4">
          <Link
            href="/signaldesk/settings"
            className="text-xs font-medium text-white/70 hover:text-white transition flex items-center gap-1.5"
          >
            <span>⚙️ Settings</span>
          </Link>

          {email ? (
            <>
              <span className="hidden text-xs text-white/60 sm:block">{email}</span>
              {planLabel && (
                <span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-medium text-emerald-300">
                  {planLabel}
                </span>
              )}
              <AccountMenuDropdown variant="portal" triggerLabel="Account" />
              {onSignOut && (
                <button
                  onClick={onSignOut}
                  className="text-xs text-white/60 transition hover:text-white"
                >
                  Sign Out
                </button>
              )}
            </>
          ) : (
            <>
              <Link
                href="/auth/signin?returnTo=/signaldesk"
                className="text-xs text-white/70 transition hover:text-white"
              >
                Sign In
              </Link>
              <Link
                href="/auth/signup?returnTo=/signaldesk"
                className="rounded-xl bg-gradient-to-r from-emerald-600 to-amber-600 px-4 py-2 text-xs font-semibold text-white shadow-[0_0_20px_rgba(16,185,129,0.35)] transition hover:opacity-90"
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
