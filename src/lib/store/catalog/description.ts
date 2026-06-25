/** Strip HTML, JSON artifacts, and code-like content from CJ product descriptions. */
export function sanitizeCjDescription(raw: string | null | undefined): string {
  if (!raw?.trim()) return "";

  let text = raw.trim();

  // Remove HTML tags
  text = text.replace(/<[^>]+>/g, " ");

  // Decode common HTML entities
  text = text
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'");

  // Remove JSON-like blocks
  text = text.replace(/\{[\s\S]*?\}/g, " ");
  text = text.replace(/\[[\s\S]*?\]/g, " ");

  // Remove code-like patterns
  text = text.replace(/```[\s\S]*?```/g, " ");
  text = text.replace(/`[^`]+`/g, " ");
  text = text.replace(/\b(function|const|let|var|import|export|class)\b/gi, " ");

  // Collapse whitespace
  text = text.replace(/\s+/g, " ").trim();

  // Remove lines that look like technical metadata
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

  // Cap length for display
  if (result.length > 600) {
    const truncated = result.slice(0, 597);
    const lastSpace = truncated.lastIndexOf(" ");
    return (lastSpace > 400 ? truncated.slice(0, lastSpace) : truncated) + "…";
  }

  return result;
}

/** Build a variant-specific description paragraph from product + variant name. */
export function buildVariantDescription(
  productDescription: string,
  variantName: string,
  productName: string
): string {
  const base = productDescription.trim() || productName.trim();
  const variant = variantName.trim();

  if (!variant || variant.toLowerCase() === "default") {
    return base;
  }

  return `${base}\n\nThis variation: ${variant}.`;
}
