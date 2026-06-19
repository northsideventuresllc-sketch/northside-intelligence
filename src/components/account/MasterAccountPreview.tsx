"use client";

interface MasterAccountPreviewProps {
  enabled: boolean;
  children: React.ReactNode;
}

/** Shows billing UI for master accounts in a faded, non-interactive preview state. */
export function MasterAccountPreview({ enabled, children }: MasterAccountPreviewProps) {
  if (!enabled) {
    return <>{children}</>;
  }

  return (
    <div className="relative">
      <div className="pointer-events-none select-none opacity-45">{children}</div>
      <p className="mt-4 text-center text-xs text-amber-200/80">
        Preview only — master account actions are disabled.
      </p>
    </div>
  );
}
