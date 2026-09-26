import { NextResponse } from "next/server";
import { requireOpsSession } from "@/lib/ops/guard";
import { listAmendments, listStewards } from "@/lib/ops/morality";

export async function GET() {
  const unauthorized = await requireOpsSession();
  if (unauthorized) return unauthorized;

  try {
    const [amendments, stewards] = await Promise.all([listAmendments(), listStewards()]);
    return NextResponse.json({ amendments, stewards });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load amendments";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
