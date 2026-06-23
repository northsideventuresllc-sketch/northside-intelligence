import { createSector3DashboardPage } from "@/lib/sector3-tools/create-dashboard-page";
import { BRIDGEAI_CONFIG } from "@/lib/sector3-tools/configs";

export default createSector3DashboardPage(BRIDGEAI_CONFIG, {
  apiPath: "/api/bridgeai/generate",
  primaryLabel: "Generate Orchestration Plan",
  usageColumn: "workflows_used_this_month",
  fields: [
    {
      id: "sourceSystem",
      label: "Source system",
      placeholder: "e.g. HubSpot, Gmail, Airtable",
      required: true,
    },
    {
      id: "targetSystem",
      label: "Target system",
      placeholder: "e.g. Stripe, Slack, Supabase",
      required: true,
    },
    {
      id: "goal",
      label: "Integration goal",
      placeholder: "What should happen when data moves between these systems?",
      multiline: true,
    },
  ],
});
