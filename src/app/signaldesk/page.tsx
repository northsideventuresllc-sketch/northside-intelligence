import { createSector3LandingPage } from "@/lib/sector3-tools/create-landing-page";
import { SIGNALDESK_CONFIG } from "@/lib/sector3-tools/configs";

export default createSector3LandingPage(SIGNALDESK_CONFIG, {
  headline: "Signal Intelligence",
  headlineAccent: "Ranked and Actionable",
  subhead:
    "Paste raw signals — news, metrics, competitor moves — and get a prioritized brief with clear next steps.",
  previewLabel: "Live Preview",
  previewInput:
    "Competitor X launched a $9/mo tier. Inbound demo requests up 18% WoW. Reddit thread trending on workflow automation fatigue.",
  previewOutput:
    "→ High: Match competitor pricing narrative before next sales week. → Medium: Capture automation-fatigue angle in outbound.",
  tags: ["Market", "Competitive", "Demand"],
});
