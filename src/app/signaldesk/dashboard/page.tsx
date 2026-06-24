import { createSector3DashboardPage } from "@/lib/sector3-tools/create-dashboard-page";
import { SIGNALDESK_CONFIG } from "@/lib/sector3-tools/configs";

export default createSector3DashboardPage(SIGNALDESK_CONFIG, {
  apiPath: "/api/signaldesk/generate",
  primaryLabel: "Generate Signal Brief",
  usageColumn: "signals_used_this_month",
  fields: [
    {
      id: "focusArea",
      label: "Focus Area",
      placeholder: "General, Market, Product, Competitive, or Regulatory",
      chipOptions: ["General", "Market", "Product", "Competitive", "Regulatory"],
    },
    {
      id: "rawSignals",
      label: "Raw Signals",
      placeholder: "Paste headlines, metrics, competitor updates, customer quotes…",
      multiline: true,
    },
  ],
});
