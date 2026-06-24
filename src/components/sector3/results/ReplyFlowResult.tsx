"use client";

import { CopyResultButton } from "@/components/sector3/results/CopyResultButton";
import { stripInlineMarkdown } from "@/lib/sector3-tools/parse-result";

interface Props {
  reply: string;
  tone?: string;
  scenario?: string;
}

export function ReplyFlowResult({ reply, tone, scenario }: Props) {
  const cleanReply = stripInlineMarkdown(reply);

  return (
    <div className="rf-glass animate-bubble-in space-y-4 rounded-3xl border border-rf-rose/20 p-6 shadow-rf-violet">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-rf-violet">
            Ready to Send
          </p>
          {(tone || scenario) && (
            <div className="mt-2 flex flex-wrap gap-2">
              {tone && (
                <span className="rounded-full border border-rf-rose/40 bg-rf-rose/15 px-3 py-0.5 text-xs font-medium text-rf-rose">
                  {tone}
                </span>
              )}
              {scenario && (
                <span className="rounded-full border border-rf-violet/40 bg-rf-violet/15 px-3 py-0.5 text-xs font-medium text-rf-violet">
                  {scenario}
                </span>
              )}
            </div>
          )}
        </div>
        <CopyResultButton
          text={cleanReply}
          label="Copy Reply"
          copiedLabel="✓ Copied!"
          className="text-rf-rose"
        />
      </div>

      <div className="relative">
        <div className="absolute -left-1 top-4 h-8 w-8 rounded-full bg-gradient-to-br from-rf-rose to-rf-violet opacity-80 blur-md" />
        <div className="relative rounded-3xl rounded-tl-md border border-rf-rose/30 bg-gradient-to-br from-rf-card/90 to-rf-bg/80 p-5 shadow-rf-glow">
          <p className="mb-2 text-xs font-medium uppercase tracking-widest text-rf-muted">
            Your Reply
          </p>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-white/92">{cleanReply}</p>
        </div>
      </div>

      <p className="text-center text-xs text-rf-muted">
        Review, tweak if needed, then paste into your help desk or inbox.
      </p>
    </div>
  );
}
