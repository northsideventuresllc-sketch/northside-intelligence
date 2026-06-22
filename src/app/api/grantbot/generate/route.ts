import { NextRequest, NextResponse } from "next/server";
import { getGrantBotAccess } from "@/lib/grantbot/access";
import { generateGrantBotText } from "@/lib/grantbot/ai";
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

type GrantBotMode = "search" | "draft";

function buildSearchPrompt(category: string, orgDescription: string): string {
  return `You are a grant research expert. Based on the organization profile below, suggest 5 realistic grant opportunities the applicant should explore.

For each grant include:
- Grant name
- Funder / program
- Typical award range
- Why it fits this applicant
- One next step to pursue it

Use clear markdown headings and bullet lists. Focus on well-known public and foundation programs when possible — do not invent fake URLs.

Category focus: ${category}`;
}

function buildDraftPrompt(
  grantTitle: string,
  funder: string,
  orgDescription: string,
  promptQuestions: string
): string {
  return `You are an expert grant writer. Draft compelling application content for the grant below.

Grant: ${grantTitle}
Funder: ${funder}

Organization background:
${orgDescription}

Application prompts / questions to address:
${promptQuestions}

Write polished, specific draft responses the applicant can edit. Use markdown sections matching each prompt. Be concrete but honest — do not fabricate statistics or past awards.`;
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

    const billingState = await getUserBillingState(user.id);
    if (!userCanUseTool(billingState, "grantbot")) {
      return NextResponse.json(
        { error: "Add GrantBot to your Toolkit before using it", code: "TOOL_NOT_IN_CASE" },
        { status: 403 }
      );
    }

    const access = await getGrantBotAccess(user.id);

    const { data: profile, error: profileError } = await supabase
      .from("grantbot_profiles")
      .select("grants_used_this_month, grants_reset_at")
      .eq("id", user.id)
      .single();
    if (profileError || !profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const limit = access.grantsLimit;
    const resetAt = new Date(profile.grants_reset_at);
    const now = new Date();
    const monthsSince =
      (now.getFullYear() - resetAt.getFullYear()) * 12 + (now.getMonth() - resetAt.getMonth());
    let grantsUsed = profile.grants_used_this_month;
    if (monthsSince >= 1) {
      grantsUsed = 0;
      const svc = createServiceClient();
      await svc
        .from("grantbot_profiles")
        .update({ grants_used_this_month: 0, grants_reset_at: now.toISOString() })
        .eq("id", user.id);
    }
    if (!access.hasUnlimitedAccess && grantsUsed >= limit) {
      return NextResponse.json(
        { error: `Grant limit reached (${limit}/mo on ${access.planLabel} plan).` },
        { status: 429 }
      );
    }

    const body = await req.json();
    const mode = body.mode as GrantBotMode;
    const orgDescription = typeof body.orgDescription === "string" ? body.orgDescription.trim() : "";
    const category =
      typeof body.category === "string" && CATEGORIES.includes(body.category as (typeof CATEGORIES)[number])
        ? body.category
        : "Nonprofit";
    const grantTitle = typeof body.grantTitle === "string" ? body.grantTitle.trim() : "";
    const funder = typeof body.funder === "string" ? body.funder.trim() : "";
    const promptQuestions =
      typeof body.promptQuestions === "string" ? body.promptQuestions.trim() : "";

    if (!orgDescription) {
      return NextResponse.json({ error: "Organization description is required" }, { status: 400 });
    }

    if (mode === "draft") {
      if (!grantTitle || !promptQuestions) {
        return NextResponse.json(
          { error: "Grant title and application prompts are required for drafting" },
          { status: 400 }
        );
      }
    } else if (mode !== "search") {
      return NextResponse.json({ error: "Invalid mode" }, { status: 400 });
    }

    const systemPrompt =
      mode === "search"
        ? buildSearchPrompt(category, orgDescription)
        : buildDraftPrompt(grantTitle, funder || "Unknown funder", orgDescription, promptQuestions);

    const result = await generateGrantBotText(systemPrompt, orgDescription);

    const svc2 = createServiceClient();
    await Promise.all([
      svc2
        .from("grantbot_profiles")
        .update({
          grants_used_this_month: grantsUsed + 1,
          last_mode: mode,
          last_category: category,
          updated_at: now.toISOString(),
        })
        .eq("id", user.id),
      svc2.from("grantbot_sessions").insert({
        user_id: user.id,
        mode,
        org_description: orgDescription,
        category,
        grant_title: mode === "draft" ? grantTitle : null,
        funder: mode === "draft" ? funder || null : null,
        prompt_questions: mode === "draft" ? promptQuestions : null,
        result_text: result,
      }),
    ]);

    return NextResponse.json({
      result,
      usage: {
        used: grantsUsed + 1,
        limit: access.hasUnlimitedAccess ? null : limit,
        planLabel: access.planLabel,
        hasUnlimitedAccess: access.hasUnlimitedAccess,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
