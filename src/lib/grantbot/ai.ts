import { generateTextGeminiFirst } from "@/lib/ai/gemini-first";
import { type GrantListing } from "@/lib/grantbot/listings";
import { parseClarifyingQuestions, type ClarifyingQuestion } from "@/lib/grantbot/questions";
import { searchVerifiedGrantOpportunities, scrapeRfpRequirements } from "@/lib/grantbot/scraper-grep";
import { getPastWinnerBenchmark } from "@/lib/grantbot/past-winners";
import { buildGrantDeliverableSuite, type GrantDeliverablePackage } from "@/lib/grantbot/deliverables";

function handleAiError(err: unknown): never {
  const message = err instanceof Error ? err.message : "AI generation failed";
  if (/unauthorized|401|authentication|api key/i.test(message)) {
    throw new Error(
      "Text generation is unavailable right now. Nothing is broken — please try again shortly."
    );
  }
  throw new Error(message);
}

/**
 * Safely strips markdown code fences and cleans JSON returned by LLMs.
 */
export function parseJsonFromLlm<T>(text: string): T {
  let cleaned = text.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "");
  }
  return JSON.parse(cleaned.trim()) as T;
}

/**
 * Dynamically sizes follow-up questions based on profile gaps (not hardcoded to 4).
 */
export async function generateClarifyingQuestions(
  category: string,
  orgDescription: string
): Promise<ClarifyingQuestion[]> {
  const systemPrompt = `You are an elite grant intake auditor. Analyze the applicant profile below and identify genuine information gaps needed to match them with verified funding opportunities.

Return ONLY valid JSON — no markdown, no commentary.

Schema:
{
  "questions": [
    {
      "id": "budget_scale",
      "question": "Clear, direct question asking for the missing detail",
      "hint": "Brief sentence explaining why grant funders look for this",
      "options": ["Option A", "Option B", "Option C"]
    }
  ]
}

Rules:
- Generate 2 to 6 questions depending strictly on missing details (if the profile is detailed, ask fewer).
- Always include options where appropriate, plus a freeform custom answer slot.
- Cover missing: 501(c)(3) / tax status, target beneficiaries, annual operating budget, or geographical reach.`;

  try {
    const { text } = await generateTextGeminiFirst({
      system: systemPrompt,
      prompt: `Category: ${category}\n\nOrganization Description:\n${orgDescription}`,
      maxOutputTokens: 1200,
    });

    const parsed = parseJsonFromLlm<{ questions?: ClarifyingQuestion[] }>(text);
    return parseClarifyingQuestions(parsed);
  } catch (err) {
    handleAiError(err);
  }
}

export interface InterviewTurnInput {
  category: string;
  orgDescription: string;
  transcriptHistory: Array<{ role: "assistant" | "user"; content: string }>;
  currentAnswer: string;
  turnIndex: number;
}

export interface InterviewTurnOutput {
  nextQuestion: string | null;
  isComplete: boolean;
  summaryNotes?: string;
}

/**
 * Executes a single turn of an adaptive, conversational grant interview.
 * Concludes naturally after 4-6 high-yield questions without fatiguing the applicant.
 */
export async function conductStructuredInterviewTurn(
  params: InterviewTurnInput
): Promise<InterviewTurnOutput> {
  const systemPrompt = `You are a warm, highly experienced senior grant director conducting a structured interview with an applicant.
Your goal is to draw out all essential details needed for a winning grant application: mission, community impact, budget justification, track record, and measurable outcomes.

Return ONLY valid JSON:
{
  "nextQuestion": "Your next follow-up question here (or null if interview is complete)",
  "isComplete": false,
  "summaryNotes": "Key bullet points gathered so far"
}

Rules:
- Ask ONE targeted question at a time.
- React directly to what the applicant just said before asking your next question.
- Conclude the interview (set isComplete: true) after 4-6 high-yield exchanges once sufficient detail is gathered.`;

  try {
    const { text } = await generateTextGeminiFirst({
      system: systemPrompt,
      prompt: JSON.stringify(params),
      maxOutputTokens: 800,
    });
    return parseJsonFromLlm<InterviewTurnOutput>(text);
  } catch (err) {
    return {
      nextQuestion: "Could you describe the primary measurable outcomes this grant will achieve in your community?",
      isComplete: false,
    };
  }
}

/**
 * Searches live verified grant databases and web sources.
 * Replaces hallucinated LLM memories with verified programs, real deadlines, and URLs.
 */
export async function searchGrantListings(
  category: string,
  orgDescription: string
): Promise<GrantListing[]> {
  const verifiedListings = await searchVerifiedGrantOpportunities(category, orgDescription);

  return verifiedListings.map((g) => ({
    id: g.id,
    name: g.name,
    funder: g.funder,
    platform: `${g.platform} (${g.activeStatus})`,
    platformUrl: g.platformUrl,
    awardRange: `${g.awardRange} · Deadline: ${g.deadline}`,
    fitReason: g.fitReason,
    nextStep: g.nextStep,
  }));
}

export interface DraftGrantInput {
  grantTitle: string;
  funder: string;
  platform: string;
  platformUrl: string;
  awardRange: string;
  orgDescription: string;
  orgName?: string;
  requestedAmount?: string;
  personnelCost?: string;
  directCost?: string;
  adminCost?: string;
}

export interface DraftGrantResult {
  fullNarrative: string;
  deliverablesPackage: GrantDeliverablePackage;
  pastWinnerBenchmarks: string[];
}

/**
 * Generates an institutional-grade, multi-part grant proposal suite.
 */
export async function draftGrantApplication(
  input: DraftGrantInput
): Promise<DraftGrantResult> {
  const [rfp, benchmark] = await Promise.all([
    scrapeRfpRequirements(input.platformUrl, input.grantTitle, input.funder),
    getPastWinnerBenchmark(input.funder, input.grantTitle),
  ]);

  const applicantName = input.orgName?.trim() || input.orgDescription.split("\n")[0].slice(0, 80).trim() || "Applicant Organization";

  const systemPrompt = `You are an elite, winning grant writer with a 90%+ funding record. Write a complete, comprehensive grant application proposal for the opportunity below.

TARGET OPPORTUNITY:
- Title: ${input.grantTitle}
- Funder: ${input.funder}
- Award Range: ${input.awardRange}
- Submission Deadline: ${rfp.submissionDeadline}

RFP GUIDELINE REQUIREMENTS:
Required Sections:
${rfp.requiredSections.map((s) => `- ${s}`).join("\n")}
Scoring Rubric Criteria to maximize:
${rfp.scoringRubric.map((r) => `- ${r}`).join("\n")}

CRITICAL WINNING BENCHMARKS:
Incorporate these verified qualities favored by ${input.funder}:
${benchmark.winningQualities.map((q) => `- ${q}`).join("\n")}
Use this favored terminology where appropriate: ${benchmark.favoredTerminology.join(", ")}

Required Proposal Structure:
## 1. Executive Summary & Abstract
## 2. Statement of Need & Community Context
## 3. Project Plan, Methodology & Measurable Milestones
## 4. Community Evaluation & Logic Model
## 5. Organizational Readiness & Personnel Track Record
## 6. Long-Term Financial Sustainability Plan

Do NOT fabricate statistics or private financial details. Use professional, authoritative, evidence-based language with markdown headings.`;

  try {
    const { text } = await generateTextGeminiFirst({
      system: systemPrompt,
      prompt: `Applicant Entity: ${applicantName}\n\nOrganization & Project Background:\n${input.orgDescription}`,
      maxOutputTokens: 3500,
    });

    const deliverablesPackage = buildGrantDeliverableSuite({
      grantTitle: input.grantTitle,
      funder: input.funder,
      orgName: applicantName,
      applicantNarrative: text.trim(),
      userInputNumbers: {
        requestedAmount: input.requestedAmount || input.awardRange,
        personnelCost: input.personnelCost,
        directCost: input.directCost,
        adminCost: input.adminCost,
      },
      pastWinnerQualities: benchmark.winningQualities,
    });

    return {
      fullNarrative: text.trim(),
      deliverablesPackage,
      pastWinnerBenchmarks: benchmark.winningQualities,
    };
  } catch (err) {
    handleAiError(err);
  }
}
