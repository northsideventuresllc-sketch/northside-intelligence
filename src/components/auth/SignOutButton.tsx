"use client";

import { useState } from "react";

interface SignOutButtonProps {
  className?: string;
  label?: string;
}

export function SignOutButton({
  className = "w-full rounded-xl border border-white/10 px-6 py-3 text-sm text-ni-muted transition hover:border-white/20 hover:text-white disabled:opacity-50 sm:w-auto",
  label = "Log Out",
}: SignOutButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleSignOut() {
    setLoading(true);
    try {
      const response = await fetch("/api/auth/signout", { method: "POST" });
      if (!response.ok) return;
      // Full navigation clears client auth state (Nav, pricing, etc.) immediately.
      window.location.replace("/");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      disabled={loading}
      className={className}
    >
      {loading ? "Signing Out…" : label}
    </button>
  );
}
