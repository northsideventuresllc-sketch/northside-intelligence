import { NextRequest, NextResponse } from "next/server";
import { createServerAuthClient } from "@/lib/supabase/server-auth";
import { generateAgentKey, listAgentKeys, revokeAgentKey } from "@/lib/auth/agent-key";
import { getUserBillingState, userHasAgenticAccess } from "@/lib/billing/entitlements";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerAuthClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const toolSlug = searchParams.get("toolSlug") ?? undefined;

    const keys = await listAgentKeys(user.id, toolSlug);
    return NextResponse.json({ keys });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to list agent keys.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerAuthClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const body = await req.json();
    const toolSlug = typeof body.toolSlug === "string" ? body.toolSlug.trim() : "general";
    const name = typeof body.name === "string" ? body.name.trim() : undefined;

    // Verify entitlement: user must have Agentic access for this tool or NI Pro/Power
    const billingState = await getUserBillingState(user.id);
    const hasAgentic = userHasAgenticAccess(billingState, toolSlug);

    if (!hasAgentic) {
      return NextResponse.json(
        {
          error:
            "Agent API Keys are an Agentic Tier feature. Please upgrade to the Agentic Tier or an NI Pro/Power plan to generate automated keys.",
        },
        { status: 403 }
      );
    }

    const result = await generateAgentKey({
      userId: user.id,
      toolSlug,
      name,
    });

    return NextResponse.json({
      success: true,
      apiKey: result.rawKey,
      keyRecord: result.keyRecord,
      message:
        "Agent API key generated. Please save this key now — it cannot be displayed again.",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to generate agent key.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createServerAuthClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const body = await req.json();
    const keyId = typeof body.keyId === "string" ? body.keyId.trim() : null;

    if (!keyId) {
      return NextResponse.json({ error: "keyId is required." }, { status: 400 });
    }

    const revoked = await revokeAgentKey(user.id, keyId);
    return NextResponse.json({ success: revoked });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to revoke agent key.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
