"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type SignOutButtonProps = {
  variant?: "default" | "nav" | "replyflow";
  onSignedOut?: () => void;
};

export function SignOutButton({ variant = "default", onSignedOut }: SignOutButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSignOut() {
    setLoading(true);
    try {
      await fetch("/api/auth/signout", { method: "POST" });
      onSignedOut?.();
      router.push("/");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  const className =
    variant === "nav"
      ? "rounded-lg border border-white/10 px-3 py-1.5 text-sm text-ni-muted transition hover:border-white/20 hover:text-white disabled:opacity-50"
      : variant === "replyflow"
        ? "text-sm text-rf-muted transition hover:text-white disabled:opacity-50"
        : "w-full rounded-xl border border-white/10 px-6 py-3 text-sm text-ni-muted transition hover:border-white/20 hover:text-white disabled:opacity-50 sm:w-auto";

  return (
    <button
      type="button"
      onClick={handleSignOut}
      disabled={loading}
      className={className}
    >
      {loading ? "Signing out…" : "Sign out"}
    </button>
  );
}
