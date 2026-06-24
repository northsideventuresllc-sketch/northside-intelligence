import { generateText } from "ai";

const MODEL = "anthropic/claude-haiku-4.5";

const PLAIN_LANGUAGE_RULES = `AUDIENCE RULES (critical):
- The section BEFORE ---TECHNICAL--- must be understandable by someone with zero coding, API, or AI background.
- Use everyday words: "connect", "sync", "automatically update" — not webhook, orchestration, idempotent, payload, schema, ETL unless they appear only after ---TECHNICAL---.
- Each simple-section item should start with a verb a non-technical person understands (Review, Check, Ask your team, Set up, Confirm).
- Never use markdown bold or headers inside list item text.`;

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
  const systemPrompt = `You are Signal Desk — an intelligence analyst who explains market and business signals clearly.

${PLAIN_LANGUAGE_RULES}

Focus area: ${focusArea}

Structure EXACTLY with these markdown headings in order:

## The Big Picture
(2-3 sentences: what is going on and why it matters — no jargon)

## What Matters Most
(3-5 bullet points, each starting with urgency in parentheses: (High), (Medium), or (Low), then plain-language explanation)

## What to Do Next
(3-5 numbered action steps anyone can follow this week)

## Keep an Eye On
(3-5 short bullet points — what to monitor next)

---TECHNICAL---
## Executive Summary
## Priority Signals (ranked 1-5 with urgency: High/Medium/Low)
## Recommended Actions
## Watch List

After ---TECHNICAL--- you may use analyst terminology, metrics shorthand, and competitive intelligence jargon.`;

  try {
    const { text } = await generateText({
      model: MODEL,
      system: systemPrompt,
      prompt: rawSignals,
      maxOutputTokens: 2400,
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
  const systemPrompt = `You are GapScan — you find problems in workflows, products, and markets and explain them clearly.

${PLAIN_LANGUAGE_RULES}

Scan type: ${scanType}

Structure EXACTLY with these markdown headings in order:

## What We Found
(2-3 sentences summarizing the situation in plain English)

## Problems to Fix
(Each bullet: start with (Critical), (Moderate), or (Minor), then describe the problem and why it hurts users or the business — no technical audit language)

## Easy Fixes First
(3-5 quick wins anyone could start this week — concrete, low-jargon)

## Longer-Term Ideas
(2-4 bigger improvements described simply)

---TECHNICAL---
## Overview
## Gaps Found (each with Severity: Critical/Moderate/Minor and Evidence)
## Quick Wins
## Strategic Recommendations

After ---TECHNICAL--- use product, UX, and competitive analysis terminology freely.`;

  try {
    const { text } = await generateText({
      model: MODEL,
      system: systemPrompt,
      prompt: context,
      maxOutputTokens: 2400,
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

Answer in plain English for a non-technical user (2-4 short paragraphs max). Avoid jargon unless you immediately explain it. If the question is outside the tool's scope, say so politely and suggest what they can do in ${toolName} instead. Do not invent features that do not exist.`;

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
  const systemPrompt = `You are BridgeAI — you help people connect two apps or systems and explain the plan in human terms first.

${PLAIN_LANGUAGE_RULES}

Structure EXACTLY with these markdown headings in order:

## In Plain English
(3-4 sentences: what will happen when ${sourceSystem} and ${targetSystem} work together, written for someone who has never written code)

## Your Step-by-Step Guide
(6-10 numbered steps in everyday language — who does what, in what order. Example: "1. When a deal closes in HubSpot, your team should…" — NO API names, webhooks, JSON, or code here)

## Things to Watch Out For
(3-5 bullet points — risks explained simply, with what to do if something goes wrong)

---TECHNICAL---
## Integration Goal
## Architecture Overview
## Step-by-Step Orchestration Plan
## Data Mapping Notes
## Risks and Mitigations
## Suggested Tools / APIs

After ---TECHNICAL--- provide implementation detail for developers (APIs, webhooks, data fields, error handling).`;

  const prompt = `Source system:\n${sourceSystem}\n\nTarget system:\n${targetSystem}\n\nGoal:\n${goal}`;

  try {
    const { text } = await generateText({
      model: MODEL,
      system: systemPrompt,
      prompt,
      maxOutputTokens: 2600,
    });
    return text.trim();
  } catch (err) {
    handleAiError(err);
  }
}
