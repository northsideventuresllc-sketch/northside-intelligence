"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ACCOUNT_SECTIONS } from "@/lib/account/sections";

export function AccountSettingsNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Account settings"
      className="mb-8 flex flex-wrap justify-center gap-2"
    >
      {ACCOUNT_SECTIONS.map((section) => {
        const isActive = pathname === section.href;
        return (
          <Link
            key={section.id}
            href={section.href}
            className={`rounded-xl border px-4 py-2 text-sm font-medium transition ${
              isActive
                ? "border-cyan-500/40 bg-cyan-500/10 text-cyan-300"
                : "border-white/10 bg-white/5 text-ni-muted hover:border-white/20 hover:text-white"
            }`}
          >
            {section.label}
          </Link>
        );
      })}
    </nav>
  );
}
