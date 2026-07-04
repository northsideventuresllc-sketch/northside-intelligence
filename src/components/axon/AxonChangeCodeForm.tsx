"use client";

import { useState } from "react";

export function AxonChangeCodeForm() {
  const [currentCode, setCurrentCode] = useState("");
  const [newCode, setNewCode] = useState("");
  const [confirmCode, setConfirmCode] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");

    if (newCode !== confirmCode) {
      setError("New codes do not match.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/axon/change-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentCode, newCode }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Could not update code.");
        return;
      }
      setMessage("Access code updated.");
      setCurrentCode("");
      setNewCode("");
      setConfirmCode("");
    } catch {
      setError("Could not update code.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="glass-panel mt-8 max-w-md space-y-4 p-6">
      <h2 className="text-lg font-semibold text-white">Change Access Code</h2>
      <p className="text-sm text-ni-muted">Update the code used to enter AXON from the portal.</p>
      <input
        type="password"
        value={currentCode}
        onChange={(e) => setCurrentCode(e.target.value)}
        placeholder="Current code"
        className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white"
      />
      <input
        type="password"
        value={newCode}
        onChange={(e) => setNewCode(e.target.value)}
        placeholder="New code"
        className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white"
      />
      <input
        type="password"
        value={confirmCode}
        onChange={(e) => setConfirmCode(e.target.value)}
        placeholder="Confirm new code"
        className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white"
      />
      {error && <p className="text-sm text-red-300">{error}</p>}
      {message && <p className="text-sm text-cyan-300">{message}</p>}
      <button
        type="submit"
        disabled={saving}
        className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-2.5 text-sm font-semibold text-cyan-200 disabled:opacity-50"
      >
        {saving ? "Saving…" : "Update Code"}
      </button>
    </form>
  );
}
