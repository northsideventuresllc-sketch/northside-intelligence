import { generateTextGeminiFirst } from "@/lib/ai/gemini-first";
import { TONE_REGISTRY, type ReplyTone } from "@/lib/replyflow/tone";
import { buildPolicyInstructionBlock, type CompanyPolicyContext } from "@/lib/replyflow/policy";
import { type StylePreference } from "@/lib/replyflow/learning";

function handleAiError(err: unknown): never {
  const message = err instanceof Error ? err.message : "AI generation failed";
  if (/unauthorized|401|authentication|api key/i.test(message)) {
    throw new Error(
      "Text generation is unavailable right now. Nothing is broken — please try again shortly."
    );
  }
  throw new Error(message);
}

export interface GenerateReplyInput {
  customerMessage: string;
  tone: ReplyTone;
  scenario: string;
  policyContext?: Partial<CompanyPolicyContext>;
  stylePreferences?: StylePreference;
  customInstructions?: string;
}

export interface GeneratedReplySuite {
  primaryReply: string;
  variations: {
    direct: string;
    diplomatic: string;
    comprehensive: string;
  };
  detectedIntent: string;
  recommendedNextStep: string;
  toneUsed: ReplyTone;
}

/**
 * Generates an institutional-grade, calibrated customer service reply suite with 3 variations.
 */
export async function generateCalibratedReplySuite(
  input: GenerateReplyInput
): Promise<GeneratedReplySuite> {
  const toneGuide = TONE_REGISTRY[input.tone] || TONE_REGISTRY["empathetic"];
  const policyBlock = buildPolicyInstructionBlock(input.policyContext);

  let styleBlock = "";
  if (input.stylePreferences) {
    const prefs = input.stylePreferences;
    const parts: string[] = [];
    if (prefs.signoffPattern) parts.push(`Preferred sign-off: "${prefs.signoffPattern}"`);
    if (prefs.averageSentenceLength) parts.push(`Preferred pacing: ${prefs.averageSentenceLength} sentences`);
    if (prefs.bannedWords?.length) parts.push(`Avoid these words: ${prefs.bannedWords.slice(0, 10).join(", ")}`);
    if (parts.length > 0) {
      styleBlock = `\nUSER STYLE PREFERENCES (Learned from past edits):\n${parts.join("\n")}`;
    }
  }

  const systemPrompt = `You are an elite customer communication strategist and executive communications director.
Analyze the customer message and generate a production-ready, highly polished reply suite adhering to the specified tone and organizational boundaries.

TONE SPECIFICATION: ${toneGuide.label}
Description: ${toneGuide.description}
Guidelines:
${toneGuide.guidelines.map((g) => `- ${g}`).join("\n")}
Forbidden Phrases (NEVER use these):
${toneGuide.forbiddenPhrases.map((f) => `- "${f}"`).join("\n")}

${policyBlock}
${styleBlock}
${input.customInstructions ? `\nCUSTOM USER DIRECTIVE: ${input.customInstructions}` : ""}

Return ONLY valid JSON:
{
  "detectedIntent": "Brief sentence summarizing customer's root problem and emotion",
  "primaryReply": "The single best calibrated reply ready for immediate copying and dispatch",
  "variations": {
    "direct": "Ultra-concise, 2-3 sentence direct answer focusing on immediate action",
    "diplomatic": "Empathetic, relationship-preserving response acknowledging the situation with care",
    "comprehensive": "Detailed response with context, policy clarity, and step-by-step guidance"
  },
  "recommendedNextStep": "Internal action item for the support agent"
}

Format the replies cleanly without robotic AI markers or cheesy placeholders.`;

  try {
    const { text } = await generateTextGeminiFirst({
      system: systemPrompt,
      prompt: `Scenario: ${input.scenario}\n\nIncoming Customer Message:\n"""\n${input.customerMessage}\n"""`,
      maxOutputTokens: 1500,
    });

    let cleaned = text.trim();
    if (cleaned.startsWith("```")) {
      cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "");
    }

    const parsed = JSON.parse(cleaned.trim());

    return {
      primaryReply: parsed.primaryReply || text.trim(),
      variations: {
        direct: parsed.variations?.direct || parsed.primaryReply || text.trim(),
        diplomatic: parsed.variations?.diplomatic || parsed.primaryReply || text.trim(),
        comprehensive: parsed.variations?.comprehensive || parsed.primaryReply || text.trim(),
      },
      detectedIntent: parsed.detectedIntent || "Customer inquiry regarding " + input.scenario,
      recommendedNextStep: parsed.recommendedNextStep || "Send primary reply and log customer feedback.",
      toneUsed: input.tone,
    };
  } catch (err) {
    // If structured parsing fails, return safe fallback using single reply
    try {
      const { text } = await generateTextGeminiFirst({
        system: `You are a professional customer service expert. Write a ${toneGuide.label} response.`,
        prompt: input.customerMessage,
        maxOutputTokens: 800,
      });
      return {
        primaryReply: text.trim(),
        variations: {
          direct: text.trim(),
          diplomatic: text.trim(),
          comprehensive: text.trim(),
        },
        detectedIntent: "Inquiry regarding " + input.scenario,
        recommendedNextStep: "Send reply",
        toneUsed: input.tone,
      };
    } catch (fallbackErr) {
      handleAiError(fallbackErr);
    }
  }
}

// Preserve backwards-compatible generateReply function
export async function generateReply(systemPrompt: string, userMessage: string): Promise<string> {
  const result = await generateCalibratedReplySuite({
    customerMessage: userMessage,
    tone: "empathetic",
    scenario: "Support Request",
    customInstructions: systemPrompt,
  });
  return result.primaryReply;
}
