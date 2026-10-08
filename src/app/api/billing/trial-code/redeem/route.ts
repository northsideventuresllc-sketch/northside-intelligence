import { NextRequest, NextResponse } from "next/server";
import { redeemTrialCode } from "@/lib/billing/trial-codes";
import { createServerAuthClient } from "@/lib/supabase/server-auth";

interface RedeemRequestBody {
  code?: string;
  toolSlug?: string;
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerAuthClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Authentication required to redeem trial code. Please sign in or create an account." },
        { status: 401 }
      );
    }

    const body = (await req.json().catch(() => ({}))) as RedeemRequestBody;
    const code = body.code?.trim();
    const toolSlug = body.toolSlug?.trim().toLowerCase();

    if (!code) {
      return NextResponse.json(
        { error: "Please enter an alphanumeric access code." },
        { status: 400 }
      );
    }

    const result = await redeemTrialCode(code, user.id, toolSlug);

    if (!result.success) {
      return NextResponse.json({ error: result.error || "Failed to redeem code." }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: "7-Day Free Trial activated successfully!",
      code: result.code,
      tools: result.tools,
      expiresAt: result.expiresAt,
      durationDays: result.durationDays ?? 7,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
