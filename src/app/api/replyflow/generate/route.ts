import { NextRequest, NextResponse } from "next/server";
import { getReplyFlowAccess } from "@/lib/billing/replyflow-access";
import { getUserBillingState, userCanUseTool } from "@/lib/billing/entitlements";
import { generateCalibratedReplySuite } from "@/lib/replyflow/ai";
import { type ReplyTone } from "@/lib/replyflow/tone";
import { extractStyleDiffLearnings, persistStylePreference } from "@/lib/replyflow/learning";
import { createServerAuthClient } from "@/lib/supabase/server-auth";
import { createServiceClient } from "@/lib/supabase/server";

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
    if (!userCanUseTool(billingState, "replyflow")) {
      return NextResponse.json(
        { error: "Add ReplyFlow to your Toolkit before using it", code: "TOOL_NOT_IN_CASE" },
        { status: 403 }
      );
    }

    const access = await getReplyFlowAccess(user.id);

    const { data: profile, error: profileError } = await supabase
      .from("replyflow_profiles")
      .select("replies_used_this_month, replies_reset_at")
      .eq("id", user.id)
      .single();
    if (profileError || !profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const limit = access.repliesLimit;
    const resetAt = new Date(profile.replies_reset_at || new Date().toISOString());
    const now = new Date();
    const monthsSince =
      (now.getFullYear() - resetAt.getFullYear()) * 12 + (now.getMonth() - resetAt.getMonth());
    let repliesUsed = profile.replies_used_this_month || 0;

    if (monthsSince >= 1) {
      repliesUsed = 0;
      const svc = createServiceClient();
      await svc
        .from("replyflow_profiles")
        .update({ replies_used_this_month: 0, replies_reset_at: now.toISOString() })
        .eq("id", user.id);
    }

    if (!access.hasUnlimitedAccess && repliesUsed >= limit) {
      return NextResponse.json(
        { error: `Reply limit reached (${limit}/month on ${access.planLabel}). Upgrade for unlimited calibrated replies and company policy memory.` },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { message, tone, scenario, policyContext, editedReply, priorGeneratedReply, customInstructions } = body;

    // Background edit diff learning trigger if user edited a previous response
    if (typeof editedReply === "string" && typeof priorGeneratedReply === "string" && editedReply !== priorGeneratedReply) {
      const diffLearnings = extractStyleDiffLearnings({
        generatedReply: priorGeneratedReply,
        editedReply,
      });
      // Non-blocking fire and forget
      persistStylePreference(user.id, diffLearnings).catch(() => {});
    }

    if (!message) {
      return NextResponse.json({ error: "Customer message is required" }, { status: 400 });
    }

    const validTone: ReplyTone = (tone as ReplyTone) || "empathetic";
    const validScenario = typeof scenario === "string" ? scenario.trim() : "General Customer Inquiry";

    // Fetch user's learned style preferences if on SaaS or higher
    let userStylePreferences = undefined;
    if (access.hasUnlimitedAccess || !access.planLabel.toLowerCase().includes("free")) {
      const svc = createServiceClient();
      const { data: learningProfile } = await svc
        .from("replyflow_learning_profiles")
        .select("preferences")
        .eq("user_id", user.id)
        .maybeSingle();
      if (learningProfile?.preferences) {
        userStylePreferences = learningProfile.preferences;
      }
    }

    const suite = await generateCalibratedReplySuite({
      customerMessage: message,
      tone: validTone,
      scenario: validScenario,
      policyContext: typeof policyContext === "object" ? policyContext : undefined,
      stylePreferences: userStylePreferences,
      customInstructions: typeof customInstructions === "string" ? customInstructions.trim() : undefined,
    });

    const shouldSaveMemory = access.hasUnlimitedAccess || !access.planLabel.toLowerCase().includes("free");
    const svc = createServiceClient();

    await Promise.all([
      svc
        .from("replyflow_profiles")
        .update({
          replies_used_this_month: repliesUsed + 1,
          last_tone: validTone,
          last_scenario: validScenario,
          updated_at: now.toISOString(),
        })
        .eq("id", user.id),
      shouldSaveMemory
        ? svc.from("replyflow_replies").insert({
            user_id: user.id,
            customer_message: message,
            tone: validTone,
            scenario: validScenario,
            generated_reply: suite.primaryReply,
          })
        : Promise.resolve(),
    ]);

    return NextResponse.json({
      reply: suite.primaryReply,
      suite,
      usage: {
        used: repliesUsed + 1,
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
