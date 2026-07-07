import { NextRequest, NextResponse } from "next/server";
import { isCronAuthorizedAsync } from "@/lib/infra/cron-auth";
import { hydratePlatformEnvFromDatabase } from "@/lib/hydrate-platform-env";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  await hydratePlatformEnvFromDatabase();

  if (!(await isCronAuthorizedAsync(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json(
      { error: "Missing Supabase configuration" },
      { status: 500 }
    );
  }

  const res = await fetch(`${supabaseUrl}/functions/v1/generate-tool`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ source: "vercel_cron" }),
  });

  const data: unknown = await res.json().catch(() => ({
    error: "Invalid JSON from generate-tool",
  }));

  if (!res.ok) {
    return NextResponse.json(data, { status: res.status });
  }

  return NextResponse.json(data);
}
