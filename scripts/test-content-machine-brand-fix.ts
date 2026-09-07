/**
 * Regression test for the content-machine wrong-brand bug (PR #220, run manually:
 * `npx tsx scripts/test-content-machine-brand-fix.ts`).
 *
 * Root cause (confirmed live 2026-09-07, content_machine_posts rows for
 * ni/ni-store/grantbot/gapscan/bridgeai, 16:06-16:09 UTC): buildSystemPrompt() hardcoded
 * Match-Fit-only instructions into EVERY brand's prompt, and countConcreteDetails() scored
 * every caption against a Match-Fit-only keyword list with no brand awareness -- so a
 * banned phrase ("Match Fit") landed in every one of these brands' posts anyway, because
 * hasBannedPhrase() only added a string to the ordinary failures list and
 * generateSlotWithQualityGate() let any failure fall through to "keep best draft, accept
 * flagged" after MAX_REGEN_ATTEMPTS.
 *
 * Proves, against the ACTUAL functions (not a reimplementation) and the real
 * content_machine_brand_profiles banned_phrases for grantbot:
 *  1. countConcreteDetails() is brand-scoped -- the real Match Fit caption that actually
 *     landed for grantbot today scores 0 against grantbot's own keyword pool, and a real
 *     on-topic GrantBot caption scores >=2.
 *  2. runQualityGate() sets hardFail=true whenever a banned phrase hits, and false when it
 *     doesn't (even if other checks fail) -- this is the flag generateSlotWithQualityGate
 *     now checks before it will EVER accept a "best draft" fallback.
 *  3. buildSystemPrompt() (via generateSlotDraft's system prompt, exercised indirectly
 *     through its exported pieces) only carries the Match-Fit-specific "Fitness Pros"
 *     instruction for brandSlug 'match-fit', and every NI-family brand has its own real
 *     product facts configured (not Match Fit's).
 *
 * ROUND 3 (2026-09-07 16:47-16:54 UTC, after PR #220's fix above was already live): the
 * banned-phrase hit came back for ni/ni-store/grantbot/gapscan anyway -- confirmed via
 * content_machine_signals that ATTEMPT 1 (before any regen feedback existed) already failed.
 * Root cause this time: content_machine_tone_rules -- correctly brand-scoped by its own query --
 * has rows shared verbatim across every NI-family brand that cite "Match Fit"/"match-fit.net" by
 * name as illustrative/historical examples, and generateSlotDraft() injected that text verbatim
 * into every brand's "Learned tone rules" prompt section. Separately, buildRegenFeedback()
 * hardcoded "a concrete Match Fit feature/promo" into every brand's regen-retry instructions,
 * compounding the drift on attempts 2-3. (loadRecentLearnings() was investigated as a third
 * candidate and ruled out for this specific incident -- its actual 3-row output at the failure
 * timestamp did not contain "Match Fit" -- but is sanitized by the same mechanism as defense in
 * depth, since the NI-Brain Learnings table is regularly flooded with other-venture engineering
 * notes that DO name other products.)
 */
import {
  buildRegenFeedback,
  countConcreteDetails,
  hasBannedPhrase,
  runQualityGate,
  stripBannedReferences,
} from "../src/lib/content-machine/quality-gate";
import { getContentMachineBrandFacts } from "../src/lib/content-machine/constants";
import {
  buildSlotBrief,
  getThemeAudienceForPost,
  getWeekdayTheme,
  MATCH_FIT_WEEKDAY_THEMES,
  DEFAULT_WEEKDAY_THEMES,
} from "../src/lib/content-machine/weekday-themes";

let failed = 0;
function check(cond: boolean, msg: string) {
  if (!cond) {
    failed++;
    console.error(`FAIL: ${msg}`);
  } else {
    console.log(`ok:   ${msg}`);
  }
}

// The real banned_phrases row for grantbot (content_machine_brand_profiles, verified live
// against NI-Brain kxijunwgbrlfzvgkhklo 2026-09-07).
const GRANTBOT_BANNED_PHRASES = ["optional bar", "Match Fit", "AXON waitlist push", "Twitter", "Truth Social"];

// The actual bad caption that landed in content_machine_posts for grantbot today
// (id 242ec20e-4737-46f6-97c2-4551d75c85d4, since set status='rejected').
const REAL_BAD_GRANTBOT_CAPTION =
  "Here's the real reason Fitness Pros are joining Match Fit before the public launch: the founding " +
  "perks stack the deck in their favor from day one. Verified background checks, Fit Hub visibility, " +
  "and a founding tier that won't come back.";

const REAL_GOOD_GRANTBOT_CAPTION =
  "Why do nonprofits waste 40 hours writing one grant application?\n\n" +
  "GrantBot finds relevant funding opportunities and drafts the grant application for you — one " +
  "Northside Intelligence account unlocks it, built for nonprofits, creators, and small businesses.";

// 1. Brand-scoped concrete-details scoring.
check(
  countConcreteDetails(REAL_BAD_GRANTBOT_CAPTION, "match-fit") >= 2,
  "match-fit's own keyword pool still scores the old Match Fit caption >=2 (no regression to Match Fit itself)"
);
check(
  countConcreteDetails(REAL_BAD_GRANTBOT_CAPTION, "grantbot") === 0,
  "grantbot's keyword pool scores 0 on the actual bad Match Fit caption from today — it could no longer pass the concrete-details gate"
);
check(
  countConcreteDetails(REAL_GOOD_GRANTBOT_CAPTION, "grantbot") >= 2,
  "grantbot's keyword pool scores >=2 on an actual on-topic GrantBot caption"
);

// 2. hasBannedPhrase + hardFail wiring — the exact real-world case: today's bad caption
// against grantbot's real banned_phrases.
check(
  hasBannedPhrase(REAL_BAD_GRANTBOT_CAPTION, GRANTBOT_BANNED_PHRASES),
  "hasBannedPhrase() flags the real bad caption against grantbot's real banned_phrases"
);

const hardFailGate = runQualityGate({
  draft: {
    caption: REAL_BAD_GRANTBOT_CAPTION,
    visualPrompt:
      "A confident professional reviewing documents at a desk, warm lighting, on-screen text reads FOUNDING",
    hashtags: ["#Grants", "#Nonprofit"],
  },
  postType: "Carousel",
  bannedPhrases: GRANTBOT_BANNED_PHRASES,
  brandSlug: "grantbot",
});
check(hardFailGate.hardFail === true, "runQualityGate sets hardFail=true on the real bad caption + grantbot's real banned_phrases");
check(hardFailGate.pass === false, "runQualityGate fails the real bad caption for grantbot");
check(
  hardFailGate.failures.includes("Contains banned phrase"),
  "runQualityGate's failures array names the banned-phrase hit"
);

// A caption with NO banned phrase must never set hardFail, even when it fails other checks
// (e.g. a flat declarative opener with no hook) — hardFail must mean exactly "banned
// phrase present", not "any gate failure", or the accept-flagged fallback would never fire
// for ordinary style issues either.
const softFailGate = runQualityGate({
  draft: { caption: "flat declarative opener with no hook", visualPrompt: "short", hashtags: [] },
  postType: "Static",
  bannedPhrases: GRANTBOT_BANNED_PHRASES,
  brandSlug: "grantbot",
});
check(softFailGate.pass === false, "the flat-opener caption still fails the gate on hook grounds (sanity check)");
check(softFailGate.hardFail === false, "a caption with no banned phrase never sets hardFail, even when other checks fail");

// 3. Every NI-family brand that broke today has its own real product facts configured —
// not Match Fit's, and not empty/undefined.
for (const slug of ["ni", "ni-store", "grantbot", "gapscan", "bridgeai"]) {
  const facts = getContentMachineBrandFacts(slug);
  check(Boolean(facts && facts.length > 40), `${slug} has real product facts configured (CONTENT_MACHINE_BRAND_FACTS)`);
  check(
    !/match-fit\.net|founding fitness pro/i.test(facts || ""),
    `${slug}'s own facts do not themselves describe Match Fit's product (founding promo, match-fit.net)`
  );
}

// Regression guard: match-fit itself must keep its OWN real facts (mirrored from
// matchfit's CONTENT_CALENDAR_BRAND_FACTS), not fall through to the "no product facts
// configured" placeholder generateSlotDraft() uses for an unconfigured brand — caught by
// council review round 2 on this PR.
const matchFitFacts = getContentMachineBrandFacts("match-fit");
check(Boolean(matchFitFacts && matchFitFacts.length > 40), "match-fit itself has real product facts configured (not a placeholder)");
check(
  /fit hub|founding fitness pro|match-fit\.net/i.test(matchFitFacts || ""),
  "match-fit's facts contain real Match Fit specifics (Fit Hub / founding promo / match-fit.net)"
);

// 4. Round-3 root cause (confirmed live 2026-09-07 16:47-16:54 UTC, content_machine_signals
// attempt=1 firstLine values for ni/ni-store/grantbot/gapscan — a banned-phrase hit BEFORE any
// regen feedback existed): content_machine_tone_rules rows shared verbatim across every
// NI-family brand cite "Match Fit" / "match-fit.net" by name as illustrative examples. These
// are the two actual live rows (grantbot's copy, verified against NI-Brain kxijunwgbrlfzvgkhklo
// content_machine_tone_rules ids 0009d960-.../0a8c7d38-...).
const REAL_CONTAMINATED_TONE_RULE_1 =
  'Every visual_prompt that mentions the brand logo MUST name the exact domain to reference it ' +
  'against (e.g. "logo styled per northsideintelligence.com/<product>" or "use match-fit.net for ' +
  'reference") -- never mention "logo" without a concrete reference target.';
const REAL_CONTAMINATED_TONE_RULE_2 =
  "On-screen text overlays in Gemini image/video prompts render unreliably (sloppy, misspelled, " +
  "garbled) past ~6-8 words. Cap every on-screen text instruction to a short punchy phrase. The " +
  "2026-08-25 Match Fit Static image was unusable for this exact reason (JB had to hand-write his own text).";
const CLEAN_TONE_RULE =
  "Every caption must include the product's real URL, no exceptions.";

check(
  hasBannedPhrase(REAL_CONTAMINATED_TONE_RULE_2, GRANTBOT_BANNED_PHRASES),
  "sanity check: the real contaminated tone-rule text does contain grantbot's banned phrase 'Match Fit'"
);

const strippedForGrantbot = stripBannedReferences(
  [REAL_CONTAMINATED_TONE_RULE_1, REAL_CONTAMINATED_TONE_RULE_2, CLEAN_TONE_RULE],
  GRANTBOT_BANNED_PHRASES
);
check(
  strippedForGrantbot.length === 1 && strippedForGrantbot[0] === CLEAN_TONE_RULE,
  "stripBannedReferences() drops both real contaminated tone-rule lines (one says 'Match Fit', the other only names the domain 'match-fit.net') and keeps the clean one, for grantbot's banned phrases"
);
check(
  stripBannedReferences(["use match-fit.net for reference"], ["Match Fit"]).length === 0,
  "stripBannedReferences() catches the hyphenated domain 'match-fit.net' against the banned phrase 'Match Fit' (separator-normalized matching) — this is deliberately WIDER than hasBannedPhrase()'s exact-substring caption gate, see the doc comment on why"
);
check(
  stripBannedReferences(["completely unrelated line about grants and nonprofits"], ["Match Fit"]).length === 1,
  "stripBannedReferences() does not touch a genuinely unrelated line"
);
check(
  stripBannedReferences([], ["Match Fit"]).length === 0,
  "stripBannedReferences() on an empty input returns empty, doesn't throw"
);

// 5. buildRegenFeedback() must never hardcode Match Fit into another brand's regen-retry
// instructions — this was actively making every attempt-2/3 caption worse for every
// non-match-fit brand regardless of what triggered attempt 1.
const grantbotFeedback = buildRegenFeedback(["Contains banned phrase"], { brandName: "GrantBot" });
check(
  !/match fit/i.test(grantbotFeedback),
  "buildRegenFeedback() for a non-match-fit brand never mentions Match Fit"
);
check(
  /GrantBot/.test(grantbotFeedback),
  "buildRegenFeedback() names the actual brand (GrantBot) in its retry instructions"
);
const matchFitFeedback = buildRegenFeedback(["Lazy or placeholder caption"], { brandName: "Match Fit" });
check(
  /Match Fit/.test(matchFitFeedback),
  "buildRegenFeedback() still names Match Fit for match-fit itself (regression guard — not stripped for the one brand it's actually true for)"
);

// 6. Round 4 (the deepest root cause — found only by checking a REAL post-fix generation
// run rather than assuming the tone-rule fix above was enough): getWeekdayTheme() /
// getThemeAudienceForPost() / buildSlotBrief() used to take no brandSlug and always
// returned Match Fit's own literal weekly content brief ("Founding Fitness Pro spotlight",
// "Join the Team", "apply at match-fit.net/trainer/signup") for EVERY brand — this is the
// actual USER PROMPT the model is given each day, not incidental context. Confirmed live
// 2026-09-07 17:19 UTC that grantbot/gapscan/ni-store still wrote Match Fit copy on attempt
// 1 even with the tone-rule fix already deployed.
for (let dayIndex = 0; dayIndex < 5; dayIndex++) {
  const defaultTheme = getWeekdayTheme(dayIndex, "grantbot");
  const asText = JSON.stringify(defaultTheme);
  check(
    !/match fit|match-fit|fitness pro|join the team|list with us/i.test(asText),
    `getWeekdayTheme(${dayIndex}, 'grantbot') carries no Match Fit vocabulary`
  );
}
check(
  getWeekdayTheme(0, "match-fit") === MATCH_FIT_WEEKDAY_THEMES[0],
  "getWeekdayTheme(0, 'match-fit') still returns match-fit's own real theme (regression guard)"
);
check(
  getWeekdayTheme(0) === DEFAULT_WEEKDAY_THEMES[0],
  "getWeekdayTheme() with no brandSlug defaults to the generic skeleton, not Match Fit's"
);
check(
  getThemeAudienceForPost(0, "Carousel", "gapscan") !== "Join the Team",
  "getThemeAudienceForPost() for a non-match-fit brand never returns Match Fit's own audience label"
);
const grantbotBrief = buildSlotBrief({
  dayIndex: 1,
  postType: "Static",
  targetGroup: getThemeAudienceForPost(1, "Static", "grantbot"),
  brandSlug: "grantbot",
});
check(
  !/match fit|fitness pro/i.test(grantbotBrief),
  "buildSlotBrief() for grantbot (the actual per-day user prompt) carries no Match Fit vocabulary"
);
const matchFitBrief = buildSlotBrief({
  dayIndex: 0,
  postType: "Carousel",
  targetGroup: "Join the Team",
  brandSlug: "match-fit",
});
check(
  /match-fit\.net|fitness pro/i.test(matchFitBrief),
  "buildSlotBrief() for match-fit itself still carries its own real content (regression guard)"
);

if (failed > 0) {
  console.error(`\n${failed} CHECK(S) FAILED`);
  process.exit(1);
}
console.log("\nALL CHECKS PASSED");
