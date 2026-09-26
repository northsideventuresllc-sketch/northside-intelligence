import { NextResponse } from "next/server";
import { requireAxonOperatorId } from "@/lib/axon/operator";
import { listPendingServiceBalances } from "@/lib/services/balance-billing";

export const dynamic = "force-dynamic";

/** Master-operator-only: every deposit awaiting a balance charge, both sources. */
export async function GET() {
  try {
    await requireAxonOperatorId();

    const rows = await listPendingServiceBalances();
    return NextResponse.json({
      ok: true,
      items: rows.map((row) => ({
        id: row.id,
        source: row.source,
        clientEmail: row.clientEmail,
        serviceName: row.serviceName,
        depositCents: row.depositCents,
        defaultTotalCents: row.defaultTotalCents,
        defaultBalanceCents: row.defaultBalanceCents,
        depositPaidAt: row.depositPaidAt,
      })),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not load pending balances";
    const status = message === "AXON access denied" ? 403 : 500;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
