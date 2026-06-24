"use client";

interface Props {
  onEdit: () => void;
  editLabel?: string;
  onChat?: () => void;
  chatLabel?: string;
  brandColor?: string;
}

export function Sector3DashboardToolbar({
  onEdit,
  editLabel = "Edit Prompt",
  onChat,
  chatLabel = "Open AI Chat",
  brandColor = "#38bdf8",
}: Props) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-xl">
      <p className="text-sm font-medium text-white/70">Your results are ready</p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onEdit}
          className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white/90 transition hover:bg-white/10"
        >
          {editLabel}
        </button>
        {onChat && (
          <button
            type="button"
            onClick={onChat}
            className="rounded-xl px-4 py-2 text-sm font-semibold text-[#07080C] transition hover:opacity-90"
            style={{
              background: `linear-gradient(to right, ${brandColor}, ${brandColor}cc)`,
              boxShadow: `0 0 20px ${brandColor}33`,
            }}
          >
            {chatLabel}
          </button>
        )}
      </div>
    </div>
  );
}
