"use client";

import { BridgeAIResult } from "@/components/sector3/results/BridgeAIResult";
import { GapScanResult } from "@/components/sector3/results/GapScanResult";
import { ReplyFlowResult } from "@/components/sector3/results/ReplyFlowResult";
import { SignalDeskResult } from "@/components/sector3/results/SignalDeskResult";

interface Props {
  slug: string;
  result: string;
  brandColor: string;
  tone?: string;
  scenario?: string;
  sourceSystem?: string;
  targetSystem?: string;
}

export function Sector3ToolResult({
  slug,
  result,
  brandColor,
  tone,
  scenario,
  sourceSystem,
  targetSystem,
}: Props) {
  switch (slug) {
    case "replyflow":
      return <ReplyFlowResult reply={result} tone={tone} scenario={scenario} />;
    case "signaldesk":
      return <SignalDeskResult result={result} brandColor={brandColor} />;
    case "gapscan":
      return <GapScanResult result={result} brandColor={brandColor} />;
    case "bridgeai":
      return (
        <BridgeAIResult
          result={result}
          brandColor={brandColor}
          sourceSystem={sourceSystem}
          targetSystem={targetSystem}
        />
      );
    default:
      return (
        <SignalDeskResult result={result} brandColor={brandColor} />
      );
  }
}
