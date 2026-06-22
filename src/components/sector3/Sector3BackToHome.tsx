"use client";

import Link from "next/link";
import { portalHomeUrl } from "@/lib/ni-auth";
import { useEffect, useState } from "react";

interface Sector3BackToHomeProps {
  variant?: "replyflow" | "grantbot" | "portal";
}

export function Sector3BackToHome({ variant = "replyflow" }: Sector3BackToHomeProps) {
  const [href, setHref] = useState("/");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data: { user?: unknown }) => {
        if (!cancelled) setHref(portalHomeUrl(!!data.user));
      })
      .catch(() => {
        if (!cancelled) setHref("/");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const className =
    variant === "replyflow"
      ? "inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-medium text-rf-muted transition hover:border-rf-rose/40 hover:bg-white/10 hover:text-rf-rose"
      : variant === "grantbot"
        ? "inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-medium text-ni-muted transition hover:border-emerald-400/40 hover:bg-white/10 hover:text-emerald-300"
        : "inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-medium text-white/80 transition hover:border-white/25 hover:bg-white/10 hover:text-white";

  return (
    <div className="relative z-10 border-t border-white/10 py-8 text-center">
      <Link href={href} className={className}>
        ← Back to Home
      </Link>
    </div>
  );
}
