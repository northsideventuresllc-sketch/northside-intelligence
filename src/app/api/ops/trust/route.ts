import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { OPS_COOKIE, verifyOpsSessionToken } from '@/lib/ops/session';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const SUPABASE_URL =
  process.env.NI_BRAIN_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  'https://kxijunwgbrlfzvgkhklo.supabase.co';

function serviceKey(): string | null {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || null;
}

async function sbSelect(table: string, filter: string) {
  const key = serviceKey();
  if (!key) return [];
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${filter}`, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      Accept: 'application/json',
    },
    cache: 'no-store',
  });
  if (!r.ok) throw new Error(`Supabase select ${table}: HTTP ${r.status}`);
  return r.json();
}

const DENIAL_PATTERN = /(deny|denial|block|reject|veto)/i;

export async function GET() {
  const token = (await cookies()).get(OPS_COOKIE)?.value;
  if (!(await verifyOpsSessionToken(token))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!serviceKey()) {
    return NextResponse.json(
      { error: 'Server misconfigured: SUPABASE_SERVICE_ROLE_KEY not set' },
      { status: 500 }
    );
  }

  try {
    const [pinRows, haltRows, auditRows] = await Promise.all([
      sbSelect(
        'axon_morality_versions',
        'active=eq.true&order=created_at.desc&limit=1'
      ),
      sbSelect('axon_global_halt_events', 'order=created_at.desc&limit=5'),
      sbSelect('axon_morality_audit', 'order=created_at.desc&limit=25'),
    ]);

    const pin = pinRows[0] ?? null;
    const latestHalt = haltRows[0] ?? null;
    const sealed = !!latestHalt && latestHalt.status !== 'clear';

    const events = auditRows.map((row: { event_type?: string; action_class?: string }) => ({
      ...row,
      is_denial: DENIAL_PATTERN.test(row.event_type ?? '') || DENIAL_PATTERN.test(row.action_class ?? ''),
    }));

    return NextResponse.json({
      pin,
      sealed,
      latest_halt: latestHalt,
      halt_history: haltRows,
      recent_events: events,
      denials: events.filter((e: { is_denial: boolean }) => e.is_denial),
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
