"use client";

import { useState, useEffect } from "react";

interface Props {
  toolSlug: string;
  toolName?: string;
  className?: string;
}

export function UniversalITFeedbackWidget({ toolSlug, toolName, className = "" }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"bug_report" | "feature_request">("bug_report");
  const [subject, setSubject] = useState("");
  const [details, setDetails] = useState("");
  const [severity, setSeverity] = useState<"low" | "medium" | "high">("medium");
  const [category, setCategory] = useState<"feature" | "integration" | "ui_ux" | "agent">("feature");
  const [includeDiagnostics, setIncludeDiagnostics] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [resultMessage, setResultMessage] = useState<{ type: "success" | "error"; text: string; id?: string } | null>(null);

  const displayName = toolName || (toolSlug.charAt(0).toUpperCase() + toolSlug.slice(1));

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!details.trim()) return;

    setSubmitting(true);
    setResultMessage(null);

    const systemContext = includeDiagnostics
      ? {
          url: typeof window !== "undefined" ? window.location.href : "",
          userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
          screen: typeof window !== "undefined" ? `${window.innerWidth}x${window.innerHeight}` : "",
          timestamp: new Date().toISOString(),
          severity: activeTab === "bug_report" ? severity : undefined,
          category: activeTab === "feature_request" ? category : undefined,
        }
      : undefined;

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toolSlug,
          type: activeTab,
          subject: subject.trim() || (activeTab === "bug_report" ? `Bug in ${displayName}` : `Idea for ${displayName}`),
          details: details.trim(),
          systemContext,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit feedback.");
      }

      setResultMessage({
        type: "success",
        text: data.message || "Submitted successfully!",
        id: data.reportId,
      });
      setSubject("");
      setDetails("");
    } catch (err) {
      setResultMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Submission error occurred.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      {/* Floating Bottom Action Buttons */}
      <div className={`fixed bottom-5 right-5 z-40 flex items-center gap-2 ${className}`}>
        <button
          type="button"
          onClick={() => {
            setActiveTab("bug_report");
            setResultMessage(null);
            setIsOpen(true);
          }}
          className="group flex items-center gap-2 rounded-full border border-red-500/30 bg-[#0F131D]/90 px-3.5 py-2 text-xs font-semibold text-red-300 shadow-xl backdrop-blur-md transition hover:border-red-400 hover:bg-red-500/10 hover:text-white"
          title={`Report a bug in ${displayName}`}
        >
          <span className="flex h-2 w-2 rounded-full bg-red-500 animate-pulse" />
          <span>Report a Bug</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab("feature_request");
            setResultMessage(null);
            setIsOpen(true);
          }}
          className="group flex items-center gap-2 rounded-full border border-amber-500/30 bg-[#0F131D]/90 px-3.5 py-2 text-xs font-semibold text-amber-300 shadow-xl backdrop-blur-md transition hover:border-amber-400 hover:bg-amber-500/10 hover:text-white"
          title={`Submit an idea for ${displayName}`}
        >
          <span>💡</span>
          <span>Submit an Idea</span>
        </button>
      </div>

      {/* Modal Dialog */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity"
            onClick={() => setIsOpen(false)}
          />

          <div className="relative z-10 w-full max-w-lg rounded-3xl border border-white/15 bg-[#0B0F19]/95 p-6 shadow-2xl backdrop-blur-2xl sm:p-7">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-white/10 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <span>{displayName}</span>
                  <span className="text-white/40 font-normal">Feedback Hub</span>
                </h3>
                <p className="text-xs text-white/50 mt-0.5">
                  Direct pipeline to engineering & autonomous repair systems.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-lg border border-white/10 p-1.5 text-white/50 hover:bg-white/10 hover:text-white transition"
              >
                ✕
              </button>
            </div>

            {/* Tab Switcher */}
            <div className="mt-4 flex rounded-xl border border-white/10 bg-white/5 p-1">
              <button
                type="button"
                onClick={() => {
                  setActiveTab("bug_report");
                  setResultMessage(null);
                }}
                className={`flex-1 rounded-lg py-2 text-xs font-semibold transition ${
                  activeTab === "bug_report"
                    ? "bg-red-500/20 text-red-300 border border-red-500/30"
                    : "text-white/60 hover:text-white"
                }`}
              >
                🐞 Report a Bug
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab("feature_request");
                  setResultMessage(null);
                }}
                className={`flex-1 rounded-lg py-2 text-xs font-semibold transition ${
                  activeTab === "feature_request"
                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                    : "text-white/60 hover:text-white"
                }`}
              >
                💡 Submit an Idea
              </button>
            </div>

            {/* Notification alert */}
            {resultMessage && (
              <div
                className={`mt-4 rounded-xl border p-3 text-xs leading-relaxed ${
                  resultMessage.type === "success"
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                    : "border-red-500/30 bg-red-500/10 text-red-300"
                }`}
              >
                <div className="font-semibold">{resultMessage.text}</div>
                {resultMessage.id && (
                  <div className="mt-1 font-mono text-[10px] text-white/50">
                    Incident Tracking ID: {resultMessage.id}
                  </div>
                )}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-white/70 mb-1">
                  {activeTab === "bug_report" ? "Issue Summary" : "Idea Title"}
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder={
                    activeTab === "bug_report"
                      ? "e.g. Export failed with status 500 on large payload"
                      : "e.g. Add webhook trigger when scan detects critical gap"
                  }
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white placeholder-white/30 focus:border-cyan-400 focus:outline-none"
                />
              </div>

              {activeTab === "bug_report" ? (
                <div>
                  <label className="block text-xs font-medium text-white/70 mb-1">
                    Severity Level
                  </label>
                  <select
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value as any)}
                    className="w-full rounded-xl border border-white/10 bg-[#0E131F] px-3 py-2 text-xs text-white focus:border-red-400 focus:outline-none"
                  >
                    <option value="low">Low — Minor UI glitch or typo</option>
                    <option value="medium">Medium — Feature partially degraded</option>
                    <option value="high">High — System crash or workflow blocker</option>
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-medium text-white/70 mb-1">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full rounded-xl border border-white/10 bg-[#0E131F] px-3 py-2 text-xs text-white focus:border-amber-400 focus:outline-none"
                  >
                    <option value="feature">New Feature / Capability</option>
                    <option value="integration">Third-Party Integration / MCP</option>
                    <option value="ui_ux">UI / UX & Usability Polish</option>
                    <option value="agent">Autonomous Agent Skill / Headless Automation</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-white/70 mb-1">
                  {activeTab === "bug_report"
                    ? "Detailed Steps to Reproduce & Expected Behavior"
                    : "What problem does this solve and how should it work?"}
                  <span className="text-red-400 ml-0.5">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder={
                    activeTab === "bug_report"
                      ? "1. Went to dashboard\n2. Entered target URL\n3. Clicked scan and button froze"
                      : "Describe your workflow idea in detail..."
                  }
                  className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-white placeholder-white/30 focus:border-cyan-400 focus:outline-none"
                />
              </div>

              {activeTab === "bug_report" && (
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="diag_check"
                    checked={includeDiagnostics}
                    onChange={(e) => setIncludeDiagnostics(e.target.checked)}
                    className="rounded border-white/20 bg-white/5 text-red-500 focus:ring-0"
                  />
                  <label htmlFor="diag_check" className="text-[11px] text-white/50 cursor-pointer">
                    Attach anonymous browser telemetry (URL, browser version, viewport)
                  </label>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="rounded-xl border border-white/10 px-4 py-2 text-xs font-medium text-white/70 hover:bg-white/5 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !details.trim()}
                  className={`rounded-xl px-4 py-2 text-xs font-semibold text-white shadow-lg transition disabled:opacity-50 ${
                    activeTab === "bug_report"
                      ? "bg-red-600 hover:bg-red-500"
                      : "bg-amber-600 hover:bg-amber-500"
                  }`}
                >
                  {submitting ? "Transmitting..." : activeTab === "bug_report" ? "Submit Bug Report" : "Submit Idea"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
