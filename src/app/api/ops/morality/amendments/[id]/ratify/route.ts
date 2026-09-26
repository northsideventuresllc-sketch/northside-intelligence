import { NextResponse } from "next/server";
import { requireOpsSession } from "@/lib/ops/guard";
import { ratifyAsSoleSteward } from "@/lib/ops/morality";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const unauthorized = await requireOpsSession();
  if (unauthorized) return unauthorized;

  const { id } = await params;

  try {
    const { steward, result } = await ratifyAsSoleSteward(id);
    return NextResponse.json({ steward: steward.id, result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Ratify failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
