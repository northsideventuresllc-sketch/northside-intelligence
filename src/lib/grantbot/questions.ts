export interface ClarifyingQuestion {
  id: string;
  question: string;
  placeholder?: string;
}

interface RawQuestion {
  id?: unknown;
  question?: unknown;
  placeholder?: unknown;
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value.trim() : fallback;
}

export function parseClarifyingQuestions(raw: unknown): ClarifyingQuestion[] {
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
    .map((entry, index): ClarifyingQuestion | null => {
      const rawEntry = entry as RawQuestion;
      const question = asString(rawEntry.question);
      if (!question) return null;
      const id = asString(rawEntry.id, `q${index + 1}`);
      const placeholder = asString(rawEntry.placeholder);
      return {
        id,
        question,
        ...(placeholder ? { placeholder } : {}),
      };
    })
    .filter((entry): entry is ClarifyingQuestion => entry !== null)
    .slice(0, 6);
}

export function serializeClarifyingQuestions(questions: ClarifyingQuestion[]): string {
  return JSON.stringify({ questions });
}

export function buildEnrichedOrgProfile(
  orgDescription: string,
  questions: ClarifyingQuestion[],
  answers: Record<string, string>
): string {
  const answered = questions
    .map((q) => {
      const answer = answers[q.id]?.trim();
      if (!answer) return null;
      return `Q: ${q.question}\nA: ${answer}`;
    })
    .filter(Boolean);

  if (answered.length === 0) return orgDescription;

  return `${orgDescription.trim()}\n\n--- Additional details ---\n${answered.join("\n\n")}`;
}

export function parseStoredClarifyingAnswers(
  promptQuestions: string | undefined
): Record<string, string> {
  if (!promptQuestions) return {};
  try {
    const parsed = JSON.parse(promptQuestions) as { answers?: Record<string, string> };
    return parsed.answers ?? {};
  } catch {
    return {};
  }
}

export function serializeClarifyingAnswers(answers: Record<string, string>): string {
  return JSON.stringify({ answers });
}
