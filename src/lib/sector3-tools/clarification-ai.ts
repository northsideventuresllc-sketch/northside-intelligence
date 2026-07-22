import { generateTextGeminiFirst } from "@/lib/ai/gemini-first";
import type { DashboardField } from "@/components/sector3/Sector3ToolDashboard";
import {
  parseSector3ClarifyingQuestions,
  promptLikelyNeedsClarification,
  type Sector3ClarifyingQuestion,
} from "@/lib/sector3-tools/clarification";

const MODEL = "anthropic/claude-haiku-4.5";

function handleAiError(err: unknown): never {
  const message = err instanceof Error ? err.message : "AI assessment failed";
  if (/unauthorized|401|authentication|api key/i.test(message)) {
    throw new Error(
      "AI service is not configured. Enable AI Gateway on the Vercel project or set ANTHROPIC_API_KEY / AI_GATEWAY_API_KEY."
    );
  }
  throw new Error(message);
}

export interface PromptAssessment {
  needsClarification: boolean;
  reason?: string;
}

export async function assessPromptDetail(
  toolName: string,
  fields: DashboardField[],
  values: Record<string, string>
): Promise<PromptAssessment> {
  if (!promptLikelyNeedsClarification(fields, values)) {
    return { needsClarification: false };
  }

  const fieldSummary = fields
    .map((f) => `${f.label}: ${values[f.id]?.trim() || "(empty)"}`)
    .join("\n");

  const systemPrompt = `You are an intake specialist for ${toolName}. Decide if the user's inputs are detailed enough to generate a high-quality result, or if follow-up questions are needed.

Return ONLY valid JSON — no markdown.

Schema:
{
  "needsClarification": true,
  "reason": "Brief reason if clarification needed"
}

Rules:
- needsClarification=false when inputs include specific goals, context, constraints, or data
- needsClarification=true when inputs are vague, generic, or missing critical details for ${toolName}
- Be practical: if a skilled analyst could produce useful output from the inputs, return false`;

  try {
    const { text } = await generateTextGeminiFirst({
      anthropicModel: MODEL,
      system: systemPrompt,
      prompt: fieldSummary,
      maxOutputTokens: 300,
    });

    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return { needsClarification: true, reason: "More context needed" };

    const parsed = JSON.parse(match[0]) as { needsClarification?: boolean; reason?: string };
    return {
      needsClarification: parsed.needsClarification === true,
      reason: parsed.reason,
    };
  } catch (err) {
    if (err instanceof SyntaxError) {
      return { needsClarification: true, reason: "More context needed" };
    }
    handleAiError(err);
  }
}

export async function generateSector3ClarifyingQuestions(
  toolName: string,
  toolPurpose: string,
  fields: DashboardField[],
  values: Record<string, string>
): Promise<Sector3ClarifyingQuestion[]> {
  const fieldSummary = fields
    .map((f) => `${f.label}: ${values[f.id]?.trim() || "(empty)"}`)
    .join("\n");

  const systemPrompt = `You are an intake specialist for ${toolName}. ${toolPurpose}

The user's inputs are too general. Generate follow-up questions with suggested answer options the user can select (multi-select allowed).

Return ONLY valid JSON — no markdown.

Schema:
{
  "questions": [
    {
      "id": "goal",
      "question": "What is the primary outcome you need?",
      "allowMultiple": true,
      "options": [
        { "id": "opt1", "label": "Executive summary for leadership" },
        { "id": "opt2", "label": "Action plan with next steps" }
      ],
      "placeholder": "Or type your own answer…"
    }
  ]
}

Rules:
- Generate 3-4 questions tailored to the tool and inputs
- Each question needs 3-5 realistic selectable options (not generic placeholders)
- allowMultiple=true so users can pick all that apply
- Options should be specific and helpful, not vague
- Include placeholder for custom typed answers`;

  try {
    const { text } = await generateTextGeminiFirst({
      anthropicModel: MODEL,
      system: systemPrompt,
      prompt: fieldSummary,
      maxOutputTokens: 1800,
    });

    const questions = parseSector3ClarifyingQuestions(text.trim());
    if (questions.length === 0) {
      throw new Error("Could not generate follow-up questions. Please try again.");
    }
    return questions;
  } catch (err) {
    if (err instanceof Error && err.message.startsWith("Could not generate")) {
      throw err;
    }
    handleAiError(err);
  }
}
