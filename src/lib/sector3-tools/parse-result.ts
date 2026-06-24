export interface ParsedSection {
  title: string;
  body: string;
  items: ParsedItem[];
}

export interface ParsedItem {
  raw: string;
  text: string;
  rank?: number;
  urgency?: "high" | "medium" | "low";
  severity?: "critical" | "moderate" | "minor";
}

export function parseMarkdownSections(text: string): ParsedSection[] {
  const chunks = text.split(/^##\s+/m).filter(Boolean);
  if (chunks.length === 0) {
    return [{ title: "Summary", body: text.trim(), items: parseListItems(text) }];
  }

  return chunks.map((chunk) => {
    const newline = chunk.indexOf("\n");
    const title = newline === -1 ? chunk.trim() : chunk.slice(0, newline).trim();
    const body = newline === -1 ? "" : chunk.slice(newline + 1).trim();
    return {
      title: title.replace(/\s*\([^)]*\)\s*$/, "").trim(),
      body,
      items: parseListItems(body),
    };
  });
}

export function parseListItems(content: string): ParsedItem[] {
  const lines = content.split("\n").map((l) => l.trim()).filter(Boolean);
  const items: ParsedItem[] = [];

  for (const line of lines) {
    const listMatch = line.match(/^(?:[-*•]|\d+[\.)])\s+(.+)$/);
    if (!listMatch) continue;

    const raw = listMatch[1].trim();
    items.push({
      raw,
      text: stripInlineMarkdown(raw),
      rank: extractRank(raw),
      urgency: extractUrgency(raw),
      severity: extractSeverity(raw),
    });
  }

  if (items.length === 0 && content.trim()) {
    const paragraphs = content
      .split(/\n{2,}/)
      .map((p) => p.trim())
      .filter(Boolean);
    return paragraphs.map((p) => ({
      raw: p,
      text: stripInlineMarkdown(p),
      urgency: extractUrgency(p),
      severity: extractSeverity(p),
    }));
  }

  return items;
}

export function stripInlineMarkdown(text: string): string {
  return text
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/^#+\s+/gm, "")
    .trim();
}

export function extractRank(text: string): number | undefined {
  const match = text.match(/^(?:#)?(\d+)[\.)]\s*/i) ?? text.match(/\brank(?:ed)?\s*#?(\d+)/i);
  if (!match) return undefined;
  const n = Number(match[1]);
  return Number.isFinite(n) ? n : undefined;
}

export function extractUrgency(text: string): ParsedItem["urgency"] {
  const lower = text.toLowerCase();
  if (/\b(high|urgent|critical)\b/.test(lower) && !/\bmoderate\b/.test(lower)) return "high";
  if (/\bmedium\b/.test(lower)) return "medium";
  if (/\blow\b/.test(lower)) return "low";
  return undefined;
}

export function extractSeverity(text: string): ParsedItem["severity"] {
  const lower = text.toLowerCase();
  if (/\bcritical\b/.test(lower)) return "critical";
  if (/\bmoderate\b/.test(lower)) return "moderate";
  if (/\bminor\b/.test(lower)) return "minor";
  return undefined;
}

export function findSection(
  sections: ParsedSection[],
  ...keywords: string[]
): ParsedSection | undefined {
  const lowerKeywords = keywords.map((k) => k.toLowerCase());
  return sections.find((s) => {
    const title = s.title.toLowerCase();
    return lowerKeywords.some((k) => title.includes(k));
  });
}

export function splitParagraphs(text: string): string[] {
  return text
    .split(/\n{2,}/)
    .map((p) => stripInlineMarkdown(p))
    .filter(Boolean);
}
