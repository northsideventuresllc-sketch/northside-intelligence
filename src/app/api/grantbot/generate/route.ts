import { NextRequest, NextResponse } from "next/server";
import {
  draftGrantApplication,
  generateClarifyingQuestions,
  conductStructuredInterviewTurn,
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

type GrantBotMode = "questions" | "interview" | "search" | "draft";

// Free tier limits per JB's specification: 5 searches / mo, 2 applications / mo
const FREE_TIER_SEARCH_LIMIT = 5;
const FREE_TIER_DRAFT_LIMIT = 2;
const MAX_INTERVIEW_TURNS_PER_SESSION = 8;

async function ensureToolkitAccess(userId: string, email: string | undefined) {
  const billingState = await getUserBillingState(userId);
  if (!userCanUseTool(billingState, "grantbot")) {
    return { ok: false as const, status: 403, error: "Add GrantBot to your Toolkit to access grant discovery and drafting." };
  }
  return { ok: true as const, billingState };
}

async function checkUsageAndIncrement(
  userId: string,
  email: string | undefined,
  mode: "search" | "draft"
) {
  const access = await getGrantBotAccess(userId);
  const svc = createServiceClient();
  await ensureGrantBotProfile(svc, userId, email);

  const { data: profile, error: profileError } = await svc
    .from("grantbot_profiles")
    .select("grants_used_this_month, searches_used_this_month, grants_reset_at")
    .eq("id", userId)
    .single();

  if (profileError || !profile) {
    throw new Error("Could not load GrantBot profile");
  }

  const resetAt = new Date(profile.grants_reset_at || new Date().toISOString());
  const now = new Date();
  const monthsSince =
    (now.getFullYear() - resetAt.getFullYear()) * 12 + (now.getMonth() - resetAt.getMonth());

  let draftsUsed = profile.grants_used_this_month || 0;
  let searchesUsed = profile.searches_used_this_month || 0;

  // Monthly cycle rollover resets both counters independently
  if (monthsSince >= 1) {
    draftsUsed = 0;
    searchesUsed = 0;
    await svc
      .from("grantbot_profiles")
      .update({
        grants_used_this_month: 0,
        searches_used_this_month: 0,
        grants_reset_at: now.toISOString(),
      })
      .eq("id", userId);
  }

  const isFreePlan = !access.hasUnlimitedAccess && access.planLabel.toLowerCase().includes("free");

  if (mode === "search") {
    if (isFreePlan && searchesUsed >= FREE_TIER_SEARCH_LIMIT) {
      return {
        ok: false as const,
        status: 429,
        error: `Search limit reached (${FREE_TIER_SEARCH_LIMIT}/month on Free plan). Upgrade to Toolkit Pro for unlimited live grant searches.`,
        access,
        searchesUsed,
        draftsUsed,
      };
    }
  } else if (mode === "draft") {
    if (!access.hasUnlimitedAccess && draftsUsed >= (isFreePlan ? FREE_TIER_DRAFT_LIMIT : access.grantsLimit)) {
      const limit = isFreePlan ? FREE_TIER_DRAFT_LIMIT : access.grantsLimit;
      return {
        ok: false as const,
        status: 429,
        error: `Proposal drafting limit reached (${limit}/month on ${access.planLabel}). Upgrade for unlimited proposals and cloud session saves.`,
        access,
        searchesUsed,
        draftsUsed,
      };
    }
  }

  return {
    ok: true as const,
    access,
    searchesUsed,
    draftsUsed,
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

    const toolkitCheck = await ensureToolkitAccess(user.id, user.email);
    if (!toolkitCheck.ok) {
      return NextResponse.json(
        { error: toolkitCheck.error },
        { status: toolkitCheck.status }
      );
    }

    const body = await req.json();
    const mode = (body.mode as GrantBotMode) || "draft";
    const category = typeof body.category === "string" ? body.category.trim() : "";
    const orgDescription = typeof body.orgDescription === "string" ? body.orgDescription.trim() : "";

    // 1. Clarifying Questions Mode (Adaptive Intake)
    if (mode === "questions") {
      if (!category || !orgDescription) {
        return NextResponse.json(
          { error: "Category and organization description are required to generate intake questions." },
          { status: 400 }
        );
      }

      const questions = await generateClarifyingQuestions(category, orgDescription);
      return NextResponse.json({ questions });
    }

    // 2. Structured Conversational Interview Mode
    if (mode === "interview") {
      const turnIndex = typeof body.turnIndex === "number" ? body.turnIndex : 0;
      if (turnIndex > MAX_INTERVIEW_TURNS_PER_SESSION) {
        return NextResponse.json({
          nextQuestion: null,
          isComplete: true,
          summaryNotes: "Maximum interview exchanges reached. Proceeding to proposal drafting.",
        });
      }

      const interviewTurn = await conductStructuredInterviewTurn({
        category: category || "General",
        orgDescription: orgDescription || "Community Project",
        transcriptHistory: Array.isArray(body.transcriptHistory) ? body.transcriptHistory : [],
        currentAnswer: typeof body.currentAnswer === "string" ? body.currentAnswer.trim() : "",
        turnIndex,
      });

      return NextResponse.json(interviewTurn);
    }

    // 3. Live Grant Search Mode
    if (mode === "search") {
      if (!category) {
        return NextResponse.json({ error: "Category is required for grant search." }, { status: 400 });
      }

      const usage = await checkUsageAndIncrement(user.id, user.email, "search");
      if (!usage.ok) {
        return NextResponse.json({ error: usage.error }, { status: usage.status });
      }

      const { searchesUsed, access, svc, now } = usage;
      const listings = await searchGrantListings(category, orgDescription);

      // Increment search usage counter
      await svc
        .from("grantbot_profiles")
        .update({
          searches_used_this_month: searchesUsed + 1,
          last_mode: "search",
          last_category: category,
          updated_at: now.toISOString(),
        })
        .eq("id", user.id);

      return NextResponse.json({
        listings,
        usage: {
          used: searchesUsed + 1,
          limit: access.hasUnlimitedAccess ? null : FREE_TIER_SEARCH_LIMIT,
          planLabel: access.planLabel,
          hasUnlimitedAccess: access.hasUnlimitedAccess,
        },
      });
    }

    // 4. Institutional Proposal & Deliverables Drafting Mode
    if (mode === "draft") {
      if (!orgDescription) {
        return NextResponse.json(
          { error: "Organization description is required to draft a grant application." },
          { status: 400 }
        );
      }

      const grantTitle = typeof body.grantTitle === "string" ? body.grantTitle.trim() : "Target Community Grant";
      const funder = typeof body.funder === "string" ? body.funder.trim() : "Grant Review Committee";
      const platform = typeof body.platform === "string" ? body.platform.trim() : "Institutional Grants Portal";
      const platformUrl = typeof body.platformUrl === "string" ? body.platformUrl.trim() : "https://www.grants.gov";
      const awardRange = typeof body.awardRange === "string" ? body.awardRange.trim() : "$25,000 - $100,000";

      const usage = await checkUsageAndIncrement(user.id, user.email, "draft");
      if (!usage.ok) {
        return NextResponse.json({ error: usage.error }, { status: usage.status });
      }

      const { draftsUsed, access, svc, now } = usage;

      const rawQuestions = Array.isArray(body.clarifyingQuestions) ? (body.clarifyingQuestions as ClarifyingQuestion[]) : [];
      const answers = parseAnswers(body.clarifyingAnswers);
      const enrichedProfile = rawQuestions.length > 0 && Object.keys(answers).length > 0
        ? buildEnrichedOrgProfile(orgDescription, serializeClarifyingAnswers(rawQuestions, answers))
        : orgDescription;

      const draftResult = await draftGrantApplication({
        grantTitle,
        funder,
        platform,
        platformUrl,
        awardRange,
        orgDescription: enrichedProfile,
        orgName: typeof body.orgName === "string" ? body.orgName.trim() : undefined,
        requestedAmount: body.requestedAmount,
        personnelCost: body.personnelCost,
        directCost: body.directCost,
        adminCost: body.adminCost,
      });

      const shouldSaveMemory = access.hasUnlimitedAccess || !access.planLabel.toLowerCase().includes("free");

      await Promise.all([
        svc
          .from("grantbot_profiles")
          .update({
            grants_used_this_month: draftsUsed + 1,
            last_mode: "draft",
            last_category: category,
            updated_at: now.toISOString(),
          })
          .eq("id", user.id),
        shouldSaveMemory
          ? svc.from("grantbot_sessions").insert({
              user_id: user.id,
              mode: "draft",
              org_description: orgDescription,
              category,
              grant_title: grantTitle,
              funder,
              prompt_questions: platformUrl,
              result_text: draftResult.fullNarrative,
            })
          : Promise.resolve(),
      ]);

      return NextResponse.json({
        draft: draftResult.fullNarrative,
        deliverables: draftResult.deliverablesPackage,
        benchmarks: draftResult.pastWinnerBenchmarks,
        usage: {
          draftsUsed: draftsUsed + 1,
          draftsLimit: access.hasUnlimitedAccess ? null : FREE_TIER_DRAFT_LIMIT,
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
