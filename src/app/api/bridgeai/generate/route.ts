import { createSector3GenerateRoute } from "@/lib/sector3-tools/create-generate-route";
import { BRIDGEAI_CONFIG } from "@/lib/sector3-tools/configs";
import { generateBridgeAIPlan } from "@/lib/sector3-tools/ai";

export const POST = createSector3GenerateRoute(BRIDGEAI_CONFIG, async (body) => {
  const clarifications = String(body._clarifications ?? "").trim();
  const sourceSystem = String(body.sourceSystem ?? "").trim();
  const targetSystem = String(body.targetSystem ?? "").trim();
  const goal = String(body.goal ?? "").trim();

  if ((!sourceSystem || !targetSystem) && !clarifications) {
    throw new Error("Enter both source and target systems.");
  }

  const systemsBlock = `${sourceSystem} → ${targetSystem}${goal ? `\nGoal: ${goal}` : ""}`;
  const prompt = clarifications
    ? `${systemsBlock}\n\n--- Additional context ---\n${clarifications}`
    : systemsBlock;

  const result = await generateBridgeAIPlan(sourceSystem, targetSystem, goal || prompt);
  return {
    result,
    inputSummary: `${sourceSystem} → ${targetSystem}`.slice(0, 200),
    sessionMeta: {
      source_system: sourceSystem.slice(0, 200),
      target_system: targetSystem.slice(0, 200),
    },
  };
});
