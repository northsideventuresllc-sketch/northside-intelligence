import { NextRequest, NextResponse } from "next/server";
import {
  draftGrantApplication,
  generateClarifyingQuestions,
  searchGrantListings,
} from "@/lib/grantbot/ai";
import { getGrantBotAccess } from "@/lib/grantbot/access";
import { serializeGrantListings } from "@/lib/grantbot/listings";
import {
  buildEnrichedOrgProfile,
  serializeClarifyingAnswers,
  type ClarifyingQuestion,
} from "@/lib/grantbot/questions";
import { ensureGrantBotProfile } from "@/lib/grantbot/profile";
import { getUserBillingState, userCanUseTool } from "@/lib/billing/entitlements";
import { createServerAuthClient } from "@/lib/supabase/server-auth";
import { createServiceClient } from "@/lib/supabase/server";

const CATEGORIES = [
  "Nonprofit",
  "Creator",
  "Research",
  "Small Business",
  "Arts & Culture",
] as const;

type GrantBotMode = "questions" | "search" | "draft";

async function ensureToolkitAccess(userId: string, email: string | undefined) {
  const billingState = await getUserBillingState(userId);
  if (!userCanUseTool(billingState, "grantbot")) {
    return { ok: false as const, status: 403, error: "Add GrantBot to your Toolkit before using it" };
  }

  const svc = createServiceClient();
  await ensureGrantBotProfile(svc, userId, email);
  return { ok: true as const, svc };
}

async function checkUsageAndIncrement(userId: string, email: string | undefined) {
  const access = await getGrantBotAccess(userId);
  const svc = createServiceClient();
  await ensureGrantBotProfile(svc, userId, email);

  const { data: profile, error: profileError } = await svc
    .from("grantbot_profiles")
    .select("grants_used_this_month, grants_reset_at")
    .eq("id", userId)
    .single();

  if (profileError || !profile) {
    throw new Error("Could not load GrantBot profile");
  }

  const limit = access.grantsLimit;
  const resetAt = new Date(profile.grants_reset_at);
  const now = new Date();
  const monthsSince =
    (now.getFullYear() - resetAt.getFullYear()) * 12 + (now.getMonth() - resetAt.getMonth());
  let grantsUsed = profile.grants_used_this_month;

  if (monthsSince >= 1) {
    grantsUsed = 0;
    await svc
      .from("grantbot_profiles")
      .update({ grants_used_this_month: 0, grants_reset_at: now.toISOString() })
      .eq("id", userId);
  }

  if (!access.hasUnlimitedAccess && grantsUsed >= limit) {
    return {
      ok: false as const,
      status: 429,
      error: `Grant limit reached (${limit}/mo on ${access.planLabel} plan).`,
      access,
      grantsUsed,
    };
  }

  return {
    ok: true as const,
    access,
    grantsUsed,
    now,
    svc,
  };
}

function parseAnswers(raw: unknown): Record<string, string> {
  if (!raw || typeof raw !== "object") return {};
  const answers: Record<string, string> = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof value === "string" && value.trim()) {
      answers[key] = value.trim();
    }
  }
  return answers;
}

function parseQuestionsPayload(raw: unknown): ClarifyingQuestion[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((entry, index): ClarifyingQuestion | null => {
      if (!entry || typeof entry !== "object") return null;
      const item = entry as { id?: unknown; question?: unknown; placeholder?: unknown };
      const question = typeof item.question === "string" ? item.question.trim() : "";
      if (!question) return null;
      const placeholder =
        typeof item.placeholder === "string" ? item.placeholder.trim() : undefined;
      return {
        id: typeof item.id === "string" ? item.id : `q${index + 1}`,
        question,
        ...(placeholder ? { placeholder } : {}),
      };
    })
    .filter((entry): entry is ClarifyingQuestion => entry !== null);
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerAuthClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const mode = body.mode as GrantBotMode;
    const orgDescription = typeof body.orgDescription === "string" ? body.orgDescription.trim() : "";
    const category =
      typeof body.category === "string" &&
      CATEGORIES.includes(body.category as (typeof CATEGORIES)[number])
        ? body.category
        : "Nonprofit";

    if (!orgDescription) {
      return NextResponse.json({ error: "Organization description is required" }, { status: 400 });
    }

    const toolkit = await ensureToolkitAccess(user.id, user.email);
    if (!toolkit.ok) {
      return NextResponse.json({ error: toolkit.error, code: "TOOL_NOT_IN_CASE" }, { status: toolkit.status });
    }

    if (mode === "questions") {
      const questions = await generateClarifyingQuestions(category, orgDescription);
      return NextResponse.json({ questions });
    }

    const usageCheck = await checkUsageAndIncrement(user.id, user.email);
    if (!usageCheck.ok) {
      return NextResponse.json({ error: usageCheck.error }, { status: usageCheck.status });
    }

    const { access, grantsUsed, now, svc } = usageCheck;
    const clarifyingAnswers = parseAnswers(body.clarifyingAnswers);
    const clarifyingQuestions = parseQuestionsPayload(body.clarifyingQuestions);
    const enrichedProfile = buildEnrichedOrgProfile(
      orgDescription,
      clarifyingQuestions,
      clarifyingAnswers
    );

    if (mode === "search") {
      const grants = await searchGrantListings(category, enrichedProfile);
      const resultText = serializeGrantListings(grants);

      await Promise.all([
        svc
          .from("grantbot_profiles")
          .update({
            grants_used_this_month: grantsUsed + 1,
            last_mode: "search",
            last_category: category,
            updated_at: now.toISOString(),
          })
          .eq("id", user.id),
        svc.from("grantbot_sessions").insert({
          user_id: user.id,
          mode: "search",
          org_description: orgDescription,
          category,
          prompt_questions: serializeClarifyingAnswers(clarifyingAnswers),
          result_text: resultText,
        }),
      ]);

      return NextResponse.json({
        grants,
        usage: {
          used: grantsUsed + 1,
          limit: access.hasUnlimitedAccess ? null : access.grantsLimit,
          planLabel: access.planLabel,
          hasUnlimitedAccess: access.hasUnlimitedAccess,
        },
      });
    }

    if (mode === "draft") {
      const grantTitle = typeof body.grantTitle === "string" ? body.grantTitle.trim() : "";
      const funder = typeof body.funder === "string" ? body.funder.trim() : "";
      const platform = typeof body.platform === "string" ? body.platform.trim() : "";
      const platformUrl = typeof body.platformUrl === "string" ? body.platformUrl.trim() : "";
      const awardRange = typeof body.awardRange === "string" ? body.awardRange.trim() : "Varies";
      const fitReason = typeof body.fitReason === "string" ? body.fitReason.trim() : "";

      if (!grantTitle || !funder || !platform || !platformUrl) {
        return NextResponse.json(
          { error: "Grant details are required to draft an application" },
          { status: 400 }
        );
      }

      const draft = await draftGrantApplication({
        grantTitle,
        funder,
        platform,
        platformUrl,
        awardRange,
        fitReason,
        orgDescription: enrichedProfile,
      });

      await Promise.all([
        svc
          .from("grantbot_profiles")
          .update({
            grants_used_this_month: grantsUsed + 1,
            last_mode: "draft",
            last_category: category,
            updated_at: now.toISOString(),
          })
          .eq("id", user.id),
        svc.from("grantbot_sessions").insert({
          user_id: user.id,
          mode: "draft",
          org_description: orgDescription,
          category,
          grant_title: grantTitle,
          funder,
          prompt_questions: platformUrl,
          result_text: draft,
        }),
      ]);

      return NextResponse.json({
        draft,
        usage: {
          used: grantsUsed + 1,
          limit: access.hasUnlimitedAccess ? null : access.grantsLimit,
          planLabel: access.planLabel,
          hasUnlimitedAccess: access.hasUnlimitedAccess,
        },
      });
    }

    return NextResponse.json({ error: "Invalid mode" }, { status: 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
