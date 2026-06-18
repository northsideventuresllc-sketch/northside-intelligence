"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ACCOUNT_SECTIONS } from "@/lib/account/sections";
import { SignOutButton } from "@/components/auth/SignOutButton";

type AccountMenuVariant = "portal" | "replyflow";

interface AccountMenuDropdownProps {
  variant?: AccountMenuVariant;
  triggerLabel?: string;
  className?: string;
}

export function AccountMenuDropdown({
  variant = "portal",
  triggerLabel = "Account",
  className = "",
}: AccountMenuDropdownProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const isReplyflow = variant === "replyflow";

  const triggerClass = isReplyflow
    ? "rounded-lg border border-rf-violet/30 bg-rf-violet/10 px-3 py-1.5 text-sm font-medium text-rf-violet transition hover:border-rf-rose/40 hover:bg-rf-violet/20"
    : "rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-3 py-1.5 text-sm font-medium text-cyan-300 transition hover:border-cyan-400/50 hover:bg-cyan-500/20";

  const panelClass = isReplyflow
    ? "absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-xl border border-white/10 bg-rf-bg/95 shadow-xl backdrop-blur-xl"
    : "absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-xl border border-white/10 bg-ni-bg/95 shadow-xl backdrop-blur-xl";

  const linkClass = isReplyflow
    ? "block px-4 py-2.5 text-sm text-rf-muted transition hover:bg-white/5 hover:text-rf-rose"
    : "block px-4 py-2.5 text-sm text-ni-muted transition hover:bg-white/5 hover:text-cyan-300";

  const dividerClass = isReplyflow ? "border-t border-white/10" : "border-t border-white/10";

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="menu"
        className={triggerClass}
      >
        {triggerLabel}
      </button>

      {open && (
        <div className={panelClass} role="menu">
          <div className="py-1">
            {ACCOUNT_SECTIONS.map((section) => (
              <Link
                key={section.id}
                href={section.href}
                role="menuitem"
                className={linkClass}
                onClick={() => setOpen(false)}
              >
                {section.label}
              </Link>
            ))}
          </div>
          <div className={`${dividerClass} p-3`}>
            <SignOutButton
              className={
                isReplyflow
                  ? "w-full rounded-lg border border-white/10 px-4 py-2 text-sm text-rf-muted transition hover:border-rf-rose/30 hover:text-rf-rose disabled:opacity-50"
                  : undefined
              }
            />
          </div>
        </div>
      )}
    </div>
  );
}
