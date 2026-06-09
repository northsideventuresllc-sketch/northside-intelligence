import { NextRequest, NextResponse } from "next/server";
import { mapDbPricing } from "@/lib/billing/tool-pricing";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("slug");
  const supabase = createServiceClient();

  if (slug) {
    const { data, error } = await supabase
      .from("ni_tool_pricing")
      .select("*")
      .eq("tool_slug", slug)
      .maybeSingle();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data) return NextResponse.json({ error: "Tool not found" }, { status: 404 });
    return NextResponse.json({ pricing: mapDbPricing(data) });
  }

  const { data, error } = await supabase.from("ni_tool_pricing").select("*").order("tool_slug");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ pricing: (data ?? []).map(mapDbPricing) });
}
