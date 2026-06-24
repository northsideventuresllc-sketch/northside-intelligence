import type { Sector3ToolSlug } from "@/lib/sector3-registry";
import { getSector3ToolHelpContent } from "@/lib/sector3-tools/help-content";

export interface Sector3ToolChatConfig {
  enabled: boolean;
  buttonLabel: string;
  modalTitle: string;
  welcomeMessage: string;
  inputPlaceholder: string;
}

const CHAT_BY_SLUG: Record<Sector3ToolSlug, Sector3ToolChatConfig> = {
  replyflow: {
    enabled: false,
    buttonLabel: "",
    modalTitle: "",
    welcomeMessage: "",
    inputPlaceholder: "",
  },
  grantbot: {
    enabled: true,
    buttonLabel: "Ask GrantBot",
    modalTitle: "GrantBot Advisor",
    welcomeMessage:
      "Ask me about grant fit, eligibility, application strategy, or how to strengthen your draft. I have context from your search.",
    inputPlaceholder: "Which grant should I prioritize? How do I improve my narrative?",
  },
  signaldesk: {
    enabled: true,
    buttonLabel: "Discuss Brief",
    modalTitle: "Signal Desk Analyst",
    welcomeMessage:
      "Ask follow-up questions about your intelligence brief — reprioritize signals, stress-test assumptions, or plan next moves.",
    inputPlaceholder: "What should I act on first? How urgent is the competitive threat?",
  },
  gapscan: {
    enabled: true,
    buttonLabel: "Discuss Gaps",
    modalTitle: "GapScan Advisor",
    welcomeMessage:
      "Dig deeper into your gap report — clarify severity, compare fixes, or plan implementation order.",
    inputPlaceholder: "Which gap should I fix first? What's the fastest win?",
  },
  bridgeai: {
    enabled: true,
    buttonLabel: "Discuss Plan",
    modalTitle: "BridgeAI Architect",
    welcomeMessage:
      "Ask about your orchestration plan — implementation order, API choices, data mapping, or risk mitigation.",
    inputPlaceholder: "How should I handle failures? What webhook pattern fits best?",
  },
};

export function getSector3ToolChatConfig(slug: string): Sector3ToolChatConfig | null {
  if (!(slug in CHAT_BY_SLUG)) return null;
  return CHAT_BY_SLUG[slug as Sector3ToolSlug];
}

export function isSector3ChatEnabled(slug: string): boolean {
  return getSector3ToolChatConfig(slug)?.enabled ?? false;
}

export function buildSector3ChatSystemPrompt(
  slug: Sector3ToolSlug,
  context: {
    inputs?: Record<string, string>;
    result?: string;
    extra?: Record<string, unknown>;
  }
): string {
  const help = getSector3ToolHelpContent(slug);
  const summary = help?.summary ?? "";

  const inputBlock = context.inputs
    ? Object.entries(context.inputs)
        .filter(([, v]) => v?.trim())
        .map(([k, v]) => `${k}: ${v}`)
        .join("\n")
    : "";

  const resultBlock = context.result?.trim()
    ? `\n\nLatest generated output:\n${context.result.slice(0, 4000)}`
    : "";

  let extraBlock = "";
  if (slug === "grantbot" && context.extra?.listings) {
    extraBlock = `\n\nGrant matches:\n${JSON.stringify(context.extra.listings, null, 2).slice(0, 3000)}`;
  }

  const toolVoice: Record<Sector3ToolSlug, string> = {
    replyflow: "ReplyFlow customer support specialist",
    grantbot: "GrantBot grant advisor for nonprofits and creators",
    signaldesk: "Signal Desk intelligence analyst",
    gapscan: "GapScan workflow and product gap specialist",
    bridgeai: "BridgeAI integration architect",
  };

  return `You are the in-app ${toolVoice[slug]} for Northside Intelligence.

Tool purpose: ${summary}

The user already ran a generation. Use their inputs and output below to answer follow-up questions conversationally. Be specific and actionable. Keep replies concise (2-4 short paragraphs max). Do not invent features outside this tool's scope.

User inputs:
${inputBlock || "(none provided)"}${resultBlock}${extraBlock}`;
}
