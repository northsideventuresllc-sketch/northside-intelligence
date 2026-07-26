import { NextResponse } from "next/server";
import { loadUsageTower, setBrake } from "@/lib/axon/usage-tower";
import { requireAxonOperatorId } from "@/lib/axon/operator";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireAxonOperatorId();
    return NextResponse.json(await loadUsageTower());
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not load usage.";
    return NextResponse.json(
      { error: message },
      { status: message === "AXON access denied" ? 401 : 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    await requireAxonOperatorId();
    const body = (await req.json()) as { scope?: string; enabled?: boolean };
    if (!body.scope || typeof body.enabled !== "boolean") {
      return NextResponse.json({ error: "Missing scope or setting." }, { status: 400 });
    }
    await setBrake(body.scope, body.enabled);
    return NextResponse.json({
      ok: true,
      message: body.enabled ? "Switched on." : "Stopped.",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not change it.";
    return NextResponse.json(
      { error: message },
      { status: message === "AXON access denied" ? 401 : 500 },
    );
  }
}
