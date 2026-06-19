"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ACCOUNT_SECTIONS } from "@/lib/account/sections";

type Sector3AccountSettingsNavVariant = "replyflow" | "portal";

interface Sector3AccountSettingsNavProps {
  variant?: Sector3AccountSettingsNavVariant;
}

export function Sector3AccountSettingsNav({
  variant = "replyflow",
}: Sector3AccountSettingsNavProps) {
  const pathname = usePathname();
  const isReplyflow = variant === "replyflow";

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
                ? isReplyflow
                  ? "border-rf-rose/40 bg-rf-rose/10 text-rf-rose"
                  : "border-cyan-500/40 bg-cyan-500/10 text-cyan-300"
                : isReplyflow
                  ? "border-white/10 bg-white/5 text-rf-muted hover:border-rf-rose/30 hover:text-rf-rose"
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
