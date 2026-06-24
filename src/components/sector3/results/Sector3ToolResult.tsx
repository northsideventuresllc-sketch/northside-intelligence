"use client";

import { BridgeAIResult } from "@/components/sector3/results/BridgeAIResult";
import { GapScanResult } from "@/components/sector3/results/GapScanResult";
import { ReplyFlowResult } from "@/components/sector3/results/ReplyFlowResult";
import { SignalDeskResult } from "@/components/sector3/results/SignalDeskResult";
import type { Sector3PresentationMode } from "@/lib/sector3-tools/presentation-mode";

interface Props {
  slug: string;
  result: string;
  brandColor: string;
  tone?: string;
  scenario?: string;
  sourceSystem?: string;
  targetSystem?: string;
  presentationMode?: Sector3PresentationMode;
}

export function Sector3ToolResult({
  slug,
  result,
  brandColor,
  tone,
  scenario,
  sourceSystem,
  targetSystem,
  presentationMode = "simple",
}: Props) {
  switch (slug) {
    case "replyflow":
      return <ReplyFlowResult reply={result} tone={tone} scenario={scenario} />;
    case "signaldesk":
      return (
        <SignalDeskResult
          result={result}
          brandColor={brandColor}
          presentationMode={presentationMode}
        />
      );
    case "gapscan":
      return (
        <GapScanResult
          result={result}
          brandColor={brandColor}
          presentationMode={presentationMode}
        />
      );
    case "bridgeai":
      return (
        <BridgeAIResult
          result={result}
          brandColor={brandColor}
          sourceSystem={sourceSystem}
          targetSystem={targetSystem}
          presentationMode={presentationMode}
        />
      );
    default:
      return (
        <SignalDeskResult
          result={result}
          brandColor={brandColor}
          presentationMode={presentationMode}
        />
      );
  }
}
