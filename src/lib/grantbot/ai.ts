import { generateTextGeminiFirst } from "@/lib/ai/gemini-first";
import { parseGrantListings, type GrantListing } from "@/lib/grantbot/listings";
import { parseClarifyingQuestions, type ClarifyingQuestion } from "@/lib/grantbot/questions";

const GRANTBOT_MODEL = "anthropic/claude-haiku-4.5";

function handleAiError(err: unknown): never {
  const message = err instanceof Error ? err.message : "AI generation failed";
  if (/unauthorized|401|authentication|api key/i.test(message)) {
    throw new Error(
      "AI service is not configured. Enable AI Gateway on the Vercel project or set ANTHROPIC_API_KEY / AI_GATEWAY_API_KEY."
    );
  }
  throw new Error(message);
}

export async function generateClarifyingQuestions(
  category: string,
  orgDescription: string
): Promise<ClarifyingQuestion[]> {
  const systemPrompt = `You are a grant intake specialist. Based on the applicant profile below, generate follow-up questions that will help match them to the right funding opportunities.

Return ONLY valid JSON — no markdown, no commentary.

Schema:
{
  "questions": [
    {
      "id": "budget",
      "question": "What is your annual operating budget or project size?",
      "placeholder": "e.g. $250K annual budget"
    }
  ]
}

Rules:
- Generate exactly 4 questions tailored to category: ${category}
- Ask about gaps in the profile: geography, budget size, timeline, target population, prior grant experience, specific project goals
- Each question must be concise and answerable in 1-2 sentences
- Include helpful placeholders where useful
- Use short snake_case ids (e.g. location, budget, timeline)`;

  try {
    const { text } = await generateTextGeminiFirst({
      anthropicModel: GRANTBOT_MODEL,
      system: systemPrompt,
      prompt: orgDescription,
      maxOutputTokens: 1200,
    });

    const questions = parseClarifyingQuestions(text.trim());
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

export async function searchGrantListings(
  category: string,
  orgDescription: string
): Promise<GrantListing[]> {
  const systemPrompt = `You are a grant research expert. Return ONLY valid JSON — no markdown, no commentary.

Schema:
{
  "grants": [
    {
      "name": "Grant program name",
      "funder": "Funding organization",
      "platform": "Portal or program name (e.g. Grants.gov, NEA, Ford Foundation)",
      "platformUrl": "https://official-link-to-program-page",
      "awardRange": "Typical award range",
      "fitReason": "Why this fits the applicant (1-2 sentences)",
      "nextStep": "One concrete next step"
    }
  ]
}

Rules:
- Suggest exactly 5 realistic grants for category: ${category}
- Each grant MUST include a real https:// platformUrl to the official program or funder page
- Do not invent fake domains — use well-known public programs when possible
- platformUrl must be a full URL the applicant can open`;

  try {
    const { text } = await generateTextGeminiFirst({
      anthropicModel: GRANTBOT_MODEL,
      system: systemPrompt,
      prompt: orgDescription,
      maxOutputTokens: 2500,
    });

    const listings = parseGrantListings(text.trim());
    if (listings.length === 0) {
      throw new Error("Could not parse grant listings. Please try again.");
    }
    return listings;
  } catch (err) {
    if (err instanceof Error && err.message.startsWith("Could not parse")) {
      throw err;
    }
    handleAiError(err);
  }
}

export interface DraftGrantInput {
  grantTitle: string;
  funder: string;
  platform: string;
  platformUrl: string;
  awardRange: string;
  fitReason: string;
  orgDescription: string;
}

export async function draftGrantApplication(input: DraftGrantInput): Promise<string> {
  const systemPrompt = `You are an expert grant writer. Draft a complete grant application for the organization described below.

Grant: ${input.grantTitle}
Funder: ${input.funder}
Platform: ${input.platform} (${input.platformUrl})
Typical award: ${input.awardRange}
Why it fits: ${input.fitReason}

Write polished draft content with these sections:
1. Executive Summary
2. Organization Background
3. Project Description & Goals
4. Expected Impact
5. Budget Overview (high level, no fabricated numbers)
6. Sustainability Plan

Be specific to the organization but honest — do not fabricate statistics, awards, or partnerships. Use markdown headings.`;

  try {
    const { text } = await generateTextGeminiFirst({
      anthropicModel: GRANTBOT_MODEL,
      system: systemPrompt,
      prompt: input.orgDescription,
      maxOutputTokens: 2500,
    });
    return text.trim();
  } catch (err) {
    handleAiError(err);
  }
}
