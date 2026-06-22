import { NextRequest, NextResponse } from "next/server";
import { draftGrantApplication, searchGrantListings } from "@/lib/grantbot/ai";
import { getGrantBotAccess } from "@/lib/grantbot/access";
import { serializeGrantListings } from "@/lib/grantbot/listings";
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

type GrantBotMode = "search" | "draft";

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

    const usageCheck = await checkUsageAndIncrement(user.id, user.email);
    if (!usageCheck.ok) {
      return NextResponse.json({ error: usageCheck.error }, { status: usageCheck.status });
    }

    const { access, grantsUsed, now, svc } = usageCheck;

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

    if (mode === "search") {
      const grants = await searchGrantListings(category, orgDescription);
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
        orgDescription,
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
