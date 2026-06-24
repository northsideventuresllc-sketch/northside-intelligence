import { NextRequest, NextResponse } from "next/server";
import {
  createAutomatedPromoCampaign,
  sendPromoEmailCampaign,
} from "@/lib/promos/email-campaigns";
import { createServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET?.trim();

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
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

    // Create and immediately send a new automated campaign if none were scheduled
    let newCampaignId: string | null = null;
    let newCampaignResult = null;
    if (!scheduled?.length) {
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
