import "server-only";

export type ReplyTone = "empathetic" | "firm_deescalation" | "vip_executive" | "casual" | "investor_concise" | "technical";

export interface ToneGuideline {
  tone: ReplyTone;
  label: string;
  description: string;
  guidelines: string[];
  forbiddenPhrases: string[];
  exampleOpenings: string[];
}

export const TONE_REGISTRY: Record<ReplyTone, ToneGuideline> = {
  empathetic: {
    tone: "empathetic",
    label: "Warm & Empathetic",
    description: "Deeply validates customer frustration, accepts accountability without defensive excuses, and offers immediate resolution.",
    guidelines: [
      "Acknowledge the specific inconvenience before presenting any instructions.",
      "Use active voice and personal responsibility ('I have resolved this for you').",
      "Keep sentences concise and solution-focused.",
    ],
    forbiddenPhrases: [
      "Per our policy",
      "As stated in our terms",
      "Calm down",
      "You should have known",
    ],
    exampleOpenings: [
      "I completely understand how frustrating this delay has been, and I am stepping in to make this right immediately.",
      "Thank you for reaching out and letting us know—you are completely right, and I am on this right now.",
    ],
  },
  firm_deescalation: {
    tone: "firm_deescalation",
    label: "Firm & Professional De-escalation",
    description: "Neutral, calm, and unshakable. De-escalates heated disputes while maintaining firm corporate boundary integrity.",
    guidelines: [
      "Never match hostility or defensive language.",
      "State facts objectively without emotional adjectives.",
      "Provide a clear, single path forward or final boundary.",
    ],
    forbiddenPhrases: [
      "That's not our fault",
      "You are wrong",
      "Calm down",
      "Stop yelling",
    ],
    exampleOpenings: [
      "I hear your concern clearly. Let us focus directly on resolving the core issue at hand.",
      "We take these matters very seriously. Here are the exact facts and the steps we can take today.",
    ],
  },
  vip_executive: {
    tone: "vip_executive",
    label: "VIP & Enterprise White-Glove",
    description: "High-touch, articulate, and proactive. Treats the client as a high-value strategic partner.",
    guidelines: [
      "Anticipate secondary questions before they are asked.",
      "Provide direct executive contact and dedicated priority handling.",
      "Value brevity and immediate operational clarity.",
    ],
    forbiddenPhrases: [
      "Submit a ticket",
      "Wait 3-5 business days",
      "I don't know",
    ],
    exampleOpenings: [
      "Thank you for flagging this directly. As a key strategic partner, you have our leadership team's immediate attention.",
      "I have personally reviewed your account and escalated this directly to our senior engineering lead.",
    ],
  },
  casual: {
    tone: "casual",
    label: "Candid & Modern Casual",
    description: "Friendly, direct, jargon-free peer communication suited for modern creator and SaaS audiences.",
    guidelines: [
      "Write like a human talking to a respected colleague.",
      "Zero corporate buzzwords or stiff bureaucratic filler.",
      "Short paragraphs and clear next steps.",
    ],
    forbiddenPhrases: [
      "Please be advised",
      "Pursuant to",
      "Dear Sir/Madam",
    ],
    exampleOpenings: [
      "Hey! Thanks for bringing this up—let's get this sorted out for you right now.",
      "Good catch! I appreciate you pointing this out—here is what's happening.",
    ],
  },
  investor_concise: {
    tone: "investor_concise",
    label: "Investor & Board Concise",
    description: "Ultra-condensed, metric-driven, bottom-line upfront (BLUF).",
    guidelines: [
      "Lead with the outcome/bottom-line in sentence one.",
      "Support with 2-3 high-impact quantitative bullet points.",
      "Zero emotional hedging or narrative fluff.",
    ],
    forbiddenPhrases: [
      "We hope to",
      "It is our aspiration",
      "In our humble opinion",
    ],
    exampleOpenings: [
      "Bottom line: Milestone 2 is complete, user retention increased 14%, and burn remains within target.",
      "Here is the executive update regarding the customer escalation and our containment plan.",
    ],
  },
  technical: {
    tone: "technical",
    label: "Technical Support & RCA",
    description: "Precise, reproducible, and transparent. Provides exact root cause and verifiable verification steps.",
    guidelines: [
      "Identify the specific technical state or error code.",
      "Provide step-by-step reproduction or resolution sequence.",
      "Include telemetry or status page verification link.",
    ],
    forbiddenPhrases: [
      "Just restart your computer",
      "Works for me",
      "Try again later",
    ],
    exampleOpenings: [
      "We traced this to a transient timeout in our webhook pipeline. Here is the root cause analysis and resolution.",
      "Here are the exact diagnostic steps to verify your API connection.",
    ],
  },
};
