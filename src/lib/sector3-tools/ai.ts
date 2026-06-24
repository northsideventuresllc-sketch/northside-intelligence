import { generateText } from "ai";

const MODEL = "anthropic/claude-haiku-4.5";

function handleAiError(err: unknown): never {
  const message = err instanceof Error ? err.message : "AI generation failed";
  if (/unauthorized|401|authentication|api key/i.test(message)) {
    throw new Error(
      "AI service is not configured. Enable AI Gateway on the Vercel project or set ANTHROPIC_API_KEY / AI_GATEWAY_API_KEY."
    );
  }
  throw new Error(message);
}

export async function generateSignalDeskBrief(
  rawSignals: string,
  focusArea: string
): Promise<string> {
  const systemPrompt = `You are Signal Desk — an intelligence analyst for operators and founders.

The user pasted raw signals (news, metrics, competitor moves, market chatter). Produce a concise intelligence brief.

Structure with markdown headings:
## Executive Summary
## Priority Signals (ranked 1-5 with urgency: High/Medium/Low)
## Recommended Actions (3-5 concrete next steps)
## Watch List (what to monitor next)

Focus area: ${focusArea}
Be specific, actionable, and plain English. No filler.`;

  try {
    const { text } = await generateText({
      model: MODEL,
      system: systemPrompt,
      prompt: rawSignals,
      maxOutputTokens: 2000,
    });
    return text.trim();
  } catch (err) {
    handleAiError(err);
  }
}

export async function generateGapScanReport(
  context: string,
  scanType: string
): Promise<string> {
  const systemPrompt = `You are GapScan — a workflow and market gap detection specialist.

Analyze the user's context and identify gaps (missing steps, unmet needs, competitive whitespace, process friction).

Scan type: ${scanType}

Structure with markdown:
## Overview
## Gaps Found (each with Severity: Critical/Moderate/Minor and Evidence)
## Quick Wins
## Strategic Recommendations

Be direct and practical.`;

  try {
    const { text } = await generateText({
      model: MODEL,
      system: systemPrompt,
      prompt: context,
      maxOutputTokens: 2000,
    });
    return text.trim();
  } catch (err) {
    handleAiError(err);
  }
}

export async function answerSector3ToolHelpQuestion(
  toolName: string,
  toolSummary: string,
  question: string
): Promise<string> {
  const systemPrompt = `You are the in-app help assistant for ${toolName}, a Northside Intelligence tool.

Tool purpose: ${toolSummary}

Answer the user's question clearly and concisely (2-4 short paragraphs max). Use plain English. If the question is outside the tool's scope, say so politely and suggest what they can do in ${toolName} instead. Do not invent features that do not exist.`;

  try {
    const { text } = await generateText({
      model: MODEL,
      system: systemPrompt,
      prompt: question,
      maxOutputTokens: 600,
    });
    return text.trim();
  } catch (err) {
    handleAiError(err);
  }
}

export async function generateBridgeAIPlan(
  sourceSystem: string,
  targetSystem: string,
  goal: string
): Promise<string> {
  const systemPrompt = `You are BridgeAI — a cross-platform AI orchestration architect.

Design an integration and automation plan connecting the source system to the target system.

Structure with markdown:
## Integration Goal
## Architecture Overview
## Step-by-Step Orchestration Plan
## Data Mapping Notes
## Risks and Mitigations
## Suggested Tools / APIs

Keep it implementation-oriented for a small team.`;

  const prompt = `Source system:\n${sourceSystem}\n\nTarget system:\n${targetSystem}\n\nGoal:\n${goal}`;

  try {
    const { text } = await generateText({
      model: MODEL,
      system: systemPrompt,
      prompt,
      maxOutputTokens: 2200,
    });
    return text.trim();
  } catch (err) {
    handleAiError(err);
  }
}
