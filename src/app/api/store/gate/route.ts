import { NextResponse } from "next/server";
import { ensureStoreEnv } from "@/lib/store/env";
import { getStoreGateStatus } from "@/lib/store/gate";

export const dynamic = "force-dynamic";

export async function GET() {
  await ensureStoreEnv();
  return NextResponse.json(getStoreGateStatus());
}
