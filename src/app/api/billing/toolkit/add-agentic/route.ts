import { NextRequest, NextResponse } from "next/server";
import {
  canAddNiPlanAgenticTool,
  getUserBillingState,
  grantToolkitAccess,
  userOwnsTool,
} from "@/lib/billing/entitlements";
import { INTELLIGENCE_TOOL_SLUGS } from "@/lib/billing/tool-pricing";
import { createServerAuthClient } from "@/lib/supabase/server-auth";

/**
 * Assign an agentic slot to a tool.
 * An agentic slot covers BOTH SaaS and agentic access for that tool —
 * it does NOT consume one of the user's SaaS slots.
 */
export async function POST(req: NextRequest) {
  const supabase = await createServerAuthClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { toolSlug } = (await req.json()) as { toolSlug?: string };
  if (!toolSlug || !INTELLIGENCE_TOOL_SLUGS.includes(toolSlug)) {
    return NextResponse.json({ error: "Invalid tool" }, { status: 400 });
  }

  const state = await getUserBillingState(user.id);
  if (state.niTier === "free") {
    return NextResponse.json({ error: "Upgrade your NI plan to add agentic tools" }, { status: 403 });
  }

  if (userOwnsTool(state, toolSlug)) {
    return NextResponse.json({ error: "Tool already in your Toolkit" }, { status: 400 });
  }

  if (!canAddNiPlanAgenticTool(state)) {
    return NextResponse.json({ error: "No agentic slots remaining on your plan" }, { status: 403 });
  }

  await grantToolkitAccess({
    userId: user.id,
    toolSlug,
    accessType: "ni_plan_agentic",
    expiresAt: state.currentPeriodEnd,
  });

  return NextResponse.json({ ok: true, toolSlug, accessType: "ni_plan_agentic" });
}
