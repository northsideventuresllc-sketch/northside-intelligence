import { NextResponse } from "next/server";
import { clearChatHistory, deleteChatMessages } from "@/lib/axon/axon-profile";
import { requireAxonOperatorId } from "@/lib/axon/operator";

export const dynamic = "force-dynamic";

/** NIP-AXON-CHAT-UX — delete one message, a selection, or start fresh. */
export async function DELETE(req: Request) {
  try {
    const operatorId = await requireAxonOperatorId();
    const body = (await req.json().catch(() => ({}))) as { ids?: string[]; all?: boolean };

    if (body.all) {
      await clearChatHistory(operatorId);
      return NextResponse.json({ ok: true, message: "Started a fresh chat." });
    }

    const removed = await deleteChatMessages(body.ids ?? [], operatorId);
    if (!removed) return NextResponse.json({ error: "Nothing selected." }, { status: 400 });
    return NextResponse.json({
      ok: true,
      removed,
      message: `Deleted ${removed} message${removed === 1 ? "" : "s"}.`,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not delete.";
    return NextResponse.json(
      { error: message },
      { status: message === "AXON access denied" ? 401 : 500 },
    );
  }
}
