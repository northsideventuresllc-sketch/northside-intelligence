import { NextRequest, NextResponse } from "next/server";
import { getUserBillingState, userCanUseTool } from "@/lib/billing/entitlements";
import { createServerAuthClient } from "@/lib/supabase/server-auth";
import { createSector3ServiceClient } from "@/lib/sector3-tools/service-client";
import { ensureSector3ToolProfile } from "@/lib/sector3-tools/profile";
import {
  checkSector3Usage,
  incrementSector3Usage,
} from "@/lib/sector3-tools/usage";
import type { Sector3ToolRuntimeConfig } from "@/lib/sector3-tools/types";
import {
  buildEnrichedInputs,
  serializeClarifyingAnswers,
  type Sector3ClarifyingQuestion,
} from "@/lib/sector3-tools/clarification";
import { updateUserContext } from "@/lib/sector3-tools/conversations";
import type { Sector3ToolSlug } from "@/lib/sector3-registry";

type GenerateFn = (body: Record<string, unknown>) => Promise<{
  result: string;
  inputSummary: string;
  sessionMeta?: Record<string, string | null>;
}>;

export function createSector3GenerateRoute(
  config: Sector3ToolRuntimeConfig,
  generate: GenerateFn
) {
  return async function POST(req: NextRequest) {
    const supabase = await createServerAuthClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const billingState = await getUserBillingState(user.id);
    if (!userCanUseTool(billingState, config.slug)) {
      return NextResponse.json(
        { error: `Add ${config.displayName} to your Toolkit before using it` },
        { status: 403 }
      );
    }

    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const clarifyingQuestions = (body.clarifyingQuestions ?? []) as Sector3ClarifyingQuestion[];
    const clarifyingAnswers = (body.clarifyingAnswers ?? {}) as Record<string, string[]>;

    const baseValues = Object.fromEntries(
      Object.entries(body).filter(
        ([key]) =>
          !["clarifyingQuestions", "clarifyingAnswers", "skipClarification"].includes(key)
      )
    ) as Record<string, string>;

    const enrichedValues = buildEnrichedInputs(
      baseValues,
      clarifyingQuestions,
      clarifyingAnswers
    );

    const usage = await checkSector3Usage(user.id, user.email, config);

    if (!usage.ok) {
      return NextResponse.json(
        { error: usage.error, access: usage.access, usageCount: usage.usageCount },
        { status: usage.status }
      );
    }

    let output: Awaited<ReturnType<GenerateFn>>;
    try {
      output = await generate(enrichedValues);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Generation failed";
      return NextResponse.json({ error: message }, { status: 500 });
    }

    if (!usage.access.hasUnlimitedAccess) {
      await incrementSector3Usage(usage.svc, user.id, config, usage.usageCount);
    }

    const admin = await createSector3ServiceClient();
    await ensureSector3ToolProfile(admin, config, user.id, user.email);

    const sessionPayload: Record<string, unknown> = {
      user_id: user.id,
      input_summary: output.inputSummary.slice(0, 500),
      result_text: output.result,
      ...output.sessionMeta,
    };

    if (Object.keys(clarifyingAnswers).length > 0) {
      sessionPayload.prompt_questions = serializeClarifyingAnswers(clarifyingAnswers);
    }

    await admin.from(config.sessionsTable).insert(sessionPayload);

    const topicSummary = output.inputSummary.slice(0, 80);
    await updateUserContext(user.id, config.slug as Sector3ToolSlug, {
      recentTopics: [topicSummary],
      fieldUsage: Object.fromEntries(
        Object.keys(baseValues)
          .filter((k) => baseValues[k]?.trim())
          .map((k) => [k, 1])
      ),
      lastGeneratedAt: new Date().toISOString(),
    });

    return NextResponse.json({
      result: output.result,
      usageCount: usage.access.hasUnlimitedAccess
        ? usage.usageCount
        : usage.usageCount + 1,
      usageLimit: usage.access.usageLimit,
      hasUnlimitedAccess: usage.access.hasUnlimitedAccess,
    });
  };
}
