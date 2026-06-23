import { createSector3GenerateRoute } from "@/lib/sector3-tools/create-generate-route";
import { SIGNALDESK_CONFIG } from "@/lib/sector3-tools/configs";
import { generateSignalDeskBrief } from "@/lib/sector3-tools/ai";

export const POST = createSector3GenerateRoute(SIGNALDESK_CONFIG, async (body) => {
  const rawSignals = String(body.rawSignals ?? "").trim();
  const focusArea = String(body.focusArea ?? "General").trim() || "General";

  if (!rawSignals) {
    throw new Error("Paste signals, headlines, or metrics to analyze.");
  }

  const result = await generateSignalDeskBrief(rawSignals, focusArea);
  return {
    result,
    inputSummary: rawSignals.slice(0, 200),
    sessionMeta: { focus_area: focusArea },
  };
});
