import { NextRequest, NextResponse } from "next/server";
import type { DashboardField } from "@/components/sector3/Sector3ToolDashboard";
import type { Sector3ToolSlug } from "@/lib/sector3-registry";
import {
  assessPromptDetail,
  generateSector3ClarifyingQuestions,
} from "@/lib/sector3-tools/clarification-ai";
import { getSector3ToolHelpContent, isValidSector3HelpSlug } from "@/lib/sector3-tools/help-content";
import { getSector3BySlug } from "@/lib/sector3-registry";
import { getSector3ToolConfig } from "@/lib/sector3-tools/registry-fields";
import { createServerAuthClient } from "@/lib/supabase/server-auth";
import { getUserBillingState, userCanUseTool } from "@/lib/billing/entitlements";

export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const slug = params.slug;
  if (!isValidSector3HelpSlug(slug)) {
    return NextResponse.json({ error: "Unknown tool" }, { status: 404 });
  }

  const supabase = await createServerAuthClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const billingState = await getUserBillingState(user.id);
  if (!userCanUseTool(billingState, slug)) {
    return NextResponse.json({ error: "Tool access required" }, { status: 403 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    mode?: "assess" | "questions";
    values?: Record<string, string>;
    fields?: Array<{ id: string; label: string; required?: boolean }>;
  };

  const mode = body.mode ?? "assess";
  const fields = (body.fields ?? getSector3ToolConfig(slug)?.fields ?? []) as DashboardField[];
  const values = body.values ?? {};

  if (!fields.length) {
    return NextResponse.json({ error: "Tool fields not configured" }, { status: 400 });
  }

  const help = getSector3ToolHelpContent(slug);
  const entry = getSector3BySlug(slug as Parameters<typeof getSector3BySlug>[0]);
  const toolName = entry?.name ?? slug;

  try {
    if (mode === "assess") {
      const assessment = await assessPromptDetail(toolName, fields, values);
      return NextResponse.json(assessment);
    }

    const questions = await generateSector3ClarifyingQuestions(
      toolName,
      help?.summary ?? "",
      fields,
      values
    );
    return NextResponse.json({ questions });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Clarification failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
