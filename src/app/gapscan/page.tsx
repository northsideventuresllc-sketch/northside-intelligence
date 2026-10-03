import { createSector3LandingPage } from "@/lib/sector3-tools/create-landing-page";
import { GAPSCAN_CONFIG } from "@/lib/sector3-tools/configs";

export default createSector3LandingPage(GAPSCAN_CONFIG, {
  headline: "Find the Gaps",
  headlineAccent: "Before They Cost You",
  subhead: "Continuous performance audits, SEO drift detection, and competitive intelligence for modern web apps.",
  previewLabel: "Latest Scan Sample",
  previewInput: "Audited https://example.com — 3 critical funnel drop-offs and 2 broken API schemas found.",
  previewOutput: "Generated remediation patch and Jira ticket export.",
  tags: ["Lighthouse", "SEO Drift", "Funnel Leaks", "Schema Check"],
});
