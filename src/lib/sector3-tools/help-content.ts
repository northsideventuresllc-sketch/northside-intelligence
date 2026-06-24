import { getSector3BySlug, type Sector3ToolSlug } from "@/lib/sector3-registry";

export interface Sector3ToolHelpFaq {
  question: string;
  answer: string;
}

export interface Sector3ToolHelpContent {
  summary: string;
  faqs: Sector3ToolHelpFaq[];
}

const HELP_BY_SLUG: Record<Sector3ToolSlug, Sector3ToolHelpContent> = {
  replyflow: {
    summary:
      "ReplyFlow turns customer messages into polished, on-brand replies. Paste a message, choose tone and scenario, and ship a response in seconds.",
    faqs: [
      {
        question: "What kinds of messages work best?",
        answer:
          "Support emails, chat transcripts, social DMs, and review responses all work well. Paste the full customer message — context helps ReplyFlow match tone and intent.",
      },
      {
        question: "How do tone and scenario affect the reply?",
        answer:
          "Tone controls voice (Professional, Friendly, Empathetic, Firm). Scenario nudges structure and priorities — refunds emphasize policy and empathy; complaints lead with acknowledgment.",
      },
      {
        question: "Can I edit the generated reply?",
        answer:
          "Yes. Copy the output and tweak it in your help desk or inbox. Recent sessions let you reload past inputs and outputs anytime.",
      },
      {
        question: "What counts toward my monthly limit?",
        answer:
          "Each generated reply counts as one use. Unlimited NI subscribers on ReplyFlow have no cap; free tier includes a monthly allowance shown on your dashboard.",
      },
    ],
  },
  grantbot: {
    summary:
      "GrantBot matches nonprofits and creators to relevant funding opportunities and drafts application copy tailored to your organization.",
    faqs: [
      {
        question: "What should I put in the organization description?",
        answer:
          "Include your mission, who you serve, location, program goals, and what funding would unlock. The more specific you are, the better the grant matches.",
      },
      {
        question: "Why does GrantBot ask follow-up questions?",
        answer:
          "Clarifying questions narrow eligibility — budget size, tax status, geography, and focus area — so results are grants you can realistically pursue.",
      },
      {
        question: "Are grant listings guaranteed to be open?",
        answer:
          "GrantBot surfaces likely fits based on your profile. Always verify deadlines, eligibility, and application portals on the funder's official site before applying.",
      },
      {
        question: "How do application drafts work?",
        answer:
          "After you find a match, GrantBot can draft narrative sections you can edit. Drafts are starting points — review requirements and customize before submission.",
      },
    ],
  },
  signaldesk: {
    summary:
      "Signal Desk ranks raw intelligence — news, metrics, competitor moves, and market chatter — into a prioritized brief with clear next actions.",
    faqs: [
      {
        question: "What should I paste into raw signals?",
        answer:
          "Headlines, KPI snapshots, competitor announcements, customer quotes, social threads, or internal notes. Bullet points and fragments are fine — Signal Desk synthesizes them.",
      },
      {
        question: "How do focus areas change the brief?",
        answer:
          "Focus area steers emphasis: Market weights trends and demand; Competitive highlights rival moves; Product centers roadmap implications; Regulatory flags compliance risk.",
      },
      {
        question: "How are signals prioritized?",
        answer:
          "Each run ranks items by urgency (High / Medium / Low) with evidence and recommended actions. Re-run when you add new signals or shift focus.",
      },
      {
        question: "Can I use this for weekly team updates?",
        answer:
          "Yes. Many teams paste a week's worth of inputs and use the Executive Summary and Recommended Actions sections in standups or leadership memos.",
      },
    ],
  },
  gapscan: {
    summary:
      "GapScan surfaces severity-ranked gaps in workflows, products, and markets — plus quick wins you can act on before friction compounds.",
    faqs: [
      {
        question: "What scan type should I choose?",
        answer:
          "Workflow scans process and handoff friction; Product scans feature and UX gaps; Market scans competitive whitespace and unmet demand in your category.",
      },
      {
        question: "What makes good context to scan?",
        answer:
          "Describe the current state, where users stall, what competitors offer, and what outcomes you want. Include steps, tools, and pain points — not just symptoms.",
      },
      {
        question: "How should I read severity ratings?",
        answer:
          "Critical gaps block value or revenue now; Moderate gaps create drag or churn risk; Minor gaps are polish or nice-to-haves. Quick Wins are fixes with outsized impact.",
      },
      {
        question: "Can I scan the same workflow twice?",
        answer:
          "Yes. Re-scan after changes to compare improvements or paste updated context. Recent runs stay in your session history for reference.",
      },
    ],
  },
  bridgeai: {
    summary:
      "BridgeAI designs step-by-step orchestration plans to connect two systems — CRM to billing, inbox to CRM, spreadsheets to APIs — with risks and data mapping notes.",
    faqs: [
      {
        question: "What do I put for source and target systems?",
        answer:
          "Name the tools or platforms (e.g. HubSpot, Stripe, Gmail, Airtable). Include relevant objects — deals, subscriptions, contacts — if you know them.",
      },
      {
        question: "How detailed should my integration goal be?",
        answer:
          "State the trigger, expected outcome, and edge cases. Example: when a deal hits Closed Won, create a Stripe subscription and sync metadata for support.",
      },
      {
        question: "Does BridgeAI write production code?",
        answer:
          "BridgeAI outputs an architecture overview, step-by-step plan, data mapping, and suggested APIs. Your team implements or hands the plan to a developer.",
      },
      {
        question: "What if my stack uses custom internal tools?",
        answer:
          "Describe the internal system like any other source or target. BridgeAI will propose webhook, queue, or API patterns even when exact products are non-standard.",
      },
    ],
  },
};

export function getSector3ToolHelpContent(slug: string): Sector3ToolHelpContent | null {
  if (!(slug in HELP_BY_SLUG)) return null;
  const entry = getSector3BySlug(slug as Sector3ToolSlug);
  const content = HELP_BY_SLUG[slug as Sector3ToolSlug];
  return {
    summary: content.summary || entry.description,
    faqs: content.faqs,
  };
}

export function isValidSector3HelpSlug(slug: string): slug is Sector3ToolSlug {
  return slug in HELP_BY_SLUG;
}
