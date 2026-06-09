"use client";

import Link from "next/link";
import { portalSignInUrl, portalSignUpUrl, replyflowPath } from "@/lib/replyflow/auth";

interface Props {
  email?: string;
  planLabel?: string;
  onSignOut?: () => void;
}

export function ReplyFlowNav({ email, planLabel, onSignOut }: Props) {
  return (
    <header className="relative z-20 border-b border-white/10 bg-rf-bg/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link href={replyflowPath("/")} className="group flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-rf-rose to-rf-violet text-sm font-bold shadow-rf-glow transition group-hover:scale-105">
            RF
          </span>
          <span className="text-lg font-semibold rf-gradient-text">ReplyFlow</span>
        </Link>

        <div className="flex items-center gap-3">
          {email ? (
            <>
              <span className="hidden text-sm text-rf-muted sm:block">{email}</span>
              {planLabel && (
                <span className="rounded-full border border-rf-violet/40 bg-rf-violet/10 px-2.5 py-0.5 text-xs font-medium text-rf-violet">
                  {planLabel}
                </span>
              )}
              <a
                href="https://northsideintelligence.com/account"
                className="text-sm text-rf-muted transition hover:text-rf-rose"
              >
                NI Account
              </a>
              {onSignOut && (
                <button
                  onClick={onSignOut}
                  className="text-sm text-rf-muted transition hover:text-white"
                >
                  Sign Out
                </button>
              )}
            </>
          ) : (
            <>
              <a
                href={portalSignInUrl()}
                className="text-sm text-rf-muted transition hover:text-rf-rose"
              >
                Sign In
              </a>
              <a
                href={portalSignUpUrl()}
                className="rounded-xl bg-gradient-to-r from-rf-rose to-rf-coral px-4 py-2 text-sm font-semibold text-white shadow-rf-glow transition hover:opacity-90"
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
