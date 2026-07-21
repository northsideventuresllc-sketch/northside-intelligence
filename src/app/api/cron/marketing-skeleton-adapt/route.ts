import { NextRequest, NextResponse } from "next/server";
import { isCronAuthorizedAsync } from "@/lib/infra/cron-auth";
import { adaptSkeletons } from "@/lib/marketing-skeleton/adapt";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/** MKT-SKEL — weekly Monday adaptation: revenue-weighted angle scoring across all products. */
export async function GET(req: NextRequest) {
  if (!(await isCronAuthorizedAsync(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const results = await adaptSkeletons();
    return NextResponse.json({ ok: true, results });
  } catch (err) {
    console.error("[cron/marketing-skeleton-adapt]", err);
    const message = err instanceof Error ? err.message : "adapt failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
