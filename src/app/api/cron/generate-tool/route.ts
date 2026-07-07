import { NextRequest, NextResponse } from "next/server";
import { isCronAuthorizedAsync } from "@/lib/infra/cron-auth";
import { hydratePlatformEnvFromDatabase } from "@/lib/hydrate-platform-env";
import { resolveServiceRoleKey } from "@/lib/platform-secrets";

export const dynamic = "force-dynamic";

async function parseEdgeFunctionResponse(res: Response, label: string) {
  const text = await res.text();
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return {
      error: `Invalid JSON from ${label}`,
      detail: text.slice(0, 500),
    };
  }
}

export async function GET(req: NextRequest) {
  await hydratePlatformEnvFromDatabase();

  if (!(await isCronAuthorizedAsync(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = await resolveServiceRoleKey();

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

  const data = await parseEdgeFunctionResponse(res, "generate-tool");

  if (!res.ok) {
    return NextResponse.json(data, { status: res.status });
  }

  return NextResponse.json(data);
}
