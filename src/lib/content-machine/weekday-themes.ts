import { CONTENT_DAYS_LONG, DEFAULT_BRAND_SLUG } from "./constants";
import type { ContentPostType, ContentTargetGroup, WeekdayTheme } from "./types";

/**
 * BUILD fix 2026-09-07 (content-machine wrong-brand bug, ROOT CAUSE ROUND 4 — the deepest
 * one, found only by re-checking a REAL post-fix generation run rather than assuming the
 * tone-rule fix was enough): getWeekdayTheme() / getThemeAudienceForPost() / buildSlotBrief()
 * took no brandSlug at all and always indexed into this file's single WEEKDAY_THEMES
 * constant — Match Fit's own literal weekly content calendar ("Founding Fitness Pro
 * spotlight", target groups "Join the Team" / "List With Us", angles like "apply at
 * match-fit.net/trainer/signup"). Every brand's actual USER PROMPT (buildSlotBrief's
 * Day/Theme/Format/Angle block, not just the system prompt) was this, verbatim, regardless
 * of brandSlug. No system-prompt-level "don't mention Match Fit" instruction can fully
 * overcome a task brief that literally instructs "spotlight founding Fitness Pros on Match
 * Fit" for that day.
 *
 * Confirmed live 2026-09-07 17:19 UTC, AFTER the tone-rule contamination fix (see
 * stripBannedReferences in quality-gate.ts) was already deployed: grantbot/gapscan/ni-store
 * still generated "Founding Fitness Pro" / literal "Match Fit" copy on attempt 1 — with
 * clean tone rules, no few-shots configured for these brands at all, and sanitized
 * learnings. This file was the one remaining source of that exact vocabulary, because it
 * was the actual content brief, not incidental context.
 *
 * Renamed to MATCH_FIT_WEEKDAY_THEMES (used only for brand_slug 'match-fit', behavior
 * unchanged) and added DEFAULT_WEEKDAY_THEMES below — a real, brand-agnostic weekly
 * skeleton for every other brand, built from generic content pillars (feature spotlight,
 * user education, use-case story, trust/proof, direct CTA) with zero Match Fit vocabulary.
 * Each brand's actual product specifics still come from CONTENT_MACHINE_BRAND_FACTS
 * (constants.ts) elsewhere in the prompt — this skeleton only shapes the day's angle, not
 * the product facts.
 */
export const MATCH_FIT_WEEKDAY_THEMES: WeekdayTheme[] = [
  {
    dayIndex: 0,
    name: "Fitness Pro spotlight",
    headline: "Founding Fitness Pro spotlight",
    themeBrief:
      "Spotlight founding Fitness Pros on Match Fit — why pros join early, peer proof, and founding benefits. Not client tips or weekend booking CTAs.",
    audienceByPostType: {
      Carousel: "Join the Team",
      Static: "List With Us",
      Video: "Join the Team",
      Text: "Join the Team",
    },
    formatAngles: {
      Carousel:
        "Slide deck: founding pro benefits — background check covered, FitHub, Promote Tokens, verified discovery",
      Static:
        "Graphic spotlight: independent pro archetype listing on Match Fit — get discovered beyond your own feed",
      Video:
        "Cinematic meet-a-founding-Fitness-Pro / day-in-the-life on Match Fit — recruitment via spotlight",
      Text: "Short punchy founding slots hook — limited beta cohort, apply at match-fit.net/trainer/signup",
    },
    clientAngleRule:
      "If any post targets Clients, it must be dual-purpose spotlight only (meet/discover Fitness Pros on Match Fit) — never pure client acquisition.",
  },
  {
    dayIndex: 1,
    name: "Client education",
    headline: "Client tip — how to pick the right Fitness Pro",
    themeBrief:
      "Help athletes choose the right Fitness Pro — questions to ask, goals, in-person vs virtual, red flags. All posts stay on client education, not FP recruitment.",
    audienceByPostType: {
      Carousel: "Clients",
      Static: "Clients",
      Video: "Clients",
      Text: "Clients",
    },
    formatAngles: {
      Carousel: "Swipeable checklist: 3–5 questions before you hire a Fitness Pro",
      Static: "One bold client insight or myth-bust about finding quality coaching",
      Video: "Quick Reel: how swipe discovery helps you match by goal, not just aesthetics",
      Text: "Conversational thread: what clients wish they knew before picking a coach",
    },
  },
  {
    dayIndex: 2,
    name: "FitHub feature",
    headline: "FitHub — in-app content and discovery",
    themeBrief:
      "FitHub as distribution for Fitness Pros — content inside the app, Promote Tokens, clients browsing before they book. Feature awareness, not generic beta filler.",
    audienceByPostType: {
      Carousel: "Join the Team",
      Static: "List With Us",
      Video: "Join the Team",
      Text: "Join the Team",
    },
    formatAngles: {
      Carousel: "How FitHub gets pro content in front of clients already searching",
      Static: "Listing poster angle: amplify your brand where athletes discover training",
      Video: "Screen-style or UGC walkthrough of FitHub feed + Promote Tokens",
      Text: "Opinion hook: why posting only on IG leaves clients on the table",
    },
  },
  {
    dayIndex: 3,
    name: "Founding platform update",
    headline: "Build update — founding slots and platform proof",
    themeBrief:
      "Founding beta urgency — slots remaining, background check covered, tier value, platform tour. Trust and recruitment for Fitness Pros and listing posters.",
    audienceByPostType: {
      Carousel: "Join the Team",
      Static: "List With Us",
      Video: "Join the Team",
      Text: "Join the Team",
    },
    formatAngles: {
      Carousel:
        "Tier comparison or founding benefits stack — concrete numbers from live promos when available",
      Static:
        "Independent Pro listing path — fast discovery without rebuilding your business online",
      Video: "Platform tour beat: signup → profile → discovery flow for Fitness Pros",
      Text: "Direct founding CTA — limited slots, BC covered, next step at match-fit.net",
    },
  },
  {
    dayIndex: 4,
    name: "Weekend client CTA",
    headline: "Find your Fitness Pro this weekend",
    themeBrief:
      "Weekend booking energy for clients — browse, match, book. Outcome-focused CTAs to match-fit.net/client/sign-up. Not FP recruitment.",
    audienceByPostType: {
      Carousel: "Clients",
      Static: "Clients",
      Video: "Clients",
      Text: "Clients",
    },
    formatAngles: {
      Carousel: "Weekend goal match — strength, weight loss, sport — find a pro who fits",
      Static: "Motivational weekend CTA with clear browse/book path",
      Video: "Emotional Reel: stop scrolling random profiles — swipe to match",
      Text: "Short weekend hook + match-fit.net/client/sign-up",
    },
  },
];

/** Back-compat alias — some callers may still import the old name directly. */
export const WEEKDAY_THEMES = MATCH_FIT_WEEKDAY_THEMES;

/**
 * Generic, brand-agnostic weekly skeleton for every brand that isn't match-fit. No product
 * name, feature, or promo lives here on purpose — that's CONTENT_MACHINE_BRAND_FACTS's job.
 * This only shapes what KIND of post today is (a feature intro vs. a tip vs. a CTA) and who
 * it's roughly aimed at, using target-group labels that make sense for any product, not one
 * specific marketplace's own vocabulary.
 */
export const DEFAULT_WEEKDAY_THEMES: WeekdayTheme[] = [
  {
    dayIndex: 0,
    name: "Feature spotlight",
    headline: "What this actually does",
    themeBrief:
      "Introduce one core capability of the product and why it matters. Ground every claim in this brand's own product facts — never another Northside product's name, feature, or promo.",
    audienceByPostType: {
      Carousel: "New Users",
      Static: "New Users",
      Video: "New Users",
      Text: "New Users",
    },
    formatAngles: {
      Carousel: "Swipeable step-by-step walkthrough of the core workflow",
      Static: "One bold before/after or problem/solution graphic",
      Video: "Quick screen-style or narrated walkthrough of the core feature in action",
      Text: "Direct explainer: what it does, who it's for, why it's different",
    },
  },
  {
    dayIndex: 1,
    name: "User education",
    headline: "Get more out of it",
    themeBrief:
      "A practical tip or technique for someone already using the product. Ground every claim in this brand's own product facts.",
    audienceByPostType: {
      Carousel: "Existing Users",
      Static: "Existing Users",
      Video: "Existing Users",
      Text: "Existing Users",
    },
    formatAngles: {
      Carousel: "Swipeable checklist: how to get the most out of it",
      Static: "One practical tip or a common mistake to avoid",
      Video: "Quick tutorial-style Reel on one specific technique",
      Text: "Conversational thread: a question users actually ask, answered",
    },
  },
  {
    dayIndex: 2,
    name: "Use-case story",
    headline: "What this looks like in practice",
    themeBrief:
      "A concrete, realistic use-case or scenario the product solves. Never a fabricated named person or testimonial — describe the scenario, not an invented individual.",
    audienceByPostType: {
      Carousel: "General Audience",
      Static: "General Audience",
      Video: "General Audience",
      Text: "General Audience",
    },
    formatAngles: {
      Carousel: "Scenario walkthrough: the problem, then how it gets solved",
      Static: "One relatable pain point this product removes",
      Video: "Day-in-the-life style Reel showing the product solving a real problem",
      Text: "Opinion hook: a common frustration, and the better way",
    },
  },
  {
    dayIndex: 3,
    name: "Trust and proof",
    headline: "Why this is worth trying",
    themeBrief:
      "Build credibility with what's real about this product right now (from its own facts) — never invented stats or fake numbers. Ground every claim in this brand's own product facts.",
    audienceByPostType: {
      Carousel: "New Users",
      Static: "New Users",
      Video: "New Users",
      Text: "New Users",
    },
    formatAngles: {
      Carousel: "Tour of what's actually live today, feature by feature",
      Static: "One concrete, verifiable fact about the product presented boldly",
      Video: "Platform tour beat: signup → first action → value delivered",
      Text: "Direct CTA grounded in a real, specific reason to try it now",
    },
  },
  {
    dayIndex: 4,
    name: "Weekend CTA",
    headline: "Try it this weekend",
    themeBrief:
      "A direct, outcome-focused call to action to sign up or try the product. Ground every claim in this brand's own product facts.",
    audienceByPostType: {
      Carousel: "General Audience",
      Static: "General Audience",
      Video: "General Audience",
      Text: "General Audience",
    },
    formatAngles: {
      Carousel: "Goal-match angle: pick your use-case, see how it fits",
      Static: "Motivational CTA with a clear next step",
      Video: "Emotional Reel: stop doing it the hard way, try this instead",
      Text: "Short, direct hook plus a clear call to action",
    },
  },
];

const BRAND_WEEKDAY_THEMES: Record<string, WeekdayTheme[]> = {
  [DEFAULT_BRAND_SLUG]: MATCH_FIT_WEEKDAY_THEMES,
};

function getThemesForBrand(brandSlug?: string): WeekdayTheme[] {
  if (brandSlug && BRAND_WEEKDAY_THEMES[brandSlug]) return BRAND_WEEKDAY_THEMES[brandSlug];
  return DEFAULT_WEEKDAY_THEMES;
}

export function getWeekdayTheme(dayIndex: number, brandSlug?: string): WeekdayTheme {
  const themes = getThemesForBrand(brandSlug);
  const normalized = ((dayIndex % themes.length) + themes.length) % themes.length;
  return themes[normalized] ?? themes[0];
}

export function getThemeAudienceForPost(
  dayIndex: number,
  postType: ContentPostType,
  brandSlug?: string
): ContentTargetGroup {
  return getWeekdayTheme(dayIndex, brandSlug).audienceByPostType[postType];
}

export function getDefaultThemeDayIndex(from = new Date()): number {
  const day = from.getDay();
  if (day === 0 || day === 6) return 0;
  return day - 1;
}

export function buildSlotBrief(args: {
  dayIndex: number;
  postType: ContentPostType;
  targetGroup: ContentTargetGroup;
  brandSlug?: string;
}): string {
  const theme = getWeekdayTheme(args.dayIndex, args.brandSlug);
  const dayLabel = CONTENT_DAYS_LONG[theme.dayIndex];
  return [
    `Day: ${dayLabel} — ${theme.headline}`,
    `Theme: ${theme.themeBrief}`,
    `Format: ${args.postType} → ${args.targetGroup}`,
    `Angle: ${theme.formatAngles[args.postType]}`,
    theme.clientAngleRule ? `Rule: ${theme.clientAngleRule}` : null,
  ]
    .filter(Boolean)
    .join("\n");
}
