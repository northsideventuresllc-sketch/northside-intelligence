"use client";

export type Sector3ToolVariant = "replyflow" | "grantbot" | "default";

const BAR_GRADIENT: Record<Sector3ToolVariant, string> = {
  replyflow: "from-rf-rose via-rf-coral to-rf-violet",
  grantbot: "from-gb-emerald via-gb-teal to-gb-amber",
  default: "from-cyan-400 via-ni-cyan to-cyan-300",
};

interface Sector3LoadingBarProps {
  loading?: boolean;
  variant?: Sector3ToolVariant;
  active?: boolean;
  brandColor?: string;
}

export function Sector3LoadingBar({
  loading,
  variant = "default",
  active,
  brandColor,
}: Sector3LoadingBarProps) {
  const isLoading = loading ?? active ?? false;
  if (!isLoading) return null;

  return (
    <div
      className="fixed left-0 right-0 top-16 z-[60] h-1 overflow-hidden bg-white/5"
      role="progressbar"
      aria-label="Loading"
      aria-busy="true"
    >
      <div
        className={`h-full w-1/3 animate-sector3-loading bg-gradient-to-r ${BAR_GRADIENT[variant]}`}
        style={brandColor ? { background: brandColor } : undefined}
      />
    </div>
  );
}
