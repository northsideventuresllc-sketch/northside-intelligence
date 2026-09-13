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
      "A bespoke private intelligence server built around your proprietary workflows, data, and security requirements — designed, deployed, and maintained by Northside Intelligence.",
    status: "LIVE",
    audience: "both",
    highlights: [
      "Custom private intelligence server architecture (cloud or on-premise) with zero data leakage",
      "Private semantic knowledge search across company documents, databases & internal tools",
      "Integration with existing workflows, multi-agent automations, and role-based permissions",
      "Continuous system maintenance, automated backups, and 99.9% uptime reliability",
    ],
    pricing: {
      individual: {
        model: "range",
        amount: "$499 – $4,500",
        note: "Personal & home-office setups ($499–$4.5k, mgmt from $49/mo)",
      },
      business: {
        model: "range",
        amount: "$5,000 – $100,000+",
        note: "Team Server ($5k–$25k, mgmt $399/mo) | Enterprise Scale ($25k–$100k+, mgmt $1.2k/mo)",
      },
    },
    modalCopy: {
      subtitle: "Your own private intelligence brain — secured and fully managed.",
      description:
        "Northside Intelligence engineers and manages dedicated, private intelligence servers tailored to your operations. Keep your proprietary company data secure while unlocking private semantic search, automated workflows, and custom AI agents.",
      sections: [
        {
          heading: "Comprehensive Architecture Discovery",
          body: "We map your data landscape, security compliance needs, and workflow bottlenecks — designing an architecture that scales with your growth without boxing you into rigid constraints.",
        },
        {
          heading: "Private, Secure Deployment",
          body: "Our team deploys your dedicated server — integrated with your internal tools, configured with strict encryption and role-based access, and tested under real operational loads.",
        },
        {
          heading: "Proactive Ongoing Management",
          body: "We handle server maintenance, model performance tuning, automated nightly backups, and security patches so your intelligence infrastructure runs uninterrupted.",
        },
      ],
      ctaLabel: "Start Your Request",
    },
  },
  {
    slug: "intelligence-audit",
    name: "Intelligence Audit & Gap Analysis",
    description:
      "A comprehensive diagnostic review of your current systems, workflows, data bottlenecks, and intelligence gaps — delivered with an actionable, prioritized ROI roadmap.",
    status: "LIVE",
    audience: "both",
    highlights: [
      "End-to-end workflow, tool ecosystem, and data bottleneck mapping",
      "Actionable gap identification with clear ROI modeling and cost-saving estimates",
      "Prioritized implementation roadmap from quick wins to strategic architecture",
      "30-day post-audit advisory consultation and execution support included",
    ],
    pricing: {
      individual: {
        model: "range",
        amount: "$299 – $799",
        note: "Solopreneurs & solo founders — 1-week turnaround; advisory from $49/mo",
      },
      business: {
        model: "range",
        amount: "$1,500 – $15,000+",
        note: "Small Business ($1.5k–$4.5k) | Enterprise / Mid-Market ($5k–$15k+)",
      },
    },
    modalCopy: {
      subtitle: "Know where you stand before you build or buy.",
      description:
        "Before investing in new software, AI tools, or infrastructure, diagnose exactly where your operational bottlenecks and intelligence gaps are. Our audit delivers a clear, ranked execution roadmap — not generic advice.",
      sections: [
        {
          heading: "System & Workflow Mapping",
          body: "We map your current tools, data handoffs, and operational friction points across your entire personal or business stack.",
        },
        {
          heading: "Gap Analysis & ROI Modeling",
          body: "We identify redundant software, manual bottlenecks, and missed opportunities — showing the exact hours and dollars saved by closing each gap.",
        },
        {
          heading: "Prioritized Action Roadmap",
          body: "You receive a structured implementation plan categorized by immediate quick wins, medium-term automations, and strategic infrastructure investments.",
        },
      ],
      ctaLabel: "Request an Audit",
    },
  },
  {
    slug: "personal-intelligence-setup",
    name: "Personal Intelligence Setup",
    description:
      "A bespoke personal intelligence environment — research tools, second-brain note systems, AI assistants, and automated workflows configured for your unique cognitive style.",
    status: "LIVE",
    audience: "individual",
    highlights: [
      "Personal cognitive workflow assessment & tool stack audit",
      "Custom tool configuration (Obsidian second brain, AI assistants, API automations)",
      "Hands-on 1-on-1 walkthrough and 30-day continuous support",
      "Privacy-first local/cloud architecture with zero data sharing",
    ],
    pricing: {
      individual: {
        model: "range",
        amount: "$149 – $950",
        note: "Starter Setup ($149–$349) | Full Cognitive Stack ($499–$950); maintenance from $29/mo",
      },
    },
    modalCopy: {
      subtitle: "Your personal intelligence stack, configured around how you think.",
      description:
        "Stop juggling disconnected apps and forgetting critical ideas. Northside Intelligence builds a cohesive personal intelligence environment — connecting research feeds, knowledge bases, AI agents, and automations into one seamless system.",
      sections: [
        {
          heading: "Cognitive Workflow Assessment",
          body: "We map your daily routines, information gathering, and decision-making patterns to design an intuitive setup.",
        },
        {
          heading: "Custom Stack Configuration",
          body: "We configure your tools — from localized AI assistants to interconnected knowledge vaults — into one unified workspace.",
        },
        {
          heading: "Walkthrough & Ongoing Support",
          body: "Hands-on walkthrough plus 30 days of direct support so you master your personal intelligence environment with zero friction.",
        },
      ],
      ctaLabel: "Get Started",
    },
  },
  {
    slug: "ai-research-assistant",
    name: "AI Research Assistant Setup",
    description:
      "A custom AI research assistant calibrated to your specific domains, trusted sources, and verification methodology — delivering fast, hallucination-free intelligence.",
    status: "LIVE",
    audience: "individual",
    highlights: [
      "Domain-specific source curation across academic, market, and technical databases",
      "Custom prompt engineering, verification filters, and citation workflows",
      "Automated literature and market synthesis pipelines",
      "60-day ongoing tuning and model refinement",
    ],
    pricing: {
      individual: {
        model: "range",
        amount: "$149 – $750",
        note: "Starter Assistant ($149–$299) | Multi-Domain Research Engine ($399–$750)",
      },
    },
    modalCopy: {
      subtitle: "Domain research that matches your standards — cited and verified.",
      description:
        "Generic AI tools hallucinate and give surface-level summaries. We build a specialized research assistant calibrated to your domains, databases, and quality benchmarks — delivering verifiable insights you can trust.",
      sections: [
        {
          heading: "Source & Database Curation",
          body: "We connect trusted journals, market feeds, and private reference archives relevant to your specific research focus.",
        },
        {
          heading: "Verification Methodology",
          body: "Custom prompts, cross-referencing logic, and citation pipelines ensure every finding is backed by evidence.",
        },
        {
          heading: "60-Day Adaptive Tuning",
          body: "Continuous refinement based on your daily feedback — sharpening the assistant's accuracy with every query.",
        },
      ],
      ctaLabel: "Set Up My Assistant",
    },
  },
  {
    slug: "personal-knowledge-base",
    name: "Personal Knowledge Base Build",
    description:
      "A structured, searchable semantic knowledge vault for your lifetime notes, research, and insights — connected to your AI tools with automated bi-directional linking.",
    status: "LIVE",
    audience: "individual",
    highlights: [
      "Information architecture and interconnected graph taxonomy design",
      "Semantic search and AI-powered associative retrieval",
      "Full migration of existing notes from Notion, Apple Notes, or Google Docs",
      "Cross-device encryption and automated backup synchronization",
    ],
    pricing: {
      individual: {
        model: "range",
        amount: "$199 – $950",
        note: "Starter Vault ($199–$399) | Full Historical Migration & Graph System ($499–$950)",
      },
    },
    modalCopy: {
      subtitle: "Everything you've ever learned — instantly searchable and interconnected.",
      description:
        "Your notes and insights scattered across fragmented apps are lost opportunities. We build a unified, future-proof semantic knowledge base with AI search that connects your past learning directly to your current decisions.",
      sections: [
        {
          heading: "Adaptive Architecture Design",
          body: "We design a dynamic structure matching your natural associative memory — eliminating rigid, forgotten folder hierarchies.",
        },
        {
          heading: "Data Migration & Cleaning",
          body: "We migrate your historical notes, clean formatting, and link related concepts across years of accumulated ideas.",
        },
        {
          heading: "Semantic AI Retrieval",
          body: "Search by concepts, themes, or fuzzy memories — instantly surfacing the exact note, reference, or insight you need.",
        },
      ],
      ctaLabel: "Build My Knowledge Base",
    },
  },
  {
    slug: "executive-briefing-intelligence",
    name: "Executive Briefing Intelligence",
    description:
      "Automated high-signal daily and weekly intelligence briefings tailored to your specific markets, competitors, policy updates, and executive decision priorities.",
    status: "LIVE",
    audience: "individual",
    highlights: [
      "Custom executive briefing templates and priority signal filters",
      "Multi-source aggregation (news, regulatory filings, competitor tracking)",
      "Zero noise — strictly high-impact operational intelligence",
      "Automated delivery via email, private portal dashboard, or Telegram",
    ],
    pricing: {
      individual: {
        model: "monthly",
        amount: "$49 – $149/mo",
        note: "Setup: $149 (waived with annual subscription)",
      },
    },
    modalCopy: {
      subtitle: "Stay 10 steps ahead without the information overload.",
      description:
        "Stop drowning in endless news feeds and fragmented email newsletters. We engineer automated briefing pipelines that filter out the noise and surface only the high-impact shifts that dictate your strategic decisions.",
      sections: [
        {
          heading: "Executive Priority Mapping",
          body: "We map your specific strategic landscape — tracking target industries, key competitors, macroeconomic signals, and emerging tech.",
        },
        {
          heading: "High-Signal AI Filtering",
          body: "Multi-layered filtering strips out fluff and clickbait, highlighting only verified market intelligence with clear business implications.",
        },
        {
          heading: "Automated Executive Dispatch",
          body: "Delivered on your exact schedule via executive email digests or private mobile push for rapid morning scanning.",
        },
      ],
      ctaLabel: "Start My Briefings",
    },
  },
  {
    slug: "enterprise-ai-strategy",
    name: "Enterprise AI Strategy",
    description:
      "Boardroom-ready strategic roadmaps for AI adoption across your organization — from pilot feasibility and vendor evaluation to enterprise ROI modeling and infrastructure.",
    status: "LIVE",
    audience: "business",
    highlights: [
      "Comprehensive AI readiness assessment & data infrastructure evaluation",
      "Prioritized use-case portfolio with EBITDA and ROI financial modeling",
      "Phased implementation roadmap, vendor selection matrix, and change management",
      "Executive stakeholder alignment & board-ready strategic presentations",
    ],
    pricing: {
      business: {
        model: "range",
        amount: "$4,500 – $65,000+",
        note: "Growth ($4.5k–$9.5k) | Mid-Market ($12k–$25k) | Corporate ($25k–$65k+); advisory from $499/mo",
      },
    },
    modalCopy: {
      subtitle: "AI strategy that survives the boardroom and drives real EBITDA.",
      description:
        "Most enterprise AI initiatives fail because they lack financial grounding and strategic alignment. Northside Intelligence delivers an actionable AI roadmap with validated use cases, ROI projections, and a phased execution blueprint your leadership can execute with confidence.",
      sections: [
        {
          heading: "Readiness & Data Assessment",
          body: "We evaluate your existing software stack, data architecture, security posture, and team capabilities for production AI adoption.",
        },
        {
          heading: "Use Case Portfolio & ROI Modeling",
          body: "We rank high-impact use cases by feasibility and EBITDA impact — modeling resource requirements, expected cost savings, and revenue expansion.",
        },
        {
          heading: "Phased Implementation Blueprint",
          body: "A structured rollout plan from rapid proof-of-concepts to full enterprise deployment — including build vs. buy matrices, governance, and vendor selection.",
        },
      ],
      ctaLabel: "Plan My AI Strategy",
    },
  },
  {
    slug: "workflow-integration",
    name: "Workflow Integration & Automation",
    description:
      "Connect your disparate tools, eliminate manual handoffs, and automate intelligence workflows with self-healing error handling across your operations.",
    status: "LIVE",
    audience: "both",
    highlights: [
      "Cross-platform integration design & API bridges (CRM, Stripe, databases, internal apps)",
      "Autonomous automation pipeline build-out with dead-letter queue error recovery",
      "Elimination of repetitive manual data entry, handoff bottlenecks, and delayed ops",
      "Ongoing system monitoring, performance tuning, and team workflow training",
    ],
    pricing: {
      individual: {
        model: "range",
        amount: "$950 – $2,500",
        note: "Solopreneurs & creators — 2–4 tool connections; management from $99/mo",
      },
      business: {
        model: "range",
        amount: "$3,500 – $25,000+",
        note: "Business ($3.5k–$8.5k, mgmt $299/mo) | Enterprise ($10k–$25k+, mgmt $699/mo)",
      },
    },
    modalCopy: {
      subtitle: "Your tools should talk to each other — flawlessly.",
      description:
        "Manual data entry, disconnected SaaS platforms, and broken handoffs cost your team hundreds of hours and lost revenue. Northside Intelligence designs, engineers, and monitors custom automation pipelines that keep your intelligence flowing automatically.",
      sections: [
        {
          heading: "Comprehensive Friction Diagnostic",
          body: "We map your entire operational landscape — identifying repetitive tasks, sync bottlenecks, delayed responses, and high-impact automation opportunities.",
        },
        {
          heading: "Resilient Pipeline Engineering",
          body: "We engineer robust automation pipelines with self-healing error recovery, webhook transformations, and fallback workflows so your data never drops.",
        },
        {
          heading: "Continuous Optimization & Training",
          body: "Ongoing monitoring plus hands-on team training ensures automations stay resilient, fast, and aligned with your evolving business operations.",
        },
      ],
      ctaLabel: "Automate My Workflows",
    },
  },
  {
    slug: "ai-governance-compliance",
    name: "AI Governance & Compliance Framework",
    description:
      "Enterprise policies, automated monitoring systems, and audit trails to ensure organizational AI usage meets global regulatory standards and internal security requirements.",
    status: "LIVE",
    audience: "business",
    highlights: [
      "Regulatory assessment (EU AI Act, HIPAA, SOC2, state privacy frameworks)",
      "Comprehensive internal AI usage policies and data-handling standards",
      "Automated audit trail logging, data leakage monitors, and risk dashboards",
      "Employee compliance training program and 90-day implementation support",
    ],
    pricing: {
      business: {
        model: "range",
        amount: "$3,500 – $35,000+",
        note: "Compliance Starter ($3.5k–$7.5k) | Mid-Market ($8k–$18k) | Enterprise ($20k–$35k+); retainer from $399/mo",
      },
    },
    modalCopy: {
      subtitle: "Deploy production AI with total confidence and zero compliance liability.",
      description:
        "As global AI regulations accelerate, organizations need robust governance before liabilities arise. Northside Intelligence builds institutional policies, automated audit trails, and monitoring systems that let your teams move fast without compliance risks.",
      sections: [
        {
          heading: "Regulatory & Risk Diagnostic",
          body: "We map applicable global standards and industry frameworks against your specific software tools, data pipelines, and vendor models.",
        },
        {
          heading: "Policy Architecture & Safeguards",
          body: "Clear, enforceable AI usage policies covering proprietary data boundaries, model selection, human oversight, and IP protection.",
        },
        {
          heading: "Automated Audit Systems & Training",
          body: "Real-time risk monitoring dashboards, encrypted audit trails, and interactive employee training to ensure living compliance.",
        },
      ],
      ctaLabel: "Build My Framework",
    },
  },
  {
    slug: "team-intelligence-training",
    name: "Team Intelligence Training & Onboarding",
    description:
      "Hands-on role-based training programs and async academies that get your teams highly productive with production AI tools, workflows, and autonomous systems.",
    status: "LIVE",
    audience: "business",
    highlights: [
      "Role-based curriculum designed around actual daily team workflows",
      "Interactive live workshops and self-paced async video/code modules",
      "Hands-on exercises solving real company operational bottlenecks",
      "30-day post-training office hours and continuous adoption coaching",
    ],
    pricing: {
      business: {
        model: "range",
        amount: "$1,500 – $18,000+",
        note: "Small Team Cohort (≤10 seats: $1.5k–$3.5k) | Mid-Market ($4.5k–$8.5k) | Enterprise ($10k–$18k+)",
      },
    },
    modalCopy: {
      subtitle: "The best AI tools are useless if your team doesn't adopt them.",
      description:
        "Technology investments only deliver ROI when your workforce uses them daily. We deliver tailored training programs mapped to your team's specific roles, systems, and skill levels — turning AI from a novelty into an operational supercharger.",
      sections: [
        {
          heading: "Role-Specific Curriculum",
          body: "Custom learning paths for executives, operations managers, and individual contributors — focused entirely on their real daily tasks.",
        },
        {
          heading: "Interactive Execution & Labs",
          body: "Hands-on workshops using your actual tools and data — building real automations, prompts, and workflows during training.",
        },
        {
          heading: "Continuous Adoption Coaching",
          body: "30 days of office hours, async Q&A, and workflow optimization reviews to make sure productivity gains stick permanently.",
        },
      ],
      ctaLabel: "Train My Team",
    },
  },
  {
    slug: "custom-web-design-management",
    name: "Custom Web Design and Management",
    description:
      "Modern, sub-second responsive Next.js websites with flexible design systems (dynamic, 3D interactive, or high-trust) and ongoing hands-free management.",
    status: "LIVE",
    audience: "both",
    highlights: [
      "Custom Next.js design tailored to your audience (dynamic, 3D interactive, or conversion-focused)",
      "Guaranteed sub-second load times & mobile-first responsiveness",
      "Built-in SEO fundamentals, analytics, and conversion lead captures",
      "Hands-free ongoing management: updates, security, hosting & backups",
    ],
    pricing: {
      individual: {
        model: "range",
        amount: "$750 – $2,000",
        note: "Solopreneurs, creators & portfolios — management from $79/mo",
      },
      business: {
        model: "range",
        amount: "$2,500 – $35,000+",
        note: "Small Business ($2.5k–$7.5k, mgmt $199/mo) | Enterprise ($10k–$35k+, mgmt $499/mo)",
      },
    },
    modalCopy: {
      subtitle: "Fast, custom-tailored, and completely managed.",
      description:
        "Whether you're a solopreneur needing a high-converting portfolio or an enterprise scaling a multi-location platform, Northside Intelligence designs, engineers, and manages custom Next.js web applications tailored to your specific audience.",
      sections: [
        {
          heading: "Audience & Aesthetic Matching",
          body: "We diagnose your audience and match the exact visual style that drives conversions — whether that's 3D interactive depth, clean dynamic typography, or direct high-trust layouts.",
        },
        {
          heading: "Modern Next.js Engineering",
          body: "We engineer lightning-fast sites with sub-second load times, automated appointment booking, quote calculators, SEO fundamentals, and seamless third-party integrations.",
        },
        {
          heading: "Worry-Free Ongoing Management",
          body: "Zero tech headaches. We handle hosting, continuous speed optimizations, security patches, regular content updates, and automated backups so you stay focused on growing your business.",
        },
      ],
      ctaLabel: "Start Your Request",
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
  "Emergency / Critical (Same-Week / Immediate)",
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
