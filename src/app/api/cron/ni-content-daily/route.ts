import { NextRequest, NextResponse } from "next/server";
import { isCronAuthorizedAsync } from "@/lib/infra/cron-auth";
import { generateDailyBatch } from "@/lib/content-machine/generator";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * NIP-CONTENT-ENGINE — daily NI batch, the NI-side mirror of the Match Fit
 * content machine. Same generator, same free-tier Gemini path, same quality
 * gate; only the brand profile differs.
 */
export async function GET(req: NextRequest) {
  if (!(await isCronAuthorizedAsync(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const withImages = req.nextUrl.searchParams.get("images") === "1";
    const result = await generateDailyBatch({ brandSlug: "ni", withImages });
    return NextResponse.json({
      ok: true,
      batchId: result.batchId,
      postCount: result.posts.length,
      status: "pending_approval",
    });
  } catch (err) {
    console.error("[cron/ni-content-daily]", err);
    const message = err instanceof Error ? err.message : "NI daily batch failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
