import { CONTENT_DAYS_LONG } from "./constants";
import type { ContentPostType, ContentTargetGroup, WeekdayTheme } from "./types";

export const WEEKDAY_THEMES: WeekdayTheme[] = [
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

export function getWeekdayTheme(dayIndex: number): WeekdayTheme {
  const normalized = ((dayIndex % 5) + 5) % 5;
  return WEEKDAY_THEMES[normalized] ?? WEEKDAY_THEMES[0];
}

export function getThemeAudienceForPost(
  dayIndex: number,
  postType: ContentPostType
): ContentTargetGroup {
  return getWeekdayTheme(dayIndex).audienceByPostType[postType];
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
}): string {
  const theme = getWeekdayTheme(args.dayIndex);
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
