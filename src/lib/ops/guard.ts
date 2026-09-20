import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { OPS_COOKIE, verifyOpsSessionToken } from "@/lib/ops/session";

/** Self-guard for /api/ops/** routes — middleware only covers /ops page paths, not the API. */
export async function requireOpsSession(): Promise<NextResponse | null> {
  const token = (await cookies()).get(OPS_COOKIE)?.value;
  const valid = await verifyOpsSessionToken(token);
  return valid ? null : NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
