import { NextRequest, NextResponse } from "next/server";
import { isCronAuthorized } from "@/lib/infra/cron-auth";
import {
  createAutomatedPromoCampaign,
  sendPromoEmailCampaign,
} from "@/lib/promos/email-campaigns";
import { isAutoPromoEnabled } from "@/lib/promos/types";
import { createServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(req: NextRequest) {
  if (!isCronAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const admin = createServiceClient();

    // Send any scheduled campaigns first
    const { data: scheduled } = await admin
      .from("ni_promo_email_campaigns")
      .select("id")
      .eq("status", "scheduled")
      .lte("scheduled_at", new Date().toISOString());

    const sendResults = [];
    for (const campaign of scheduled ?? []) {
      sendResults.push({
        campaignId: campaign.id,
        ...(await sendPromoEmailCampaign(campaign.id)),
      });
    }

    // Create and immediately send a new automated campaign if none were scheduled.
    // Disabled (Workstream 7): no new AUTOMATIC promo campaigns while
    // AUTO_PROMOS_ENABLED is not true. Manually scheduled campaigns above
    // still send, since those are JB's explicit sends, not auto promos.
    let newCampaignId: string | null = null;
    let newCampaignResult = null;
    if (!scheduled?.length && isAutoPromoEnabled()) {
      newCampaignId = await createAutomatedPromoCampaign();
      if (newCampaignId) {
        newCampaignResult = await sendPromoEmailCampaign(newCampaignId);
      }
    }

    return NextResponse.json({
      ok: true,
      sentScheduled: sendResults,
      newCampaignId,
      newCampaignResult,
    });
  } catch (err) {
    console.error("[cron/promo-emails]", err);
    return NextResponse.json({ error: "Promo email send failed" }, { status: 500 });
  }
}
