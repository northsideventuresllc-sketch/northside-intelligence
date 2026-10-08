import { NextRequest, NextResponse } from "next/server";
import { validateTrialCode } from "@/lib/billing/trial-codes";

interface ValidateRequestBody {
  code?: string;
  toolSlug?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as ValidateRequestBody;
    const code = body.code?.trim();
    const toolSlug = body.toolSlug?.trim().toLowerCase();

    if (!code) {
      return NextResponse.json(
        { valid: false, error: "Please enter an alphanumeric access code." },
        { status: 400 }
      );
    }

    const result = await validateTrialCode(code, toolSlug);

    if (!result.valid) {
      return NextResponse.json({ valid: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      valid: true,
      code: result.code,
      toolSlug: result.toolSlug,
      durationDays: result.durationDays ?? 7,
      message: `Valid ${result.durationDays ?? 7}-day trial code.`,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ valid: false, error: message }, { status: 500 });
  }
}
