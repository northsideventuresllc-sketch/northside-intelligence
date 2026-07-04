"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { suffix: "/dashboard", label: "Command", icon: "◈" },
];

export function Sidebar({ basePath }: { basePath: string }) {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col border-r border-axon-border bg-axon-surface">
      <div className="border-b border-axon-border px-6 py-5">
        <span className="text-xl font-semibold tracking-[0.2em] text-axon-blue-glow">AXON</span>
        <p className="mt-1 text-[10px] uppercase tracking-wider text-axon-muted">Command Center</p>
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {NAV.map((item) => {
          const href = `${basePath}${item.suffix}`;
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={item.suffix}
              href={href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${
                active
                  ? "bg-axon-elevated text-axon-blue-glow"
                  : "text-axon-muted hover:bg-axon-elevated hover:text-axon-text"
              }`}
            >
              <span aria-hidden>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-axon-border p-3">
        <Link
          href="/"
          className="block rounded-lg px-3 py-2 text-xs text-axon-muted transition hover:bg-axon-elevated hover:text-axon-text"
        >
          Back to Portal
        </Link>
      </div>
    </aside>
  );
}
