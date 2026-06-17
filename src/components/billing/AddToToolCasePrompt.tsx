"use client";

import { useState } from "react";
import Link from "next/link";

interface AddToToolCasePromptProps {
  toolSlug: string;
  toolName: string;
  variant?: "portal" | "replyflow";
}

export function AddToToolCasePrompt({
  toolSlug,
  toolName,
  variant = "portal",
}: AddToToolCasePromptProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const isReplyflow = variant === "replyflow";

  async function handleAdd() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/billing/toolkit/add-free", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toolSlug }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Could not add tool");
        return;
      }
      window.location.reload();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const cardClass = isReplyflow ? "rf-glass rounded-3xl p-8 text-center" : "glass-panel p-8 text-center";
  const mutedClass = isReplyflow ? "text-rf-muted" : "text-ni-muted";
  const buttonClass = isReplyflow
    ? "rounded-2xl bg-gradient-to-r from-rf-rose via-rf-coral to-rf-violet px-8 py-3 text-sm font-semibold text-white shadow-rf-glow disabled:opacity-50"
    : "rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-6 py-2.5 text-sm font-semibold text-cyan-300 disabled:opacity-50";

  return (
    <div className={cardClass}>
      <p className={`text-lg font-semibold text-white`}>Add {toolName} to Your Toolkit</p>
      <p className={`mt-2 text-sm ${mutedClass}`}>
        You need to add {toolName} to your Toolkit before you can use it. Free tier usage is
        included — upgrade anytime for unlimited access.
      </p>
      <button
        type="button"
        onClick={handleAdd}
        disabled={loading}
        className={`mt-6 ${buttonClass}`}
      >
        {loading ? "Adding…" : "Add to Toolkit"}
      </button>
      {error && (
        <p className="mt-3 text-sm text-red-300" role="alert">
          {error}
        </p>
      )}
      <p className={`mt-4 text-xs ${mutedClass}`}>
        Or manage all tools in your{" "}
        <Link href="/toolkit" className={isReplyflow ? "text-rf-rose hover:underline" : "text-cyan-300 hover:underline"}>
          Toolkit
        </Link>
      </p>
    </div>
  );
}
