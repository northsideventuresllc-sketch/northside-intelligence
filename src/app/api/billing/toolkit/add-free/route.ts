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
  if (userOwnsTool(state, toolSlug)) {
    return NextResponse.json({ error: "Tool already in your Toolkit" }, { status: 400 });
  }

  await grantToolkitAccess({
    userId: user.id,
    toolSlug,
    accessType: "free",
  });

  return NextResponse.json({ ok: true, toolSlug, accessType: "free" });
}
