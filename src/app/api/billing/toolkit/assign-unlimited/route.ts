import { NextRequest, NextResponse } from "next/server";
import {
  canAddNiPlanTool,
  getUserBillingState,
  grantToolkitAccess,
  userOwnsTool,
} from "@/lib/billing/entitlements";
import { INTELLIGENCE_TOOL_SLUGS } from "@/lib/billing/tool-pricing";
import { tierHasUnlimitedToolAccess } from "@/lib/billing/ni-tiers";
import { createServerAuthClient } from "@/lib/supabase/server-auth";

/** Assign an NI plan unlimited slot to a tool already in the Tool Case. */
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
    return NextResponse.json(
      { error: "Upgrade your NI plan to assign unlimited access" },
      { status: 403 }
    );
  }

  if (!userOwnsTool(state, toolSlug)) {
    return NextResponse.json(
      { error: "Add this tool to your Tool Case first" },
      { status: 400 }
    );
  }

  const entry = state.toolkit.find((t) => t.toolSlug === toolSlug);
  if (entry?.accessType === "ni_plan" || entry?.accessType === "lifetime") {
    return NextResponse.json({ error: "Tool already has unlimited access" }, { status: 400 });
  }
  if (entry?.accessType === "tool_subscription") {
    return NextResponse.json(
      { error: "This tool has its own subscription for unlimited access" },
      { status: 400 }
    );
  }

  if (!canAddNiPlanTool(state) && !tierHasUnlimitedToolAccess(state.niTier)) {
    return NextResponse.json(
      { error: "No unlimited tool slots remaining on your plan" },
      { status: 403 }
    );
  }

  await grantToolkitAccess({
    userId: user.id,
    toolSlug,
    accessType: "ni_plan",
    expiresAt: state.currentPeriodEnd,
  });

  return NextResponse.json({ ok: true, toolSlug, accessType: "ni_plan" });
}
