"use client";

import Link from "next/link";
import Image from "next/image";
import { AccountMenuDropdown } from "@/components/account/AccountMenuDropdown";
import { grantbotPath, portalSignInUrl, portalSignUpUrl } from "@/lib/grantbot/auth";

interface Props {
  email?: string;
  planLabel?: string;
  onSignOut?: () => void;
}

export function GrantBotNav({ email, planLabel, onSignOut }: Props) {
  return (
    <header className="relative z-20 border-b border-white/10 bg-gb-bg/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link href={grantbotPath("/")} className="group flex items-center gap-2">
          <Image
            src="/logos/grantbot.svg"
            alt="GrantBot"
            width={36}
            height={36}
            className="transition group-hover:scale-105"
          />
          <span className="text-lg font-semibold gb-gradient-text">GrantBot</span>
        </Link>

        <div className="flex items-center gap-3">
          {email ? (
            <>
              <span className="hidden text-sm text-gb-muted sm:block">{email}</span>
              {planLabel && (
                <span className="rounded-full border border-gb-emerald/40 bg-gb-emerald/10 px-2.5 py-0.5 text-xs font-medium text-gb-emerald">
                  {planLabel}
                </span>
              )}
              <AccountMenuDropdown variant="grantbot" triggerLabel="NI Account" />
              {onSignOut && (
                <button
                  onClick={onSignOut}
                  className="text-sm text-gb-muted transition hover:text-white"
                >
                  Sign Out
                </button>
              )}
            </>
          ) : (
            <>
              <a
                href={portalSignInUrl()}
                className="text-sm text-gb-muted transition hover:text-gb-emerald"
              >
                Sign In
              </a>
              <a
                href={portalSignUpUrl()}
                className="rounded-xl bg-gradient-to-r from-gb-emerald to-gb-amber px-4 py-2 text-sm font-semibold text-gb-bg shadow-gb-glow transition hover:opacity-90"
              >
                Get Started
              </a>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
