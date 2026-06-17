export type ServiceStatus = "LIVE" | "COMING SOON";

export type ServiceAudience = "individual" | "business" | "both";

export interface ServiceOffering {
  slug: string;
  name: string;
  description: string;
  status: ServiceStatus;
  audience: ServiceAudience;
  highlights: string[];
}

export const INTELLIGENCE_SERVICES: ServiceOffering[] = [
  {
    slug: "tailored-intelligence-server",
    name: "Tailored Intelligence Server Request",
    description:
      "A bespoke intelligence server built around your workflows, systems, and goals — designed, deployed, and maintained by Northside Intelligence.",
    status: "LIVE",
    audience: "both",
    highlights: [
      "On-site or remote discovery and workflow audit",
      "Custom intelligence server architecture",
      "Integration with your existing tools and systems",
      "Planned path forward with milestones and deliverables",
    ],
  },
  {
    slug: "intelligence-audit",
    name: "Intelligence Audit & Gap Analysis",
    description:
      "A comprehensive review of your current systems, workflows, and intelligence gaps — with a prioritized roadmap for improvement.",
    status: "COMING SOON",
    audience: "both",
    highlights: [
      "Workflow and system mapping",
      "Gap identification and prioritization",
      "Actionable recommendations report",
    ],
  },
  {
    slug: "enterprise-ai-strategy",
    name: "Enterprise AI Strategy",
    description:
      "Strategic planning for AI adoption across your organization — from pilot programs to full-scale intelligence infrastructure.",
    status: "COMING SOON",
    audience: "business",
    highlights: [
      "AI readiness assessment",
      "Use case identification and ROI modeling",
      "Implementation roadmap and vendor evaluation",
    ],
  },
  {
    slug: "workflow-integration",
    name: "Workflow Integration & Automation",
    description:
      "Connect your tools, eliminate manual handoffs, and automate intelligence flows across your business operations.",
    status: "COMING SOON",
    audience: "business",
    highlights: [
      "Cross-platform integration design",
      "Automation pipeline build-out",
      "Ongoing monitoring and optimization",
    ],
  },
  {
    slug: "personal-intelligence-setup",
    name: "Personal Intelligence Setup",
    description:
      "A tailored intelligence environment for individuals — personal productivity, research, and decision-making tools configured for how you work.",
    status: "COMING SOON",
    audience: "individual",
    highlights: [
      "Personal workflow assessment",
      "Custom tool configuration",
      "Training and ongoing support",
    ],
  },
];

export const TAILORED_INTELLIGENCE_SERVER = INTELLIGENCE_SERVICES.find(
  (s) => s.slug === "tailored-intelligence-server"
)!;

export const TAILORED_SERVER_MODAL_COPY = {
  title: "Tailored Intelligence Server Request",
  subtitle: "Built for you. Built with you.",
  description:
    "Northside Intelligence doesn't ship one-size-fits-all solutions. We come in, learn how you or your organization actually operates, and build an intelligence server tailored to your workflows, systems, and ambitions.",
  sections: [
    {
      heading: "Discovery & Audit",
      body: "We map your current workflows, tools, and data flows — identifying gaps, bottlenecks, and opportunities where intelligence can fill what's missing.",
    },
    {
      heading: "Custom Build",
      body: "Our team designs and deploys a bespoke intelligence server architecture — integrated with your existing systems, configured for your team, and built to scale as you grow.",
    },
    {
      heading: "Planned Path Forward",
      body: "You receive a clear roadmap with milestones, deliverables, and ongoing support options. We don't disappear after deployment — we stay in your corner as your intelligence infrastructure evolves.",
    },
    {
      heading: "What We Bring",
      body: "Marketplace technology, AI systems, business and personal tools, workflow automation, cross-platform orchestration, and the full Northside Intelligence ecosystem — applied specifically to your context.",
    },
  ],
  ctaLabel: "Start Your Request",
  accountNote: "An NI Portal account is required to submit a service request.",
};

export type AccountType = "personal" | "business";

export interface TailoredServerRequestPayload {
  contactName: string;
  email: string;
  accountType: AccountType;
  businessName?: string;
  industry: string;
  currentSystems: string;
  painPoints: string;
  desiredOutcomes: string;
  timeline: string;
  budgetRange: string;
  teamSize: string;
  additionalContext: string;
  referralSource?: string;
}

export const TIMELINE_OPTIONS = [
  "As soon as possible",
  "Within 1–3 months",
  "Within 3–6 months",
  "6+ months — exploring options",
  "Flexible / not sure yet",
] as const;

export const BUDGET_OPTIONS = [
  "Under $5,000",
  "$5,000 – $15,000",
  "$15,000 – $50,000",
  "$50,000 – $100,000",
  "$100,000+",
  "Prefer to discuss",
] as const;

export const TEAM_SIZE_OPTIONS = [
  "Just me",
  "2–10 people",
  "11–50 people",
  "51–200 people",
  "200+ people",
] as const;
