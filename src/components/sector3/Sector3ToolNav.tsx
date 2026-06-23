"use client";

import Image from "next/image";
import Link from "next/link";
import { AccountMenuDropdown } from "@/components/account/AccountMenuDropdown";
import { getToolBrand } from "@/lib/constants";
import type { Sector3ToolRuntimeConfig } from "@/lib/sector3-tools/types";
import { createSector3ToolAuth } from "@/lib/sector3-tools/auth";

interface Props {
  config: Sector3ToolRuntimeConfig;
  email?: string;
  planLabel?: string;
  onSignOut?: () => void;
}

export function Sector3ToolNav({ config, email, planLabel, onSignOut }: Props) {
  const auth = createSector3ToolAuth(config);
  const brand = getToolBrand(config.slug);

  return (
    <header className="relative z-20 border-b border-white/10 bg-[#07080C]/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link href={auth.path("/")} className="group flex items-center gap-2">
          <Image
            src={brand.logo}
            alt={config.displayName}
            width={36}
            height={36}
            className="transition group-hover:scale-105"
          />
          <span
            className={`text-lg font-semibold bg-gradient-to-r ${brand.brandGradient} bg-clip-text text-transparent`}
          >
            {config.displayName}
          </span>
        </Link>

        <div className="flex items-center gap-3">
          {email ? (
            <>
              <span className="hidden text-sm text-white/60 sm:block">{email}</span>
              {planLabel && (
                <span
                  className="rounded-full border px-2.5 py-0.5 text-xs font-medium"
                  style={{ borderColor: `${brand.brandColor}66`, color: brand.brandColor }}
                >
                  {planLabel}
                </span>
              )}
              <AccountMenuDropdown variant="portal" triggerLabel="NI Account" />
              {onSignOut && (
                <button
                  type="button"
                  onClick={onSignOut}
                  className="text-sm text-white/60 transition hover:text-white"
                >
                  Sign Out
                </button>
              )}
            </>
          ) : (
            <>
              <Link
                href={auth.portalSignInUrl()}
                className="text-sm text-white/70 transition hover:text-white"
              >
                Sign In
              </Link>
              <Link
                href={auth.portalSignUpUrl()}
                className="rounded-xl px-4 py-2 text-sm font-semibold text-[#07080C]"
                style={{ backgroundColor: brand.brandColor }}
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
