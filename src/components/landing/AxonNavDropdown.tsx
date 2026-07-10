"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { axonPublicPath } from "@/lib/axon/paths";

interface AxonNavDropdownProps {
  canEnterAxonDash: boolean;
  portalUsername: string | null;
}

export function AxonNavDropdown({ canEnterAxonDash, portalUsername }: AxonNavDropdownProps) {
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

  const dashHref =
    canEnterAxonDash && portalUsername
      ? axonPublicPath(portalUsername, "/dashboard")
      : "#";

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="text-sm font-semibold text-cyan-300 transition hover:text-cyan-200"
      >
        AXON
      </button>

      {open && (
        <div
          className="absolute right-0 top-full z-50 mt-2 w-52 overflow-hidden rounded-xl border border-white/10 bg-ni-bg/95 shadow-xl backdrop-blur-xl"
          role="menu"
        >
          <div className="py-1">
            <Link
              href="/axon"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="block px-4 py-2.5 text-sm text-ni-muted transition hover:bg-white/5 hover:text-cyan-300"
            >
              AXON Home
            </Link>

            {canEnterAxonDash && portalUsername ? (
              <Link
                href={dashHref}
                role="menuitem"
                onClick={() => setOpen(false)}
                className="block px-4 py-2.5 text-sm text-ni-muted transition hover:bg-white/5 hover:text-cyan-300"
              >
                AXON Dash
              </Link>
            ) : (
              <span
                role="menuitem"
                aria-disabled="true"
                title="AXON not available, visit AXON Home for more details."
                className="block cursor-not-allowed px-4 py-2.5 text-sm italic text-ni-muted/40"
              >
                AXON Dash
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
