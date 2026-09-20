import { NextResponse } from "next/server";
import { requireOpsSession } from "@/lib/ops/guard";
import { castVote } from "@/lib/ops/morality";

const VALID_VOTES = new Set(["approve", "deny", "abstain"]);

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const unauthorized = await requireOpsSession();
  if (unauthorized) return unauthorized;

  const { id } = await params;

  let body: { steward_id?: string; vote?: string; note?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!body.steward_id || !body.vote || !VALID_VOTES.has(body.vote)) {
    return NextResponse.json(
      { error: "steward_id and a valid vote (approve|deny|abstain) are required" },
      { status: 400 }
    );
  }

  try {
    const result = await castVote(
      id,
      body.steward_id,
      body.vote as "approve" | "deny" | "abstain",
      body.note
    );
    return NextResponse.json({ result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Vote failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
