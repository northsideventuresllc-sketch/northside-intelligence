/** Strip HTML, JSON artifacts, and code-like content from CJ product descriptions. */
export function sanitizeCjDescription(raw: string | null | undefined): string {
  if (!raw?.trim()) return "";

  let text = raw.trim();

  text = text.replace(/<[^>]+>/g, " ");

  text = text
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'");

  text = text.replace(/\{[\s\S]*?\}/g, " ");
  text = text.replace(/\[[\s\S]*?\]/g, " ");
  text = text.replace(/```[\s\S]*?```/g, " ");
  text = text.replace(/`[^`]+`/g, " ");
  text = text.replace(/\b(function|const|let|var|import|export|class)\b/gi, " ");

  text = text.replace(/\s+/g, " ").trim();

  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .filter((s) => {
      const lower = s.toLowerCase();
      if (/^(sku|pid|vid|spu|item no)/i.test(s)) return false;
      if (/^\d{6,}$/.test(s.trim())) return false;
      if (/https?:\/\//i.test(s) && s.length < 80) return false;
      return s.length > 3;
    });

  const result = sentences.join(" ").trim();

  if (result.length > 600) {
    const truncated = result.slice(0, 597);
    const lastSpace = truncated.lastIndexOf(" ");
    return (lastSpace > 400 ? truncated.slice(0, lastSpace) : truncated) + "…";
  }

  return result;
}

function capitalizeSentence(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return "";
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

function ensurePeriod(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return "";
  if (/[.!?…]$/.test(trimmed)) return trimmed;
  return `${trimmed}.`;
}

function isJunkFragment(text: string): boolean {
  const t = text.trim();
  if (t.length < 4) return true;
  if (/^(sku|pid|vid|spu|item no|model|size|color)$/i.test(t)) return true;
  if (/^\d{5,}$/.test(t)) return true;
  return false;
}

function splitIntoFragments(cleaned: string): string[] {
  if (/[.!?]/.test(cleaned)) {
    return cleaned
      .split(/(?<=[.!?])\s+/)
      .map((s) => s.trim())
      .filter((s) => !isJunkFragment(s));
  }

  const delimited = cleaned
    .split(/[,;|•·\n]+/)
    .map((s) => s.trim())
    .filter((s) => !isJunkFragment(s));

  if (delimited.length > 1) return delimited;

  return [cleaned.trim()].filter((s) => !isJunkFragment(s));
}

function polishFragment(fragment: string): string {
  let text = fragment
    .replace(/^[-–—*]+\s*/, "")
    .replace(/:\s*$/, "")
    .replace(/\s+/g, " ")
    .trim();

  if (!text) return "";

  const lower = text.toLowerCase();
  if (/^(made of|material|fabric|size|color|style|package|includes|features?)\b/i.test(text)) {
    if (!/^(it|this|the)\b/i.test(lower)) {
      text = `It ${lower}`;
    }
  }

  return ensurePeriod(capitalizeSentence(text));
}

/** Turn CJ supplier copy into shopper-friendly complete sentences. */
export function formatUserFriendlyDescription(
  raw: string | null | undefined,
  productName?: string
): string {
  const cleaned = sanitizeCjDescription(raw);
  if (!cleaned) {
    if (productName?.trim()) {
      return ensurePeriod(
        `This listing is for ${productName.trim()}, available through Smart Store with verified retail pricing`
      );
    }
    return "";
  }

  const fragments = splitIntoFragments(cleaned);
  const sentences = fragments.map(polishFragment).filter(Boolean);

  if (sentences.length === 0) {
    return ensurePeriod(capitalizeSentence(cleaned));
  }

  if (productName?.trim() && !sentences[0].toLowerCase().includes(productName.toLowerCase().slice(0, 12))) {
    sentences.unshift(
      ensurePeriod(`This product is ${productName.trim()}`)
    );
  }

  return sentences.join(" ");
}

export interface VariantDescriptionParts {
  overview: string;
  variation: string;
}

/** Build variant-specific copy as two friendly paragraphs. */
export function buildVariantDescriptionParts(
  productDescription: string,
  variantName: string,
  productName: string
): VariantDescriptionParts {
  const overview = formatUserFriendlyDescription(productDescription, productName);
  const variant = variantName.trim();

  if (!variant || variant.toLowerCase() === "default") {
    return { overview, variation: "" };
  }

  const variation = ensurePeriod(
    `This option is the ${variant} variation, offering the same product with that specific style or configuration`
  );

  return { overview, variation };
}

/** @deprecated Use buildVariantDescriptionParts */
export function buildVariantDescription(
  productDescription: string,
  variantName: string,
  productName: string
): string {
  const parts = buildVariantDescriptionParts(productDescription, variantName, productName);
  if (!parts.variation) return parts.overview;
  return `${parts.overview}\n\n${parts.variation}`;
}

export function descriptionToParagraphs(text: string): string[] {
  if (!text.trim()) return [];

  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);

  if (sentences.length <= 2) return [sentences.join(" ")];

  const paragraphs: string[] = [];
  for (let i = 0; i < sentences.length; i += 2) {
    paragraphs.push(sentences.slice(i, i + 2).join(" "));
  }
  return paragraphs;
}
