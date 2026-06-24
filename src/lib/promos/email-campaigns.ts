import "server-only";

import { buildNiEmailHtml, sendNoreplyEmail } from "@/lib/email/noreply";
import { createServiceClient } from "@/lib/supabase/server";

export type CampaignType =
  | "weekly_promo"
  | "product_launch"
  | "store_deal"
  | "announcement"
  | "promo_expiring"
  | "manual";

interface CampaignMetrics {
  sent: number;
  conversions: number;
  revenueCents: number;
  openRate?: number;
  clickRate?: number;
}

/** Load campaign performance scores to inform future campaign type selection. */
export async function getCampaignTypeScores(): Promise<Record<CampaignType, number>> {
  const admin = createServiceClient();
  const defaults: Record<CampaignType, number> = {
    weekly_promo: 1,
    product_launch: 1,
    store_deal: 1,
    announcement: 0.8,
    promo_expiring: 1.2,
    manual: 1,
  };

  const { data: events } = await admin
    .from("ni_promo_email_events")
    .select("event_type, revenue_cents, campaign_id")
    .gte("created_at", new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString());

  const campaignIds = Array.from(
    new Set((events ?? []).map((e) => e.campaign_id).filter(Boolean))
  ) as string[];
  const campaignTypeMap = new Map<string, string>();

  if (campaignIds.length > 0) {
    const { data: campaigns } = await admin
      .from("ni_promo_email_campaigns")
      .select("id, campaign_type")
      .in("id", campaignIds as string[]);

    for (const c of campaigns ?? []) {
      campaignTypeMap.set(String(c.id), String(c.campaign_type));
    }
  }

  const scores: Record<string, { sent: number; revenue: number }> = {};

  for (const event of events ?? []) {
    const type = event.campaign_id
      ? (campaignTypeMap.get(String(event.campaign_id)) ?? "weekly_promo")
      : "weekly_promo";
    if (!scores[type]) scores[type] = { sent: 0, revenue: 0 };
    if (event.event_type === "sent") scores[type].sent++;
    if (event.event_type === "conversion") {
      scores[type].revenue += Number(event.revenue_cents ?? 0);
    }
  }

  const result = { ...defaults };
  for (const [type, stats] of Object.entries(scores)) {
    if (stats.sent > 0) {
      const revenuePerSend = stats.revenue / stats.sent;
      result[type as CampaignType] = Math.max(0.5, 1 + revenuePerSend / 10000);
    }
  }

  return result;
}

/** Pick the best-performing campaign type for automated sends. */
export async function pickOptimalCampaignType(): Promise<CampaignType> {
  const scores = await getCampaignTypeScores();
  const types = Object.keys(scores) as CampaignType[];
  const total = types.reduce((sum, t) => sum + scores[t], 0);
  let roll = Math.random() * total;

  for (const type of types) {
    roll -= scores[type];
    if (roll <= 0) return type;
  }

  return "weekly_promo";
}

export async function sendPromoEmailCampaign(campaignId: string): Promise<{
  sent: number;
  errors: number;
}> {
  const admin = createServiceClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.northsideintelligence.com";

  const { data: campaign } = await admin
    .from("ni_promo_email_campaigns")
    .select("*")
    .eq("id", campaignId)
    .maybeSingle();

  if (!campaign || campaign.status === "sent" || campaign.status === "cancelled") {
    return { sent: 0, errors: 0 };
  }

  await admin
    .from("ni_promo_email_campaigns")
    .update({ status: "sending", updated_at: new Date().toISOString() })
    .eq("id", campaignId);

  // Target: email list subscribers; segment filtering is backend-only
  let query = admin
    .from("ni_portal_profiles")
    .select("id, email, full_name")
    .eq("email_list_subscribed", true);

  if (campaign.segment_slugs?.length) {
    const { data: segmentIds } = await admin
      .from("ni_promo_segments")
      .select("id")
      .in("slug", campaign.segment_slugs);

    const ids = (segmentIds ?? []).map((s) => s.id);
    if (ids.length > 0) {
      const { data: assignments } = await admin
        .from("ni_user_segment_assignments")
        .select("user_id")
        .in("segment_id", ids);

      const userIds = Array.from(new Set((assignments ?? []).map((a) => a.user_id)));
      if (userIds.length === 0) {
        await admin
          .from("ni_promo_email_campaigns")
          .update({ status: "sent", sent_at: new Date().toISOString() })
          .eq("id", campaignId);
        return { sent: 0, errors: 0 };
      }
      query = query.in("id", userIds);
    }
  }

  const { data: recipients } = await query;
  let sent = 0;
  let errors = 0;

  for (const recipient of recipients ?? []) {
    if (!recipient.email) continue;

    const html =
      campaign.body_html ||
      buildNiEmailHtml({
        title: campaign.subject,
        body: "Check out your latest offers on Northside Intelligence.",
        ctaLabel: "View Promos",
        ctaHref: `${appUrl}/promos`,
      });

    const result = await sendNoreplyEmail({
      to: recipient.email,
      subject: campaign.subject,
      html,
      idempotencyKey: `campaign/${campaignId}/${recipient.id}`,
    });

    if (result.error) {
      errors++;
    } else {
      sent++;
      await admin.from("ni_promo_email_events").insert({
        campaign_id: campaignId,
        user_id: recipient.id,
        event_type: "sent",
        metadata: {},
      });
    }
  }

  const metrics: CampaignMetrics = {
    sent,
    conversions: 0,
    revenueCents: 0,
  };

  await admin
    .from("ni_promo_email_campaigns")
    .update({
      status: "sent",
      sent_at: new Date().toISOString(),
      metrics,
      updated_at: new Date().toISOString(),
    })
    .eq("id", campaignId);

  return { sent, errors };
}

/** Create and queue an automated promo email campaign. */
export async function createAutomatedPromoCampaign(): Promise<string | null> {
  const admin = createServiceClient();
  const campaignType = await pickOptimalCampaignType();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.northsideintelligence.com";

  const templates: Record<CampaignType, { subject: string; body: string }> = {
    weekly_promo: {
      subject: "Your Weekly NI Deals Are Here",
      body: "Fresh promos have been added to your account. Log in to see what is available this week.",
    },
    product_launch: {
      subject: "New NI Tool Launch — Early Access Inside",
      body: "We just launched something new on Northside Intelligence. Be among the first to try it.",
    },
    store_deal: {
      subject: "Smart Store Deal — Limited Time",
      body: "Exclusive Smart Store savings are waiting in your promo wallet.",
    },
    announcement: {
      subject: "Important Update from Northside Intelligence",
      body: "We have news to share about the NI platform and your tools.",
    },
    promo_expiring: {
      subject: "Your Promos Expire Soon",
      body: "Some of your active promos are about to expire. Claim them before they are gone.",
    },
    manual: {
      subject: "Special Offer from Northside Intelligence",
      body: "A special offer is available on your account.",
    },
  };

  const template = templates[campaignType];

  const { data, error } = await admin
    .from("ni_promo_email_campaigns")
    .insert({
      campaign_type: campaignType,
      subject: template.subject,
      body_html: buildNiEmailHtml({
        title: template.subject,
        body: template.body,
        ctaLabel: "View Promos",
        ctaHref: `${appUrl}/promos`,
      }),
      status: "scheduled",
      scheduled_at: new Date().toISOString(),
      segment_slugs: [],
    })
    .select("id")
    .single();

  if (error || !data) return null;
  return data.id;
}

/** Record a conversion event for self-learning (call from checkout webhooks). */
export async function recordPromoConversion(
  userId: string,
  revenueCents: number,
  metadata: Record<string, unknown> = {}
): Promise<void> {
  const admin = createServiceClient();

  const { data: recentSent } = await admin
    .from("ni_promo_email_events")
    .select("campaign_id")
    .eq("user_id", userId)
    .eq("event_type", "sent")
    .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  await admin.from("ni_promo_email_events").insert({
    campaign_id: recentSent?.campaign_id ?? null,
    user_id: userId,
    event_type: "conversion",
    revenue_cents: revenueCents,
    metadata,
  });
}
