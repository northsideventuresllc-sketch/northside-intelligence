import { NextRequest, NextResponse } from "next/server";
import { auditCompetitorGaps, type CompetitorGapAudit } from "@/lib/gapscan/crawler";
import { generateBuildSpec } from "@/lib/gapscan/build-spec";
import { getUserBillingState, userCanUseTool } from "@/lib/billing/entitlements";
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
    if (!userCanUseTool(billingState, "gapscan")) {
      return NextResponse.json(
        { error: "Add GapScan to your Toolkit to run competitive gap analysis." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const nicheSector = typeof body.nicheSector === "string" ? body.nicheSector.trim() : "B2B SaaS";
    const targetAudience = typeof body.targetAudience === "string" ? body.targetAudience.trim() : "Founders & Developers";
    const competitorUrls: string[] = Array.isArray(body.competitorUrls)
      ? body.competitorUrls.map(String).filter(Boolean)
      : typeof body.competitorUrls === "string"
      ? body.competitorUrls.split(",").map((s: string) => s.trim()).filter(Boolean)
      : ["competitor.com"];

    // Check plan tier for depth (Free = surface scan; SaaS/Agentic = deep_dive)
    const isFree = billingState.niTier.toLowerCase().includes("free");
    const scanDepth = isFree ? "surface" : "deep_dive";

    // Enforce competitor scan limit (Free = max 3; Paid = max 10)
    const allowedUrls = isFree ? competitorUrls.slice(0, 3) : competitorUrls.slice(0, 10);

    const audits: CompetitorGapAudit[] = await Promise.all(
      allowedUrls.map((url) => auditCompetitorGaps({ competitorUrl: url, nicheSector, scanDepth }))
    );

    const buildSpec = generateBuildSpec({
      nicheSector,
      audits,
      targetAudience,
    });

    // Save report in Supabase
    try {
      const svc = createServiceClient();
      await svc.from("gapscan_reports").insert({
        user_id: user.id,
        niche_sector: nicheSector,
        competitors_scanned: allowedUrls,
        scan_depth: scanDepth,
        build_spec_markdown: buildSpec.markdownDoc,
        created_at: new Date().toISOString(),
      });
    } catch {}

    return NextResponse.json({
      nicheSector,
      scanDepth,
      audits,
      buildSpec,
      tier: billingState.niTier,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
