import { createSector3GenerateRoute } from "@/lib/sector3-tools/create-generate-route";
import { BRIDGEAI_CONFIG } from "@/lib/sector3-tools/configs";
import { generateBridgeAIPlan } from "@/lib/sector3-tools/ai";

export const POST = createSector3GenerateRoute(BRIDGEAI_CONFIG, async (body) => {
  const sourceSystem = String(body.sourceSystem ?? "").trim();
  const targetSystem = String(body.targetSystem ?? "").trim();
  const goal = String(body.goal ?? "").trim();

  if (!sourceSystem || !targetSystem) {
    throw new Error("Enter both source and target systems.");
  }

  const result = await generateBridgeAIPlan(sourceSystem, targetSystem, goal);
  return {
    result,
    inputSummary: `${sourceSystem} → ${targetSystem}`.slice(0, 200),
    sessionMeta: {
      source_system: sourceSystem.slice(0, 200),
      target_system: targetSystem.slice(0, 200),
    },
  };
});
