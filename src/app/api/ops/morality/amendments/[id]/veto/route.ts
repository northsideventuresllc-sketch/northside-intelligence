import { NextResponse } from "next/server";
import { requireOpsSession } from "@/lib/ops/guard";
import { chairVetoAsSoleSteward } from "@/lib/ops/morality";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const unauthorized = await requireOpsSession();
  if (unauthorized) return unauthorized;

  const { id } = await params;

  let body: { reason?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!body.reason?.trim()) {
    return NextResponse.json({ error: "reason is required" }, { status: 400 });
  }

  try {
    const { steward, result } = await chairVetoAsSoleSteward(id, body.reason);
    return NextResponse.json({ steward: steward.id, result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Veto failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
