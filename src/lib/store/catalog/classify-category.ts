import "server-only";

import { generateText } from "ai";
import {
  STORE_ITEM_CATEGORIES,
  isStoreCategoryId,
  type StoreCategoryId,
} from "@/lib/store/categories";

const CLASSIFIER_MODEL = "anthropic/claude-haiku-4.5";

const KEYWORD_RULES: Array<{ id: StoreCategoryId; pattern: RegExp }> = [
  {
    id: "kitchen",
    pattern: /\b(kitchen|cookware|utensil|blender|air fryer|mug|cup|plate|knife|spatula|food storage)\b/i,
  },
  {
    id: "tech",
    pattern: /\b(phone|tablet|laptop|charger|cable|usb|bluetooth|earbuds|headphone|camera|gadget|electronic)\b/i,
  },
  {
    id: "smart-home",
    pattern: /\b(smart home|alexa|google home|wifi plug|doorbell|security camera|thermostat|smart light)\b/i,
  },
  {
    id: "home",
    pattern: /\b(home|decor|furniture|bedding|pillow|blanket|curtain|rug|lamp|organizer|storage bin|vacuum)\b/i,
  },
  {
    id: "pets",
    pattern: /\b(pet|dog|cat|puppy|kitten|leash|collar|aquarium|pet toy)\b/i,
  },
  {
    id: "health",
    pattern: /\b(health|wellness|massage|posture|sleep|vitamin|supplement|medical|first aid|thermometer)\b/i,
  },
  {
    id: "beauty",
    pattern: /\b(beauty|skincare|makeup|cosmetic|hair|nail|serum|moisturizer|lipstick|fragrance)\b/i,
  },
  {
    id: "fitness",
    pattern: /\b(fitness|workout|gym|yoga|dumbbell|resistance band|exercise|sport|athletic)\b/i,
  },
  {
    id: "auto",
    pattern: /\b(car|auto|vehicle|dash cam|tire|windshield|motorcycle|trunk|seat cover)\b/i,
  },
  {
    id: "entertainment",
    pattern: /\b(game|gaming|toy|puzzle|board game|party|outdoor fun|rc car|drone hobby)\b/i,
  },
];

function keywordClassify(name: string, description?: string): StoreCategoryId {
  const text = `${name} ${description ?? ""}`.trim();
  for (const rule of KEYWORD_RULES) {
    if (rule.pattern.test(text)) return rule.id;
  }
  return "general";
}

async function anthropicClassify(name: string, description?: string): Promise<StoreCategoryId | null> {
  if (!process.env.ANTHROPIC_API_KEY?.trim()) return null;

  const options = STORE_ITEM_CATEGORIES.map((c) => `${c.id} (${c.label})`).join(", ");

  try {
    const { text } = await generateText({
      model: CLASSIFIER_MODEL,
      system: `You assign e-commerce products to exactly one Smart Store category id. Reply with ONLY the id from this list: ${options}. No punctuation or explanation.`,
      prompt: `Product name: ${name}\nDescription: ${description ?? name}`,
      maxOutputTokens: 16,
    });

    const raw = text.trim().toLowerCase().replace(/[^a-z-]/g, "");
    if (isStoreCategoryId(raw)) return raw;
  } catch (err) {
    console.warn("[store/classify-category] anthropic failed:", err);
  }

  return null;
}

/** Keyword-only classification for high-volume catalog sync (no Anthropic calls). */
export function classifyStoreCategoryByKeywords(
  name: string,
  description?: string
): StoreCategoryId {
  return keywordClassify(name, description);
}

/** Assign an internal Smart Store category — never trust supplier taxonomy. */
export async function classifyStoreCategory(input: {
  name: string;
  description?: string;
}): Promise<StoreCategoryId> {
  const keyword = keywordClassify(input.name, input.description);
  if (keyword !== "general") return keyword;

  const fromAi = await anthropicClassify(input.name, input.description);
  return fromAi ?? keyword;
}

/** Normalize legacy/supplier category strings to a valid internal id, re-classifying when needed. */
export async function normalizeStoreCategory(input: {
  name: string;
  description?: string;
  existingCategory?: string | null;
}): Promise<StoreCategoryId> {
  const existing = input.existingCategory?.trim().toLowerCase();
  if (existing && isStoreCategoryId(existing)) return existing;
  return classifyStoreCategory(input);
}
