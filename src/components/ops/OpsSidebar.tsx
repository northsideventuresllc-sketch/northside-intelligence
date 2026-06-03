"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { BRAND } from "@/lib/constants";

const NAV_ITEMS = [
  { href: "/ops", label: "Dashboard", exact: true },
  { href: "/ops#sector3", label: "Sector 3 Tools" },
  { href: "/ops#matchfit", label: "Match Fit" },
  { href: "/ops#revenue", label: "Revenue Tracker" },
  { href: "/ops#links", label: "Quick Links" },
];

export function OpsSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-white/10 bg-ni-navy/30">
      <div className="flex items-center gap-3 border-b border-white/10 px-5 py-5">
        <Image src="/logo.png" alt="NI" width={32} height={32} className="h-8 w-8" />
        <div>
          <p className="text-sm font-semibold text-white">NI Ops</p>
          <p className="text-xs text-ni-muted">Internal</p>
        </div>
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {NAV_ITEMS.map((item) => {
          const active =
            item.exact && pathname === item.href
              ? pathname === "/ops"
              : false;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block rounded-lg px-3 py-2 text-sm transition ${
                active
                  ? "bg-cyan-500/15 text-cyan-300"
                  : "text-ni-muted hover:bg-white/5 hover:text-white"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-white/10 p-4">
        <p className="text-xs italic text-ni-muted/80">&ldquo;{BRAND.motto}&rdquo;</p>
      </div>
    </aside>
  );
}
