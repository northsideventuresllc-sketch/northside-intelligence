import { NextResponse } from "next/server";
import { requireOpsSession } from "@/lib/ops/guard";
import { chairVeto } from "@/lib/ops/morality";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const unauthorized = await requireOpsSession();
  if (unauthorized) return unauthorized;

  const { id } = await params;

  let body: { chair_id?: string; reason?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!body.chair_id || !body.reason?.trim()) {
    return NextResponse.json({ error: "chair_id and reason are required" }, { status: 400 });
  }

  try {
    const result = await chairVeto(id, body.chair_id, body.reason);
    return NextResponse.json({ result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Veto failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
