"use client";

import { useState } from "react";

interface Props {
  text: string;
  label?: string;
  copiedLabel?: string;
  className?: string;
}

export function CopyResultButton({
  text,
  label = "Copy",
  copiedLabel = "✓ Copied!",
  className = "",
}: Props) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`text-sm font-medium transition hover:opacity-80 ${className}`}
    >
      {copied ? copiedLabel : label}
    </button>
  );
}
