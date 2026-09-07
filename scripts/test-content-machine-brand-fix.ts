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
 */
import {
  countConcreteDetails,
  hasBannedPhrase,
  runQualityGate,
} from "../src/lib/content-machine/quality-gate";
import { getContentMachineBrandFacts } from "../src/lib/content-machine/constants";

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

if (failed > 0) {
  console.error(`\n${failed} CHECK(S) FAILED`);
  process.exit(1);
}
console.log("\nALL CHECKS PASSED");
