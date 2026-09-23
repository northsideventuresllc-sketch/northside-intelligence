import { NextRequest, NextResponse } from "next/server";
import { requireAxonOperatorId } from "@/lib/axon/operator";
import {
  chargeServiceBalance,
  findPendingServiceBalance,
  resolveFinalTotalCents,
} from "@/lib/services/balance-billing";

export const dynamic = "force-dynamic";

interface ChargeBody {
  id?: string;
  finalTotalCents?: number;
  confirm?: boolean;
}

/**
 * Master-operator-only: completes a service and bills the remaining balance to the
 * card saved on file. Requires an explicit confirm flag from the UI's confirmation
 * step — this is the only place a balance is ever charged, and only on a click.
 */
export async function POST(req: NextRequest) {
  try {
    await requireAxonOperatorId();

    let body: ChargeBody;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ ok: false, error: "Invalid request body" }, { status: 400 });
    }

    if (!body.id?.trim()) {
      return NextResponse.json({ ok: false, error: "Missing id" }, { status: 400 });
    }
    if (body.confirm !== true) {
      return NextResponse.json(
        { ok: false, error: "Confirmation is required before billing a balance" },
        { status: 400 }
      );
    }

    // Re-fetch from source of truth (DB / Stripe) — never trust anything from the
    // client beyond the operator-entered final total.
    const row = await findPendingServiceBalance(body.id.trim());
    if (!row) {
      return NextResponse.json(
        { ok: false, error: "This deposit was not found, or its balance is already billed." },
        { status: 404 }
      );
    }

    const { finalTotalCents, balanceCents } = resolveFinalTotalCents(row, body.finalTotalCents);

    const result = await chargeServiceBalance(row, finalTotalCents, balanceCents);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Balance billing failed";
    const status = message === "AXON access denied" ? 403 : /must be a whole number|maximum|Nothing left/.test(message) ? 400 : 500;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
