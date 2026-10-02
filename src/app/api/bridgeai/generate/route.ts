import { NextRequest, NextResponse } from "next/server";
import { API_PRESETS, type ApiServicePreset } from "@/lib/bridgeai/presets";
import { generateIntegrationBlueprint } from "@/lib/bridgeai/code-gen";
import { getUserBillingState, userCanUseTool } from "@/lib/billing/entitlements";
import { createServerAuthClient } from "@/lib/supabase/server-auth";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerAuthClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const billingState = await getUserBillingState(user.id);
    if (!userCanUseTool(billingState, "bridgeai")) {
      return NextResponse.json(
        { error: "Add BridgeAI to your Toolkit to generate automated API integrations." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const sourceKey = typeof body.sourceService === "string" ? body.sourceService.toLowerCase() : "stripe";
    const destKey = typeof body.destinationService === "string" ? body.destinationService.toLowerCase() : "hubspot";
    const actionDescription = typeof body.actionDescription === "string"
      ? body.actionDescription.trim()
      : `Sync new events from ${sourceKey} to ${destKey}`;

    const sourcePreset: ApiServicePreset = API_PRESETS[sourceKey] || API_PRESETS["stripe"];
    const destPreset: ApiServicePreset = API_PRESETS[destKey] || API_PRESETS["hubspot"];

    const isFree = billingState.niTier.toLowerCase().includes("free");

    const blueprint = generateIntegrationBlueprint({
      source: sourcePreset,
      destination: destPreset,
      actionDescription,
    });

    // Save recipe to Supabase
    const svc = createServiceClient();
    await svc.from("bridgeai_recipes").insert({
      user_id: user.id,
      recipe_name: blueprint.recipeName,
      source_service: sourcePreset.name,
      destination_service: destPreset.name,
      node_code: blueprint.nodeCode,
      created_at: new Date().toISOString(),
    }).catch(() => {});

    return NextResponse.json({
      recipe: blueprint,
      downloadable: !isFree,
      mcpUnlocked: !isFree || billingState.niTier.includes("agentic"),
      tier: billingState.niTier,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
