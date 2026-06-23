import { createSector3DashboardPage } from "@/lib/sector3-tools/create-dashboard-page";
import { GAPSCAN_CONFIG } from "@/lib/sector3-tools/configs";

export default createSector3DashboardPage(GAPSCAN_CONFIG, {
  apiPath: "/api/gapscan/generate",
  primaryLabel: "Run Gap Scan",
  usageColumn: "scans_used_this_month",
  fields: [
    {
      id: "scanType",
      label: "Scan type",
      placeholder: "Workflow, Product, or Market",
    },
    {
      id: "context",
      label: "Context to scan",
      placeholder: "Describe the workflow, product surface, or market you want analyzed…",
      multiline: true,
    },
  ],
  buildPayload: (values) => ({
    scanType: values.scanType || "Workflow",
    context: values.context,
  }),
});
