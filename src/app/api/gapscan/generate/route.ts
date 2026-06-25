import { createSector3GenerateRoute } from "@/lib/sector3-tools/create-generate-route";
import { GAPSCAN_CONFIG } from "@/lib/sector3-tools/configs";
import { generateGapScanReport } from "@/lib/sector3-tools/ai";

export const POST = createSector3GenerateRoute(GAPSCAN_CONFIG, async (body) => {
  const clarifications = String(body._clarifications ?? "").trim();
  const context = String(body.context ?? "").trim();
  const scanType = String(body.scanType ?? "Workflow").trim() || "Workflow";

  if (!context && !clarifications) {
    throw new Error("Describe the workflow, product, or market to scan.");
  }

  const prompt = clarifications
    ? `${context}\n\n--- Additional context ---\n${clarifications}`
    : context;

  const result = await generateGapScanReport(prompt, scanType);
  return {
    result,
    inputSummary: context.slice(0, 200) || clarifications.slice(0, 200),
    sessionMeta: { scan_type: scanType },
  };
});
