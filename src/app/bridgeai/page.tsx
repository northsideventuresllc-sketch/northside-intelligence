import { createSector3LandingPage } from "@/lib/sector3-tools/create-landing-page";
import { BRIDGEAI_CONFIG } from "@/lib/sector3-tools/configs";

export default createSector3LandingPage(BRIDGEAI_CONFIG, {
  headline: "Bridge Your Stack",
  headlineAccent: "With an Orchestration Plan",
  subhead:
    "Connect two systems — CRM to billing, inbox to CRM, spreadsheet to API — and get a step-by-step integration playbook.",
  previewLabel: "Live Preview",
  previewInput: "Source: HubSpot deals. Target: Stripe subscriptions. Goal: auto-provision on Closed Won.",
  previewOutput:
    "Webhook on deal stage → idempotent customer create → subscription with metadata sync → rollback on failure.",
  tags: ["HubSpot", "Stripe", "Automation"],
});
