import { NextResponse } from "next/server";
import { ensureBillingEnvHydrated, getBillingConfigError } from "@/lib/billing/stripe";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET() {
  await ensureBillingEnvHydrated();
  const stripeError = getBillingConfigError();
  const hasServiceRole = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  let niPlansConfigured = false;
  let toolPricingConfigured = false;

  if (hasServiceRole) {
    try {
      const service = createServiceClient();
      const [{ data: niPlans }, { data: toolPricing }] = await Promise.all([
        service.from("ni_plan_pricing").select("stripe_monthly_price_id, stripe_annual_price_id"),
        service.from("ni_tool_pricing").select("stripe_monthly_price_id"),
      ]);

      niPlansConfigured = (niPlans ?? []).some(
        (row) => row.stripe_monthly_price_id && row.stripe_annual_price_id
      );
      toolPricingConfigured = (toolPricing ?? []).some((row) => row.stripe_monthly_price_id);
    } catch {
      // Leave flags false when Supabase is unreachable.
    }
  }

  const ready = !stripeError && hasServiceRole && niPlansConfigured;

  return NextResponse.json({
    ready,
    stripe: stripeError ? "missing" : "configured",
    supabaseServiceRole: hasServiceRole ? "configured" : "missing",
    niPlansConfigured,
    toolPricingConfigured,
    message: ready
      ? "Billing is ready"
      : stripeError ?? "Billing configuration is incomplete",
  });
}
