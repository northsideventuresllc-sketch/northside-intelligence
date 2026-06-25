export interface ClarifyingOption {
  id: string;
  label: string;
}

export interface Sector3ClarifyingQuestion {
  id: string;
  question: string;
  options: ClarifyingOption[];
  allowMultiple: boolean;
  placeholder?: string;
}

interface RawOption {
  id?: unknown;
  label?: unknown;
}

interface RawQuestion {
  id?: unknown;
  question?: unknown;
  options?: unknown;
  allowMultiple?: unknown;
  placeholder?: unknown;
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value.trim() : fallback;
}

export function parseSector3ClarifyingQuestions(raw: unknown): Sector3ClarifyingQuestion[] {
  let payload = raw;

  if (typeof raw === "string") {
    try {
      payload = JSON.parse(raw);
    } catch {
      const match = raw.match(/\{[\s\S]*"questions"[\s\S]*\}/);
      if (!match) return [];
      try {
        payload = JSON.parse(match[0]);
      } catch {
        return [];
      }
    }
  }

  if (!payload || typeof payload !== "object" || !("questions" in payload)) {
    return [];
  }

  const questions = (payload as { questions: unknown }).questions;
  if (!Array.isArray(questions)) return [];

  return questions
    .map((entry, index): Sector3ClarifyingQuestion | null => {
      const rawEntry = entry as RawQuestion;
      const question = asString(rawEntry.question);
      if (!question) return null;

      const id = asString(rawEntry.id, `q${index + 1}`);
      const optionsRaw = Array.isArray(rawEntry.options) ? rawEntry.options : [];
      const options = optionsRaw
        .map((opt, optIndex): ClarifyingOption | null => {
          if (typeof opt === "string") {
            const label = opt.trim();
            if (!label) return null;
            return { id: `${id}_opt${optIndex + 1}`, label };
          }
          const rawOpt = opt as RawOption;
          const label = asString(rawOpt.label);
          if (!label) return null;
          return { id: asString(rawOpt.id, `${id}_opt${optIndex + 1}`), label };
        })
        .filter((opt): opt is ClarifyingOption => opt !== null)
        .slice(0, 6);

      if (options.length < 2) return null;

      return {
        id,
        question,
        options,
        allowMultiple: rawEntry.allowMultiple !== false,
        ...(asString(rawEntry.placeholder) ? { placeholder: asString(rawEntry.placeholder) } : {}),
      };
    })
    .filter((entry): entry is Sector3ClarifyingQuestion => entry !== null)
    .slice(0, 5);
}

export function buildEnrichedInputs(
  baseInputs: Record<string, string>,
  questions: Sector3ClarifyingQuestion[],
  answers: Record<string, string[]>
): Record<string, string> {
  const enriched = { ...baseInputs };

  const clarificationBlock = questions
    .map((q) => {
      const selected = answers[q.id]?.filter(Boolean) ?? [];
      if (!selected.length) return null;
      return `Q: ${q.question}\nA: ${selected.join("; ")}`;
    })
    .filter(Boolean);

  if (clarificationBlock.length > 0) {
    const existing = enriched._clarifications?.trim() ?? "";
    enriched._clarifications = existing
      ? `${existing}\n\n${clarificationBlock.join("\n\n")}`
      : clarificationBlock.join("\n\n");
  }

  return enriched;
}

export function serializeClarifyingAnswers(answers: Record<string, string[]>): string {
  return JSON.stringify({ answers });
}

export function parseStoredClarifyingAnswers(raw: string | undefined): Record<string, string[]> {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as { answers?: Record<string, string | string[]> };
    if (!parsed.answers) return {};
    const result: Record<string, string[]> = {};
    for (const [key, value] of Object.entries(parsed.answers)) {
      if (Array.isArray(value)) {
        result[key] = value.filter((v) => typeof v === "string" && v.trim());
      } else if (typeof value === "string" && value.trim()) {
        result[key] = [value.trim()];
      }
    }
    return result;
  } catch {
    return {};
  }
}

/** Heuristic: short or generic prompts likely need clarification. */
export function promptLikelyNeedsClarification(
  fields: Array<{ id: string; label: string; required?: boolean }>,
  values: Record<string, string>
): boolean {
  const textFields = fields.filter((f) => f.id !== "focusArea" && f.id !== "category");
  const combined = textFields
    .map((f) => values[f.id]?.trim() ?? "")
    .filter(Boolean)
    .join(" ");

  if (combined.length < 40) return true;

  const genericPatterns = [
    /^help me$/i,
    /^make something$/i,
    /^generate$/i,
    /^i need help/i,
    /^create (a |an )?(report|plan|brief|analysis)$/i,
    /^write something/i,
    /^.{0,30}$/,
  ];

  return genericPatterns.some((p) => p.test(combined));
}
