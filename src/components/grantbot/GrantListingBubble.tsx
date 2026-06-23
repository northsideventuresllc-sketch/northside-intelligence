"use client";

import type { GrantListing } from "@/lib/grantbot/listings";

interface DraftState {
  loading: boolean;
  text?: string;
  error?: string;
  copied?: boolean;
}

interface Props {
  listing: GrantListing;
  draftState?: DraftState;
  draftDisabled?: boolean;
  onDraft: (listing: GrantListing) => void;
  onCopyDraft: (listingId: string, text: string) => void;
}

export function GrantListingBubble({
  listing,
  draftState,
  draftDisabled = false,
  onDraft,
  onCopyDraft,
}: Props) {
  const isDrafting = draftState?.loading;
  const hasDraft = !!draftState?.text;

  return (
    <article className="gb-glass animate-bubble-in rounded-3xl border border-gb-emerald/20 p-5 shadow-gb-glow">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-white">{listing.name}</h3>
          <p className="mt-1 text-sm text-gb-muted">{listing.funder}</p>
        </div>
        <span className="rounded-full border border-gb-amber/30 bg-gb-amber/10 px-3 py-1 text-xs font-medium text-gb-amber">
          {listing.awardRange}
        </span>
      </div>

      <p className="mt-4 text-sm leading-relaxed text-white/85">{listing.fitReason}</p>
      <p className="mt-2 text-xs text-gb-muted">{listing.nextStep}</p>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <a
          href={listing.platformUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center rounded-xl border border-gb-teal/40 bg-gb-teal/10 px-4 py-2 text-sm font-medium text-gb-teal transition hover:bg-gb-teal/20"
        >
          Open on {listing.platform}
        </a>
        <button
          type="button"
          onClick={() => onDraft(listing)}
          disabled={draftDisabled || isDrafting}
          className="inline-flex items-center rounded-xl bg-gradient-to-r from-gb-emerald to-gb-amber px-4 py-2 text-sm font-semibold text-gb-bg shadow-gb-glow transition hover:opacity-95 disabled:opacity-40"
        >
          {isDrafting ? "Drafting…" : hasDraft ? "Regenerate Draft" : "Draft Application"}
        </button>
      </div>

      {draftState?.error && (
        <p className="mt-4 rounded-xl border border-gb-amber/30 bg-gb-amber/10 px-4 py-3 text-sm text-gb-amber">
          {draftState.error}
        </p>
      )}

      {hasDraft && draftState.text && (
        <div className="animate-bubble-in mt-5 rounded-2xl border border-white/10 bg-gb-bg/60 p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-medium text-gb-emerald">Application Draft</span>
            <button
              type="button"
              onClick={() => onCopyDraft(listing.id, draftState.text!)}
              className="text-sm font-medium text-gb-teal transition hover:text-gb-emerald"
            >
              {draftState.copied ? "✓ Copied!" : "Copy Draft"}
            </button>
          </div>
          <div className="max-h-96 overflow-y-auto whitespace-pre-wrap text-sm leading-relaxed text-white/90">
            {draftState.text}
          </div>
        </div>
      )}
    </article>
  );
}
