import { createSector3DashboardPage } from "@/lib/sector3-tools/create-dashboard-page";
import { GAPSCAN_CONFIG } from "@/lib/sector3-tools/configs";

export default createSector3DashboardPage(GAPSCAN_CONFIG, {
  apiPath: "/api/gapscan/generate",
  primaryLabel: "Run Gap Scan",
  usageColumn: "scans_used_this_month",
  fields: [
    {
      id: "scanType",
      label: "Scan Type",
      placeholder: "Workflow, Product, or Market",
      chipOptions: ["Workflow", "Product", "Market"],
    },
    {
      id: "context",
      label: "Context to Scan",
      placeholder: "Describe the workflow, product surface, or market you want analyzed…",
      multiline: true,
    },
  ],
});
