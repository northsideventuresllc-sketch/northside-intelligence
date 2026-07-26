import { NextResponse } from "next/server";
import {
  listOpportunities,
  setOpportunityStatus,
  updateDraft,
  ensureDisclosure,
} from "@/lib/axon/reddit-machine";
import { requireAxonOperatorId } from "@/lib/axon/operator";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireAxonOperatorId();
    return NextResponse.json({ items: await listOpportunities() });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not load.";
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
      action?: "approve" | "reject" | "edit";
      id?: string;
      draft?: string;
    };
    if (!body.id) return NextResponse.json({ error: "Missing id." }, { status: 400 });

    if (body.action === "approve") {
      // Approving queues it for JB to post. Nothing here sends to Reddit.
      await setOpportunityStatus(body.id, "approved");
      return NextResponse.json({ ok: true, message: "Approved — ready for you to post." });
    }
    if (body.action === "reject") {
      await setOpportunityStatus(body.id, "rejected");
      return NextResponse.json({ ok: true, message: "Binned." });
    }
    if (body.action === "edit") {
      if (!body.draft?.trim()) {
        return NextResponse.json({ error: "Comment cannot be empty." }, { status: 400 });
      }
      await updateDraft(body.id, ensureDisclosure(body.draft));
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
