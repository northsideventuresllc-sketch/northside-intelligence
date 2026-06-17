import { NextRequest, NextResponse } from "next/server";
import {
  getUserBillingState,
  grantToolkitAccess,
  setLastUnlimitedSwapAt,
  userOwnsTool,
} from "@/lib/billing/entitlements";
import { INTELLIGENCE_TOOL_SLUGS } from "@/lib/billing/tool-pricing";
import { tierHasUnlimitedToolAccess } from "@/lib/billing/ni-tiers";
import { createServerAuthClient } from "@/lib/supabase/server-auth";

/** Swap which tool holds an NI plan unlimited slot (72h cooldown when at slot limit). */
export async function POST(req: NextRequest) {
  const supabase = await createServerAuthClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { fromToolSlug, toToolSlug } = (await req.json()) as {
    fromToolSlug?: string;
    toToolSlug?: string;
  };

  if (
    !fromToolSlug ||
    !toToolSlug ||
    !INTELLIGENCE_TOOL_SLUGS.includes(fromToolSlug) ||
    !INTELLIGENCE_TOOL_SLUGS.includes(toToolSlug)
  ) {
    return NextResponse.json({ error: "Invalid tool" }, { status: 400 });
  }

  if (fromToolSlug === toToolSlug) {
    return NextResponse.json({ error: "Choose a different tool to swap to" }, { status: 400 });
  }

  const state = await getUserBillingState(user.id);

  if (tierHasUnlimitedToolAccess(state.niTier) || state.isMasterAccount) {
    return NextResponse.json(
      { error: "Your plan includes unlimited access to all tools — no swap needed" },
      { status: 400 }
    );
  }

  if (!state.canSwapUnlimitedTool) {
    return NextResponse.json(
      {
        error: "You can swap unlimited tools again after the 72-hour cooldown",
        nextSwapAt: state.nextUnlimitedSwapAt,
      },
      { status: 403 }
    );
  }

  const fromEntry = state.toolkit.find((t) => t.toolSlug === fromToolSlug);
  if (!fromEntry || fromEntry.accessType !== "ni_plan") {
    return NextResponse.json(
      { error: "Source tool does not have an NI plan unlimited slot" },
      { status: 400 }
    );
  }

  if (!userOwnsTool(state, toToolSlug)) {
    return NextResponse.json(
      { error: "Add the destination tool to your Toolkit first" },
      { status: 400 }
    );
  }

  const toEntry = state.toolkit.find((t) => t.toolSlug === toToolSlug);
  if (toEntry?.accessType === "ni_plan" || toEntry?.accessType === "lifetime") {
    return NextResponse.json({ error: "Destination tool already has unlimited access" }, { status: 400 });
  }
  if (toEntry?.accessType === "tool_subscription") {
    return NextResponse.json(
      { error: "Destination tool has its own unlimited subscription" },
      { status: 400 }
    );
  }

  await grantToolkitAccess({
    userId: user.id,
    toolSlug: fromToolSlug,
    accessType: "free",
  });

  await grantToolkitAccess({
    userId: user.id,
    toolSlug: toToolSlug,
    accessType: "ni_plan",
    expiresAt: state.currentPeriodEnd,
  });

  await setLastUnlimitedSwapAt(user.id);

  return NextResponse.json({ ok: true, fromToolSlug, toToolSlug });
}
