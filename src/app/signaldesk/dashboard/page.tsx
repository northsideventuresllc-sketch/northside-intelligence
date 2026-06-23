import { createSector3DashboardPage } from "@/lib/sector3-tools/create-dashboard-page";
import { SIGNALDESK_CONFIG } from "@/lib/sector3-tools/configs";

const FOCUS_AREAS = ["General", "Market", "Product", "Competitive", "Regulatory"];

export default createSector3DashboardPage(SIGNALDESK_CONFIG, {
  apiPath: "/api/signaldesk/generate",
  primaryLabel: "Generate Signal Brief",
  usageColumn: "signals_used_this_month",
  fields: [
    {
      id: "focusArea",
      label: "Focus area",
      placeholder: "General",
    },
    {
      id: "rawSignals",
      label: "Raw signals",
      placeholder: "Paste headlines, metrics, competitor updates, customer quotes…",
      multiline: true,
    },
  ],
  buildPayload: (values) => ({
    focusArea: FOCUS_AREAS.includes(values.focusArea)
      ? values.focusArea
      : values.focusArea || "General",
    rawSignals: values.rawSignals,
  }),
});
