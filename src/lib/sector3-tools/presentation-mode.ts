import type { Sector3ToolSlug } from "@/lib/sector3-registry";

export type Sector3PresentationMode = "simple" | "technical";

/** Tools that ship a ---TECHNICAL--- layer in AI output. */
export const TOOLS_WITH_TECHNICAL_VIEW: Sector3ToolSlug[] = [
  "signaldesk",
  "gapscan",
  "bridgeai",
];

export function toolHasTechnicalView(slug: string): boolean {
  return TOOLS_WITH_TECHNICAL_VIEW.includes(slug as Sector3ToolSlug);
}

export function canAccessTechnicalView(options: {
  canAccessTechnicalView: boolean;
}): boolean {
  return options.canAccessTechnicalView;
}

export const SIMPLE_SECTION_LABELS: Record<string, string> = {
  "the big picture": "The Big Picture",
  "what matters most": "What Matters Most",
  "what to do next": "What to Do Next",
  "keep an eye on": "Keep an Eye On",
  "what we found": "What We Found",
  "problems to fix": "Problems to Fix",
  "easy fixes first": "Easy Fixes First",
  "longer-term ideas": "Longer-Term Ideas",
  "in plain english": "In Plain English",
  "your step-by-step guide": "Your Step-by-Step Guide",
  "things to watch out for": "Things to Watch Out For",
};

export function friendlySectionLabel(title: string): string {
  const key = title.toLowerCase().trim();
  return SIMPLE_SECTION_LABELS[key] ?? title;
}
