import { NextResponse } from "next/server";
import { requireOpsSession } from "@/lib/ops/guard";
import { ratifyAmendment } from "@/lib/ops/morality";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const unauthorized = await requireOpsSession();
  if (unauthorized) return unauthorized;

  const { id } = await params;

  let body: { ratifier_id?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!body.ratifier_id) {
    return NextResponse.json({ error: "ratifier_id is required" }, { status: 400 });
  }

  try {
    const result = await ratifyAmendment(id, body.ratifier_id);
    return NextResponse.json({ result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Ratify failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
