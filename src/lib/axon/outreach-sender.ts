import { getClient } from './leads';
import { resendSend } from './resend.mjs';

/**
 * OUT-SENDER — picks up outreach_messages that JB approved (Monday screen),
 * sends the ones whose batch is approved and whose venture switch is ON,
 * and writes back a real receipt or a real failure reason.
 *
 * Safety model (do not weaken this):
 * - The venture kill switch (automation_controls: 'match_fit.outreach' / 'ni.outreach')
 *   is checked in THIS code, before any network call to Resend — not just relied on as
 *   a DB write-guard, because by the time the DB would reject the status='sent' write
 *   the email has already gone out. Both switches are OFF this weekend; this function
 *   must send nothing while they are off.
 * - Success is only recorded with a real provider_id + sent_at (DB constraint
 *   msg_sent_needs_receipt enforces this too).
 * - Failure is only recorded with a real failure_reason of 10+ chars (DB constraint
 *   msg_failed_needs_reason enforces this too).
 * - Never write outreach_messages.status by hand outside this file's guarded paths.
 */

type RawMessage = {
  id: string;
  lead_id: string;
  batch_id: string | null;
  channel: string;
  subject: string | null;
  body: string;
};

type Lead = {
  id: string;
  venture: string;
  email: string | null;
  full_name: string | null;
  company: string | null;
};

type Batch = {
  id: string;
  venture: string;
  status: string;
  daily_cap: number;
};

export type SendOutcome = {
  attempted: number;
  sent: number;
  failed: number;
  skippedSwitchOff: number;
  skippedCap: number;
  skippedNoBatch: number;
  details: Array<{ messageId: string; venture: string; result: string }>;
};

const FROM_BY_VENTURE: Record<string, { from: string; replyTo?: string }> = {
  match_fit: { from: 'Match Fit <noreply@match-fit.net>', replyTo: 'support@match-fit.net' },
  ni: { from: 'Northside Intelligence <auth@northsideintelligence.com>' },
};

function keyEnvNameFor(venture: string): string {
  return venture === 'ni' ? 'RESEND_API_KEY_NI' : 'RESEND_API_KEY';
}

async function secret(sbSelect: any, key: string): Promise<string | null> {
  if (process.env[key]) return process.env[key] as string;
  const rows = await sbSelect('ni_platform_secrets', `key=eq.${encodeURIComponent(key)}&select=value&limit=1`);
  return rows?.[0]?.value || null;
}

async function isSwitchOn(sbSelect: any, venture: string): Promise<boolean> {
  const rows = await sbSelect(
    'automation_controls',
    `scope=eq.${encodeURIComponent(`${venture}.outreach`)}&select=enabled&limit=1`,
  );
  return Boolean(rows?.[0]?.enabled);
}

function todayStartIso(): string {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}

/** Messages approved on the Monday screen, joined to their lead + batch. */
async function fetchApprovedQueue(): Promise<{ messages: RawMessage[]; leads: Record<string, Lead>; batches: Record<string, Batch> }> {
  const { sbSelect } = getClient();
  const messages = (await sbSelect(
    'outreach_messages',
    'status=eq.approved&select=id,lead_id,batch_id,channel,subject,body&order=approved_at.asc&limit=500',
  )) as RawMessage[];

  if (!messages.length) return { messages: [], leads: {}, batches: {} };

  const leadIds = Array.from(new Set(messages.map((m) => m.lead_id)));
  const batchIds = Array.from(new Set(messages.map((m) => m.batch_id).filter(Boolean))) as string[];

  const [leadRows, batchRows] = await Promise.all([
    sbSelect('outreach_leads', `id=in.(${leadIds.join(',')})&select=id,venture,email,full_name,company`),
    batchIds.length
      ? sbSelect('outreach_batches', `id=in.(${batchIds.join(',')})&select=id,venture,status,daily_cap`)
      : Promise.resolve([]),
  ]);

  const leads: Record<string, Lead> = Object.fromEntries((leadRows as Lead[]).map((l) => [l.id, l]));
  const batches: Record<string, Batch> = Object.fromEntries((batchRows as Batch[]).map((b) => [b.id, b]));
  return { messages, leads, batches };
}

/**
 * Send everything eligible. Safe to call with both switches off — it will
 * find eligible rows but skip every one of them (skippedSwitchOff) without
 * ever calling Resend.
 */
export async function runOutreachSender(): Promise<SendOutcome> {
  const { sbSelect, sbPatch } = getClient();
  const { messages, leads, batches } = await fetchApprovedQueue();

  const outcome: SendOutcome = {
    attempted: 0,
    sent: 0,
    failed: 0,
    skippedSwitchOff: 0,
    skippedCap: 0,
    skippedNoBatch: 0,
    details: [],
  };

  const switchCache = new Map<string, boolean>();
  const sentTodayByBatch = new Map<string, number>();

  for (const m of messages) {
    const lead = leads[m.lead_id];
    const batch = m.batch_id ? batches[m.batch_id] : undefined;

    if (!batch || batch.status !== 'approved') {
      outcome.skippedNoBatch++;
      continue;
    }

    const venture = lead?.venture || batch.venture;

    if (!switchCache.has(venture)) {
      switchCache.set(venture, await isSwitchOn(sbSelect, venture));
    }
    if (!switchCache.get(venture)) {
      outcome.skippedSwitchOff++;
      continue;
    }

    if (!sentTodayByBatch.has(batch.id)) {
      const sentRows = await sbSelect(
        'outreach_messages',
        `batch_id=eq.${batch.id}&status=eq.sent&sent_at=gte.${todayStartIso()}&select=id`,
      );
      sentTodayByBatch.set(batch.id, (sentRows || []).length);
    }
    if ((sentTodayByBatch.get(batch.id) || 0) >= (batch.daily_cap || 25)) {
      outcome.skippedCap++;
      continue;
    }

    if (m.channel !== 'email') {
      // Only email is wired for send today; other channels stay 'approved' for a human/future worker.
      continue;
    }

    const to = lead?.email?.trim();
    if (!to) {
      await sbPatch('outreach_messages', `id=eq.${m.id}`, {
        status: 'failed',
        failure_reason: 'no email address on file for this lead — cannot send',
      });
      outcome.failed++;
      outcome.details.push({ messageId: m.id, venture, result: 'failed: no email' });
      continue;
    }

    const keyEnv = keyEnvNameFor(venture);
    const resendKey = await secret(sbSelect, keyEnv);
    const sender = FROM_BY_VENTURE[venture];

    if (!resendKey || !sender) {
      await sbPatch('outreach_messages', `id=eq.${m.id}`, {
        status: 'failed',
        failure_reason: `no Resend key/from configured for venture "${venture}"`,
      });
      outcome.failed++;
      outcome.details.push({ messageId: m.id, venture, result: 'failed: not configured' });
      continue;
    }

    outcome.attempted++;
    try {
      const resp = await resendSend(
        { resendKey, resendFrom: sender.from, dryRun: false },
        {
          to,
          subject: m.subject || `${lead?.company || lead?.full_name || 'Hello'} — Match Fit`,
          html: m.body,
          from: sender.from,
          replyTo: sender.replyTo,
        },
      );
      const providerId = resp?.id;
      if (!providerId) throw new Error('Resend accepted the request but returned no message id');

      await sbPatch('outreach_messages', `id=eq.${m.id}`, {
        status: 'sent',
        provider_id: providerId,
        sent_at: new Date().toISOString(),
      });
      sentTodayByBatch.set(batch.id, (sentTodayByBatch.get(batch.id) || 0) + 1);
      outcome.sent++;
      outcome.details.push({ messageId: m.id, venture, result: `sent: ${providerId}` });
    } catch (err) {
      const raw = err instanceof Error ? err.message : String(err);
      const reason = raw.length >= 10 ? raw.slice(0, 500) : `send failed: ${raw}`;
      await sbPatch('outreach_messages', `id=eq.${m.id}`, {
        status: 'failed',
        failure_reason: reason,
      });
      outcome.failed++;
      outcome.details.push({ messageId: m.id, venture, result: `failed: ${reason}` });
    }
  }

  return outcome;
}
