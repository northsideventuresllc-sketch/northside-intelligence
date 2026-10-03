import { NextRequest, NextResponse } from "next/server";
import { billingStripe, ensureBillingEnvHydrated } from "@/lib/billing/stripe";
import { createServerAuthClient } from "@/lib/supabase/server-auth";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    await ensureBillingEnvHydrated();
    const supabase = await createServerAuthClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const body = await req.json();
    const toolSlug = typeof body.toolSlug === "string" ? body.toolSlug.trim() : null;

    if (!toolSlug) {
      return NextResponse.json({ error: "toolSlug is required." }, { status: 400 });
    }

    const service = createServiceClient();

    // 1. Check toolkit for active tool subscription
    const { data: toolkitEntry } = await service
      .from("ni_toolkit")
      .select("id, stripe_subscription_id, access_type")
      .eq("user_id", user.id)
      .eq("tool_slug", toolSlug)
      .maybeSingle();

    // 2. If there is a Stripe subscription on the toolkit entry, cancel it at period end
    if (toolkitEntry?.stripe_subscription_id) {
      try {
        await billingStripe.subscriptions.update(toolkitEntry.stripe_subscription_id, {
          cancel_at_period_end: true,
        });
      } catch (stripeErr) {
        console.warn("Stripe cancel error (continuing downgrade):", stripeErr);
      }
    }

    // 3. Update the specific tool profile to free tier
    const profileTable = `${toolSlug}_profiles`;
    await service
      .from(profileTable)
      .update({
        tier: "free",
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    // 4. Update toolkit row to free access type
    if (toolkitEntry) {
      await service
        .from("ni_toolkit")
        .update({
          access_type: "free",
          stripe_subscription_id: null,
          expires_at: null,
        })
        .eq("id", toolkitEntry.id);
    }

    return NextResponse.json({
      success: true,
      message: `Successfully downgraded ${toolSlug} to Free tier. Your access will remain active until the end of your current billing period.`,
      toolSlug,
      newTier: "free",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to downgrade tool.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
