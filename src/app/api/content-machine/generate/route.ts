import { NextRequest, NextResponse } from "next/server";
import { generateDailyBatch, generateSlotWithQualityGate } from "@/lib/content-machine/generator";
import { getDefaultThemeDayIndex } from "@/lib/content-machine/weekday-themes";
import { DEFAULT_BRAND_SLUG } from "@/lib/content-machine/constants";
import type { ContentPostType, ContentTargetGroup } from "@/lib/content-machine/types";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET?.trim();
  const authHeader = req.headers.get("authorization");
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await req.json().catch(() => ({}))) as {
      brandSlug?: string;
      dayIndex?: number;
      withImages?: boolean;
      single?: boolean;
      postType?: string;
      targetGroup?: string;
    };

    if (body.single && body.postType && body.targetGroup) {
      const result = await generateSlotWithQualityGate({
        brandSlug: body.brandSlug ?? DEFAULT_BRAND_SLUG,
        dayIndex: body.dayIndex ?? getDefaultThemeDayIndex(),
        postType: body.postType as ContentPostType,
        targetGroup: body.targetGroup as ContentTargetGroup,
      });
      return NextResponse.json({ ok: true, draft: result.draft, attempts: result.attempts });
    }

    const result = await generateDailyBatch({
      brandSlug: body.brandSlug ?? DEFAULT_BRAND_SLUG,
      dayIndex: body.dayIndex,
      withImages: body.withImages,
    });

    return NextResponse.json({
      ok: true,
      batchId: result.batchId,
      posts: result.posts,
    });
  } catch (err) {
    console.error("[api/content-machine/generate]", err);
    const message = err instanceof Error ? err.message : "Generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
