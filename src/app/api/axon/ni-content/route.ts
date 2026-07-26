import { NextResponse } from "next/server";
import { generateDailyBatch } from "@/lib/content-machine/generator";
import {
  listNiPosts,
  setNiPostStatus,
  updateNiPostCaption,
  NI_BRAND_SLUG,
} from "@/lib/content-machine/ni-content";
import { requireAxonOperatorId } from "@/lib/axon/operator";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET() {
  try {
    await requireAxonOperatorId();
    return NextResponse.json({ posts: await listNiPosts() });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not load NI content.";
    return NextResponse.json(
      { error: message },
      { status: message === "AXON access denied" ? 401 : 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    await requireAxonOperatorId();
    const body = (await req.json()) as {
      action?: "generate" | "approve" | "reject" | "edit";
      id?: string;
      caption?: string;
    };

    if (body.action === "generate") {
      const result = await generateDailyBatch({ brandSlug: NI_BRAND_SLUG });
      return NextResponse.json({
        ok: true,
        postCount: result.posts.length,
        message: `${result.posts.length} new NI posts drafted.`,
      });
    }

    if (!body.id) return NextResponse.json({ error: "Missing post id." }, { status: 400 });

    if (body.action === "approve") {
      await setNiPostStatus(body.id, "approved");
      return NextResponse.json({ ok: true, message: "Approved." });
    }

    if (body.action === "reject") {
      await setNiPostStatus(body.id, "rejected");
      return NextResponse.json({ ok: true, message: "Rejected." });
    }

    if (body.action === "edit") {
      if (!body.caption?.trim()) {
        return NextResponse.json({ error: "Caption cannot be empty." }, { status: 400 });
      }
      await updateNiPostCaption(body.id, body.caption.trim());
      return NextResponse.json({ ok: true, message: "Saved." });
    }

    return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Action failed.";
    return NextResponse.json(
      { error: message },
      { status: message === "AXON access denied" ? 401 : 500 },
    );
  }
}
