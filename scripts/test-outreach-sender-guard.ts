/**
 * Safety regression test for OUT-SENDER (run manually: `npx tsx scripts/test-outreach-sender-guard.ts`).
 * Proves the sender's kill-switch check works BEFORE any network call to
 * Resend — i.e. with the venture's automation_controls switch off, a
 * fully-approved test message is skipped, not sent, and Resend is never
 * called. Refuses to run at all if the switch is somehow on. Inserts a
 * throwaway lead/batch/message and deletes them before exiting either way.
 */
import { getClient } from '../src/lib/axon/leads';
import { runOutreachSender } from '../src/lib/axon/outreach-sender';

async function main() {
  const { sbInsert, sbSelect, sbDelete } = getClient();

  const onRows = await sbSelect(
    'automation_controls',
    "scope=eq.match_fit.outreach&select=enabled",
  );
  const switchOn = Boolean(onRows?.[0]?.enabled);
  console.log('match_fit.outreach enabled =', switchOn);
  if (switchOn) {
    throw new Error('REFUSING TO TEST: match_fit.outreach is ON. Aborting to avoid a real send.');
  }

  const lead = await sbInsert('outreach_leads', {
    venture: 'match_fit',
    channel: 'email',
    full_name: 'Sender Guard Test',
    email: 'sender-guard-test@example.invalid',
    company: 'Guard Test Co',
    city: 'Atlanta',
    niche: 'test',
    source: 'sender-guard-test',
    why: 'automated safety test row, deleted immediately after',
    score: 1,
    status: 'approved',
  });
  console.log('inserted test lead', lead.id);

  const batch = await sbInsert('outreach_batches', {
    venture: 'match_fit',
    week_of: new Date().toISOString().slice(0, 10),
    status: 'approved',
    daily_cap: 25,
    approved_by: 'sender-guard-test',
    approved_at: new Date().toISOString(),
  });
  console.log('inserted test batch', batch.id);

  const message = await sbInsert('outreach_messages', {
    lead_id: lead.id,
    batch_id: batch.id,
    channel: 'email',
    subject: 'guard test — should never send',
    body: 'This is a guard test row proving the sender will not call Resend while the outreach switch is off. Deleted immediately.',
    step: 1,
    status: 'approved',
    approved_by: 'sender-guard-test',
    approved_at: new Date().toISOString(),
  });
  console.log('inserted test message', message.id);

  try {
    const outcome = await runOutreachSender();
    console.log('SENDER OUTCOME:', JSON.stringify(outcome, null, 2));

    const relevant = outcome.details.find((d) => d.messageId === message.id);
    if (relevant) {
      throw new Error(`Sender touched the test message unexpectedly: ${JSON.stringify(relevant)}`);
    }
    if (outcome.skippedSwitchOff < 1) {
      throw new Error('Expected skippedSwitchOff >= 1 with the switch off — guard did not fire.');
    }

    const after = await sbSelect('outreach_messages', `id=eq.${message.id}&select=status,provider_id,sent_at`);
    console.log('message status after run:', after);
    if (after?.[0]?.status !== 'approved') {
      throw new Error(`Test message status changed to "${after?.[0]?.status}" — it should still be "approved".`);
    }

    console.log('PASS: sender skipped the switched-off venture and made no Resend call.');
  } finally {
    await sbDelete('outreach_messages', `id=eq.${message.id}`);
    await sbDelete('outreach_batches', `id=eq.${batch.id}`);
    await sbDelete('outreach_leads', `id=eq.${lead.id}`);
    console.log('cleaned up test rows');
  }
}

main().catch((err) => {
  console.error('FAIL:', err);
  process.exit(1);
});
