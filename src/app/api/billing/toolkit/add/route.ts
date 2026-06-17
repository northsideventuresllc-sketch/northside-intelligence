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

/** @deprecated Use /api/billing/toolkit/add-free then /api/billing/toolkit/assign-unlimited */
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
    return NextResponse.json({ error: "Upgrade your NI plan to add tools" }, { status: 403 });
  }

  if (userOwnsTool(state, toolSlug)) {
    return NextResponse.json({ error: "Tool already in your Toolkit" }, { status: 400 });
  }

  if (!canAddNiPlanTool(state) && !tierHasUnlimitedToolAccess(state.niTier)) {
    return NextResponse.json({ error: "No tool slots remaining on your plan" }, { status: 403 });
  }

  await grantToolkitAccess({
    userId: user.id,
    toolSlug,
    accessType: tierHasUnlimitedToolAccess(state.niTier) ? "ni_plan" : "ni_plan",
    expiresAt: state.currentPeriodEnd,
  });

  return NextResponse.json({ ok: true, toolSlug });
}
