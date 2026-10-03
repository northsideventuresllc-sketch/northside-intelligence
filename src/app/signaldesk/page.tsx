import { createSector3LandingPage } from "@/lib/sector3-tools/create-landing-page";
import { SIGNALDESK_CONFIG } from "@/lib/sector3-tools/configs";

export default createSector3LandingPage(SIGNALDESK_CONFIG, {
  headline: "Signal Intelligence",
  headlineAccent: "Ranked and Actionable",
  subhead: "Real-time competitor and market signals delivered with priority scoring and automated team alerts.",
  previewLabel: "Latest Signal Sample",
  previewInput: "Competitor launched new enterprise plan at $499/mo with SOC 2 compliance announced.",
  previewOutput: "Priority: HIGH · Recommended response drafted · Alert sent to Slack #intel.",
  tags: ["Competitor Moves", "Pricing Shifts", "Feature Launches", "Team Alerts"],
});
