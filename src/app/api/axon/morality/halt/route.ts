import { NextResponse } from "next/server";
import { requireAxonMasterOperatorId } from "@/lib/axon/operator";
import {
  clearGlobalHalt,
  declareGlobalHalt,
  getGlobalHaltStatus,
} from "@/lib/axon/morality-trust";

export async function GET() {
  try {
    await requireAxonMasterOperatorId();
    const status = await getGlobalHaltStatus();
    return NextResponse.json({ status });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to read halt status";
    const status = message === "AXON access denied" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(req: Request) {
  try {
    const operatorId = await requireAxonMasterOperatorId();
    const { action, reason } = await req.json();

    if (action !== "halt" && action !== "clear") {
      return NextResponse.json({ error: "action must be 'halt' or 'clear'" }, { status: 400 });
    }
    const trimmedReason = typeof reason === "string" ? reason.trim() : "";
    if (!trimmedReason) {
      return NextResponse.json({ error: "reason is required" }, { status: 400 });
    }

    if (action === "halt") {
      await declareGlobalHalt(operatorId, trimmedReason);
    } else {
      await clearGlobalHalt(operatorId, trimmedReason);
    }

    const status = await getGlobalHaltStatus();
    return NextResponse.json({ ok: true, status });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Halt action failed";
    const status = message === "AXON access denied" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
