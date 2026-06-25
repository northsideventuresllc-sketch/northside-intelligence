/**
 * Lightweight stress checks for new store + sector3 features.
 * Run: npx tsx scripts/stress-test-features.ts
 */

import { buildEnrichedInputs, parseSector3ClarifyingQuestions, promptLikelyNeedsClarification } from "../src/lib/sector3-tools/clarification";
import { sanitizeCjDescription, buildVariantDescription } from "../src/lib/store/catalog/description";

let passed = 0;
let failed = 0;

function assert(name: string, condition: boolean) {
  if (condition) {
    passed++;
    console.log(`✓ ${name}`);
  } else {
    failed++;
    console.error(`✗ ${name}`);
  }
}

// 1. CJ description sanitization
const dirty = '<p>Wireless earbuds with <b>ANC</b></p> {"sku":"12345"} `code`';
const clean = sanitizeCjDescription(dirty);
assert("strips HTML from CJ descriptions", !clean.includes("<") && !clean.includes(">"));
assert("strips JSON blocks", !clean.includes("{"));
assert("strips code backticks", !clean.includes("`"));
assert("keeps readable text", clean.toLowerCase().includes("wireless earbuds"));

// 2. Variant description
const variantDesc = buildVariantDescription("Great earbuds for travel.", "Black", "Earbuds");
assert("variant description has two paragraphs", variantDesc.includes("This variation: Black"));

// 3. Clarification parsing
const questionsJson = JSON.stringify({
  questions: [
    {
      id: "goal",
      question: "What outcome?",
      allowMultiple: true,
      options: [
        { id: "a", label: "Summary" },
        { id: "b", label: "Action plan" },
        { id: "c", label: "Report" },
      ],
    },
  ],
});
const parsed = parseSector3ClarifyingQuestions(questionsJson);
assert("parses clarifying questions", parsed.length === 1 && parsed[0].options.length === 3);

// 4. Prompt assessment heuristic
assert(
  "flags vague prompts",
  promptLikelyNeedsClarification(
    [{ id: "context", label: "Context" }],
    { context: "help me" }
  )
);
assert(
  "passes detailed prompts",
  !promptLikelyNeedsClarification(
    [{ id: "context", label: "Context" }],
    {
      context:
        "We need a competitive analysis of our SaaS onboarding funnel with specific metrics from Q1 2026.",
    }
  )
);

// 5. Enriched inputs
const enriched = buildEnrichedInputs(
  { rawSignals: "Some signals" },
  parsed,
  { goal: ["Summary", "Custom typed answer"] }
);
assert("merges clarifications into inputs", enriched._clarifications?.includes("Custom typed answer"));

// 6. Seeded shuffle variance
function seededShuffle<T>(items: T[], seed: string): T[] {
  const copy = [...items];
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  for (let i = copy.length - 1; i > 0; i--) {
    hash = (hash * 1664525 + 1013904223) >>> 0;
    const j = hash % (i + 1);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

const pool = Array.from({ length: 20 }, (_, i) => i);
const order1 = seededShuffle(pool, "seed-a").join(",");
const order2 = seededShuffle(pool, "seed-b").join(",");
const order3 = seededShuffle(pool, "seed-a").join(",");
assert("seeded shuffle is deterministic", order1 === order3);
assert("different seeds produce different orders", order1 !== order2);

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
