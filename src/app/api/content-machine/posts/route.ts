import { NextRequest, NextResponse } from "next/server";
import { getPendingBatch, getScheduledPosts } from "@/lib/content-machine/db";
import { approveBatch, scheduleApprovedBatch } from "@/lib/content-machine/schedule";
import { DEFAULT_BRAND_SLUG } from "@/lib/content-machine/constants";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const brandSlug = req.nextUrl.searchParams.get("brand") ?? DEFAULT_BRAND_SLUG;
  const view = req.nextUrl.searchParams.get("view") ?? "pending";

  try {
    if (view === "scheduled") {
      const posts = await getScheduledPosts(brandSlug);
      return NextResponse.json({ ok: true, posts });
    }
    const posts = await getPendingBatch(brandSlug);
    return NextResponse.json({ ok: true, posts });
  } catch (err) {
    console.error("[api/content-machine/posts GET]", err);
    return NextResponse.json({ error: "Failed to load posts" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET?.trim();
  const authHeader = req.headers.get("authorization");
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await req.json()) as {
      action: "approve_batch" | "schedule_batch";
      batchId: string;
    };

    if (body.action === "approve_batch") {
      const posts = await approveBatch(body.batchId);
      return NextResponse.json({ ok: true, posts });
    }

    if (body.action === "schedule_batch") {
      const posts = await scheduleApprovedBatch(body.batchId);
      return NextResponse.json({ ok: true, posts });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err) {
    console.error("[api/content-machine/posts POST]", err);
    return NextResponse.json({ error: "Action failed" }, { status: 500 });
  }
}
