import type { DashboardField } from "@/components/sector3/Sector3ToolDashboard";
import { SECTOR3_TOOL_CONFIGS } from "@/lib/sector3-tools/configs";
import type { Sector3ToolSlug } from "@/lib/sector3-registry";

const FIELD_REGISTRY: Partial<Record<Sector3ToolSlug, DashboardField[]>> = {
  signaldesk: [
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
  gapscan: [
    {
      id: "scanType",
      label: "Scan Type",
      placeholder: "Workflow, Product, Market, or Operations",
      chipOptions: ["Workflow", "Product", "Market", "Operations"],
    },
    {
      id: "context",
      label: "Context",
      placeholder: "Describe the workflow, product, or market you want analyzed…",
      multiline: true,
    },
  ],
  bridgeai: [
    {
      id: "sourceSystem",
      label: "Source System",
      placeholder: "e.g. Salesforce, HubSpot, Shopify",
      multiline: true,
    },
    {
      id: "targetSystem",
      label: "Target System",
      placeholder: "e.g. Slack, Notion, Google Sheets",
      multiline: true,
    },
  ],
  grantbot: [
    {
      id: "category",
      label: "Category",
      placeholder: "Nonprofit, Creator, Research, Small Business, Arts & Culture",
      chipOptions: ["Nonprofit", "Creator", "Research", "Small Business", "Arts & Culture"],
    },
    {
      id: "orgDescription",
      label: "Organization Description",
      placeholder: "Describe your organization, mission, and funding goals…",
      multiline: true,
    },
  ],
};

export function getSector3ToolConfig(slug: string): { fields: DashboardField[] } | null {
  const fields = FIELD_REGISTRY[slug as Sector3ToolSlug];
  if (fields) return { fields };

  const config = SECTOR3_TOOL_CONFIGS.find((c) => c.slug === slug);
  if (!config) return null;

  return { fields: [] };
}
