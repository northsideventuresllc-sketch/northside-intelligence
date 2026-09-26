import { NextResponse } from "next/server";
import { requireOpsSession } from "@/lib/ops/guard";
import { castVoteAsSoleSteward } from "@/lib/ops/morality";

const VALID_VOTES = new Set(["approve", "deny", "abstain"]);

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const unauthorized = await requireOpsSession();
  if (unauthorized) return unauthorized;

  const { id } = await params;

  let body: { vote?: string; note?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!body.vote || !VALID_VOTES.has(body.vote)) {
    return NextResponse.json(
      { error: "vote must be one of approve|deny|abstain" },
      { status: 400 }
    );
  }

  try {
    const { steward, result } = await castVoteAsSoleSteward(
      id,
      body.vote as "approve" | "deny" | "abstain",
      body.note
    );
    return NextResponse.json({ steward: steward.id, result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Vote failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
