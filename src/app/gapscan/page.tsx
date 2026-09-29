import { createSector3LandingPage } from "@/lib/sector3-tools/create-landing-page";
import { GAPSCAN_CONFIG } from "@/lib/sector3-tools/configs";

export default createSector3LandingPage(GAPSCAN_CONFIG, {
  headline: "Find the Gaps",
  headlineAccent: "Before They Cost You",
  subhead:
    "Describe a workflow, product, or market — GapScan surfaces severity-ranked gaps and quick wins.",
  previewLabel: "Live Preview",
  previewInput:
    "Onboarding: users sign up, verify email, then stall before first value. Competitors offer instant templates.",
  previewOutput:
    "Critical gap: no guided first-run within 60 seconds. Moderate: missing template library at signup.",
  tags: ["Workflow", "Onboarding", "Product"],
});
