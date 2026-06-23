export type ServiceStatus = "LIVE" | "COMING SOON";

export type ServiceAudience = "individual" | "business" | "both";

export type ServicePricingModel =
  | "fixed"
  | "starting_at"
  | "monthly"
  | "hourly"
  | "range"
  | "custom";

export interface ServicePriceTier {
  model: ServicePricingModel;
  amount: string;
  note?: string;
}

export interface ServicePricing {
  individual?: ServicePriceTier;
  business?: ServicePriceTier;
}

export interface ServiceOffering {
  slug: string;
  name: string;
  description: string;
  status: ServiceStatus;
  audience: ServiceAudience;
  highlights: string[];
  pricing: ServicePricing;
  modalCopy: {
    subtitle: string;
    description: string;
    sections: { heading: string; body: string }[];
    ctaLabel: string;
  };
}

export const INTELLIGENCE_SERVICES: ServiceOffering[] = [
  {
    slug: "tailored-intelligence-server",
    name: "Tailored Intelligence Server",
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
    pricing: {
      individual: {
        model: "range",
        amount: "$499 – $4,500",
        note: "Scoped personal automation & home-office setups",
      },
      business: {
        model: "range",
        amount: "$5,000 – $100,000+",
        note: "Enterprise builds priced by scope, integrations, and support",
      },
    },
    modalCopy: {
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
      ],
      ctaLabel: "Start Your Request",
    },
  },
  {
    slug: "intelligence-audit",
    name: "Intelligence Audit & Gap Analysis",
    description:
      "A comprehensive review of your current systems, workflows, and intelligence gaps — with a prioritized roadmap for improvement.",
    status: "LIVE",
    audience: "both",
    highlights: [
      "Workflow and system mapping",
      "Gap identification and prioritization",
      "Actionable recommendations report",
      "30-day follow-up consultation included",
    ],
    pricing: {
      individual: {
        model: "range",
        amount: "$299 – $799",
        note: "Personal workflow audit — delivered in 1–2 weeks",
      },
      business: {
        model: "range",
        amount: "$2,500 – $5,000",
        note: "Team & org-wide audit — delivered in 2–3 weeks",
      },
    },
    modalCopy: {
      subtitle: "Know where you stand before you build.",
      description:
        "Before investing in new tools or infrastructure, understand exactly where your intelligence gaps are. Our audit delivers a clear, prioritized roadmap — not a generic checklist.",
      sections: [
        {
          heading: "System & Workflow Mapping",
          body: "We document your current tools, data flows, and decision points across teams or personal workflows.",
        },
        {
          heading: "Gap Analysis",
          body: "We identify bottlenecks, redundancies, and missed opportunities where intelligence could accelerate outcomes.",
        },
        {
          heading: "Prioritized Roadmap",
          body: "You receive a ranked action plan with quick wins, medium-term improvements, and strategic investments.",
        },
      ],
      ctaLabel: "Request an Audit",
    },
  },
  {
    slug: "personal-intelligence-setup",
    name: "Personal Intelligence Setup",
    description:
      "A tailored intelligence environment for individuals — personal productivity, research, and decision-making tools configured for how you work.",
    status: "LIVE",
    audience: "individual",
    highlights: [
      "Personal workflow assessment",
      "Custom tool configuration",
      "Training and 30-day support",
      "Privacy-first architecture",
    ],
    pricing: {
      individual: {
        model: "range",
        amount: "$149 – $499",
        note: "One-time setup — most personal stacks land around $249",
      },
    },
    modalCopy: {
      subtitle: "Your intelligence stack, configured for you.",
      description:
        "Stop juggling disconnected apps. We build a cohesive personal intelligence environment — research tools, note systems, AI assistants, and automations — all configured around how you actually work.",
      sections: [
        {
          heading: "Workflow Assessment",
          body: "We map your daily routines, research habits, and decision-making patterns to design the right setup.",
        },
        {
          heading: "Custom Configuration",
          body: "We configure and integrate your tools — from AI assistants to knowledge bases — into one coherent system.",
        },
        {
          heading: "Training & Support",
          body: "Hands-on training plus 30 days of support so you're confident using your new intelligence environment.",
        },
      ],
      ctaLabel: "Get Started",
    },
  },
  {
    slug: "ai-research-assistant",
    name: "AI Research Assistant Setup",
    description:
      "A custom AI research assistant trained on your domains, sources, and methodology — delivering faster, more reliable insights.",
    status: "LIVE",
    audience: "individual",
    highlights: [
      "Domain-specific source curation",
      "Custom prompt and methodology design",
      "Citation and verification workflows",
      "Ongoing tuning for 60 days",
    ],
    pricing: {
      individual: {
        model: "range",
        amount: "$99 – $399",
        note: "Includes 60-day tuning — starter setups from $149",
      },
    },
    modalCopy: {
      subtitle: "Research that matches your standards.",
      description:
        "Generic AI tools give generic answers. We build a research assistant calibrated to your domains, sources, and quality standards — so you get reliable insights, not hallucinations.",
      sections: [
        {
          heading: "Source Curation",
          body: "We identify and configure trusted sources, databases, and reference materials relevant to your research areas.",
        },
        {
          heading: "Methodology Design",
          body: "Custom prompts, verification steps, and citation workflows ensure outputs meet your quality bar.",
        },
        {
          heading: "Ongoing Tuning",
          body: "60 days of refinement based on your feedback — the assistant gets sharper with every use.",
        },
      ],
      ctaLabel: "Set Up My Assistant",
    },
  },
  {
    slug: "personal-knowledge-base",
    name: "Personal Knowledge Base Build",
    description:
      "A structured, searchable knowledge base for your notes, research, and insights — connected to your AI tools and workflows.",
    status: "LIVE",
    audience: "individual",
    highlights: [
      "Information architecture design",
      "AI-powered search and retrieval",
      "Cross-tool synchronization",
      "Migration from existing notes",
    ],
    pricing: {
      individual: {
        model: "range",
        amount: "$149 – $449",
        note: "Includes data migration — typical builds around $249",
      },
    },
    modalCopy: {
      subtitle: "Everything you know, instantly accessible.",
      description:
        "Your notes, research, and insights scattered across apps are useless until you can find them. We build a unified knowledge base with AI-powered search that connects to your existing tools.",
      sections: [
        {
          heading: "Architecture Design",
          body: "We design a taxonomy and structure that matches how you think — not a rigid folder system.",
        },
        {
          heading: "Migration & Integration",
          body: "We migrate your existing notes and connect your knowledge base to AI tools, calendars, and workflows.",
        },
        {
          heading: "AI-Powered Retrieval",
          body: "Semantic search lets you find anything by meaning, not just keywords — even across years of notes.",
        },
      ],
      ctaLabel: "Build My Knowledge Base",
    },
  },
  {
    slug: "executive-briefing-intelligence",
    name: "Executive Briefing Intelligence",
    description:
      "Automated daily and weekly intelligence briefings tailored to your interests, markets, and decision priorities.",
    status: "LIVE",
    audience: "individual",
    highlights: [
      "Custom briefing templates",
      "Multi-source aggregation",
      "Priority signal filtering",
      "Delivery via email or dashboard",
    ],
    pricing: {
      individual: {
        model: "monthly",
        amount: "$39 – $79/mo",
        note: "Setup: $99 – $249 (waived with annual plan)",
      },
    },
    modalCopy: {
      subtitle: "Stay ahead without the information overload.",
      description:
        "Stop drowning in news feeds and email alerts. We build automated briefings that surface only what matters to your decisions — markets, competitors, policy, and trends — delivered on your schedule.",
      sections: [
        {
          heading: "Interest Mapping",
          body: "We define your briefing scope — industries, geographies, competitors, and topics that drive your decisions.",
        },
        {
          heading: "Signal Filtering",
          body: "AI-powered filtering cuts through noise to surface high-signal updates, not every headline.",
        },
        {
          heading: "Automated Delivery",
          body: "Daily or weekly briefings delivered via email, dashboard, or both — formatted for quick scanning.",
        },
      ],
      ctaLabel: "Start My Briefings",
    },
  },
  {
    slug: "enterprise-ai-strategy",
    name: "Enterprise AI Strategy",
    description:
      "Strategic planning for AI adoption across your organization — from pilot programs to full-scale intelligence infrastructure.",
    status: "LIVE",
    audience: "business",
    highlights: [
      "AI readiness assessment",
      "Use case identification and ROI modeling",
      "Implementation roadmap and vendor evaluation",
      "Executive stakeholder alignment",
    ],
    pricing: {
      business: {
        model: "range",
        amount: "$12,000 – $35,000",
        note: "4–6 week engagement — scoped by org size and complexity",
      },
    },
    modalCopy: {
      subtitle: "AI strategy that survives the boardroom.",
      description:
        "Most AI initiatives fail because they lack strategic grounding. We deliver an enterprise AI strategy with clear use cases, ROI projections, and a phased implementation plan your leadership can act on.",
      sections: [
        {
          heading: "Readiness Assessment",
          body: "We evaluate your data infrastructure, team capabilities, and organizational readiness for AI adoption.",
        },
        {
          heading: "Use Case Portfolio",
          body: "Prioritized use cases with ROI modeling, risk assessment, and resource requirements for each.",
        },
        {
          heading: "Implementation Roadmap",
          body: "A phased plan from pilots to scale — including vendor evaluation, governance frameworks, and change management.",
        },
      ],
      ctaLabel: "Plan My AI Strategy",
    },
  },
  {
    slug: "workflow-integration",
    name: "Workflow Integration & Automation",
    description:
      "Connect your tools, eliminate manual handoffs, and automate intelligence flows across your business operations.",
    status: "LIVE",
    audience: "business",
    highlights: [
      "Cross-platform integration design",
      "Automation pipeline build-out",
      "Ongoing monitoring and optimization",
      "Team training included",
    ],
    pricing: {
      business: {
        model: "range",
        amount: "$4,500 – $15,000",
        note: "Or $175/hr for scoped integration work",
      },
    },
    modalCopy: {
      subtitle: "Your tools should talk to each other.",
      description:
        "Manual data entry, copy-paste between systems, and broken handoffs cost your team hours every week. We design and build integrations that automate intelligence flows across your entire operation.",
      sections: [
        {
          heading: "Integration Mapping",
          body: "We map your current tool ecosystem and identify the highest-impact connection points and automations.",
        },
        {
          heading: "Pipeline Build-Out",
          body: "We build reliable automation pipelines with error handling, monitoring, and fallback workflows.",
        },
        {
          heading: "Optimization & Training",
          body: "Ongoing monitoring plus team training ensures automations stay healthy and your team knows how to maintain them.",
        },
      ],
      ctaLabel: "Automate My Workflows",
    },
  },
  {
    slug: "ai-governance-compliance",
    name: "AI Governance & Compliance Framework",
    description:
      "Policies, procedures, and monitoring systems to ensure your AI usage meets regulatory requirements and internal standards.",
    status: "LIVE",
    audience: "business",
    highlights: [
      "Regulatory landscape assessment",
      "AI usage policy development",
      "Risk monitoring and audit trails",
      "Employee training program",
    ],
    pricing: {
      business: {
        model: "range",
        amount: "$8,000 – $25,000",
        note: "Includes 90-day implementation support",
      },
    },
    modalCopy: {
      subtitle: "Use AI confidently, stay compliant.",
      description:
        "As AI regulation accelerates, organizations need governance frameworks before problems arise. We build policies, monitoring systems, and training programs that let you adopt AI at speed without compliance risk.",
      sections: [
        {
          heading: "Regulatory Assessment",
          body: "We map applicable regulations (EU AI Act, state laws, industry standards) to your specific AI use cases.",
        },
        {
          heading: "Policy Development",
          body: "Clear, actionable AI usage policies covering data handling, model selection, human oversight, and accountability.",
        },
        {
          heading: "Monitoring & Training",
          body: "Audit trail systems, risk dashboards, and employee training so governance is lived — not just documented.",
        },
      ],
      ctaLabel: "Build My Framework",
    },
  },
  {
    slug: "team-intelligence-training",
    name: "Team Intelligence Training & Onboarding",
    description:
      "Hands-on training programs that get your team productive with AI tools, intelligence workflows, and Northside systems.",
    status: "LIVE",
    audience: "business",
    highlights: [
      "Role-based curriculum design",
      "Live workshops and async modules",
      "Hands-on practice with real workflows",
      "30-day post-training support",
    ],
    pricing: {
      business: {
        model: "range",
        amount: "$2,500 – $8,500",
        note: "Up to 25 participants per cohort — additional seats quoted separately",
      },
    },
    modalCopy: {
      subtitle: "Tools are useless if your team won't use them.",
      description:
        "The best intelligence infrastructure fails without adoption. We design and deliver training programs tailored to your team's roles, workflows, and skill levels — so everyone is productive from day one.",
      sections: [
        {
          heading: "Curriculum Design",
          body: "Role-based training paths for executives, managers, and individual contributors — focused on their actual workflows.",
        },
        {
          heading: "Live & Async Delivery",
          body: "Interactive workshops combined with self-paced modules and hands-on exercises using your real systems.",
        },
        {
          heading: "Adoption Support",
          body: "30 days of post-training office hours and support to ensure skills stick and questions get answered.",
        },
      ],
      ctaLabel: "Train My Team",
    },
  },
];

export function getServiceBySlug(slug: string): ServiceOffering | undefined {
  return INTELLIGENCE_SERVICES.find((s) => s.slug === slug);
}

export function getServicesByAudience(
  filter: "all" | "individual" | "business"
): ServiceOffering[] {
  let services: ServiceOffering[];
  if (filter === "all") {
    services = [...INTELLIGENCE_SERVICES];
  } else if (filter === "individual") {
    services = INTELLIGENCE_SERVICES.filter(
      (s) => s.audience === "individual" || s.audience === "both"
    );
  } else {
    services = INTELLIGENCE_SERVICES.filter(
      (s) => s.audience === "business" || s.audience === "both"
    );
  }

  return services.sort(
    (a, b) => getServiceSortPriceUsd(a, filter) - getServiceSortPriceUsd(b, filter)
  );
}

/** Lowest displayed price (USD) for sorting listings — respects active audience filter. */
export function getServiceSortPriceUsd(
  service: ServiceOffering,
  filter: "all" | "individual" | "business" = "all"
): number {
  const tiers: ServicePriceTier[] = [];

  if (filter === "individual" || filter === "all") {
    if (service.pricing.individual) tiers.push(service.pricing.individual);
  }
  if (filter === "business" || filter === "all") {
    if (service.pricing.business) tiers.push(service.pricing.business);
  }

  const minimums = tiers
    .map((tier) => parseMinimumPriceUsd(tier.amount))
    .filter((value): value is number => value !== null);

  return minimums.length > 0 ? Math.min(...minimums) : Number.MAX_SAFE_INTEGER;
}

function parseMinimumPriceUsd(amount: string): number | null {
  const numbers: number[] = [];
  const pattern = /\$([\d,]+(?:\.\d+)?)/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(amount)) !== null) {
    numbers.push(Number(match[1].replace(/,/g, "")));
  }
  if (numbers.length === 0) return null;
  return Math.min(...numbers);
}

export function formatPriceTier(tier: ServicePriceTier): string {
  switch (tier.model) {
    case "fixed":
    case "range":
    case "monthly":
    case "hourly":
    case "custom":
      return tier.amount;
    case "starting_at":
      return tier.amount.toLowerCase().startsWith("from ")
        ? tier.amount
        : `From ${tier.amount}`;
  }
}

export interface ServicePriceLine {
  label: string;
  price: string;
  note?: string;
}

export function getServicePriceLines(
  pricing: ServicePricing,
  audience: ServiceAudience
): ServicePriceLine[] {
  const lines: ServicePriceLine[] = [];

  if (pricing.individual && (audience === "individual" || audience === "both")) {
    lines.push({
      label: audience === "both" ? "Individual" : "Price",
      price: formatPriceTier(pricing.individual),
      note: pricing.individual.note,
    });
  }

  if (pricing.business && (audience === "business" || audience === "both")) {
    lines.push({
      label: audience === "both" ? "Business" : "Price",
      price: formatPriceTier(pricing.business),
      note: pricing.business.note,
    });
  }

  return lines;
}

/** @deprecated Use getServicePriceLines for multi-tier display */
export function formatServicePrice(pricing: ServicePricing): string {
  const lines = getServicePriceLines(pricing, "both");
  if (lines.length === 0) return "Contact for pricing";
  if (lines.length === 1) return lines[0].price;
  return lines.map((l) => `${l.label}: ${l.price}`).join(" · ");
}

/** @deprecated Use getServiceBySlug("tailored-intelligence-server") */
export const TAILORED_INTELLIGENCE_SERVER = getServiceBySlug("tailored-intelligence-server")!;

/** @deprecated Use service.modalCopy from offerings */
export const TAILORED_SERVER_MODAL_COPY = {
  title: TAILORED_INTELLIGENCE_SERVER.name,
  subtitle: TAILORED_INTELLIGENCE_SERVER.modalCopy.subtitle,
  description: TAILORED_INTELLIGENCE_SERVER.modalCopy.description,
  sections: TAILORED_INTELLIGENCE_SERVER.modalCopy.sections,
  ctaLabel: TAILORED_INTELLIGENCE_SERVER.modalCopy.ctaLabel,
  accountNote: "A free NI Portal account is required to order a service.",
};

export type AccountType = "personal" | "business";

export interface ServiceRequestPayload {
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
  customBudget?: string;
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
  "Under $500",
  "Under $1,000",
  "$1,000 – $5,000",
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

export const SERVICE_ACCOUNT_NOTE =
  "A free NI Portal account is required to order a service. Create yours in under a minute — no credit card needed.";
