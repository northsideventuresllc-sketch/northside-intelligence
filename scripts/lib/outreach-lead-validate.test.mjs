import test from 'node:test';
import assert from 'node:assert/strict';
import { validateLeadContact } from './outreach-lead-validate.mjs';

test('rejects an AgentBot-style synthetic name (the axon_outreach_scout shape)', () => {
  const r = validateLeadContact({ full_name: 'Agent Souk Base Bazaar AgentBot', company: 'Agent Souk Base Bazaar' });
  assert.equal(r.ok, false);
  assert.ok(r.reasons.some((x) => x.includes('synthetic')));
});

test('rejects a lead with no reachable channel at all', () => {
  const r = validateLeadContact({ full_name: 'Real Person', company: 'Real Co' });
  assert.equal(r.ok, false);
  assert.ok(r.reasons.some((x) => x.includes('no reachable channel')));
});

test('flags (but does not hard-reject) a profile_url-only lead — the August dead-end shape', () => {
  const r = validateLeadContact({ company: 'Just Great Grooming', profile_url: 'https://facebook.com/JustGreatGrooming' });
  assert.equal(r.ok, true);
  assert.ok(r.reasons.some((x) => x.includes('weak lead')));
});

test('accepts a lead with a named contact and email', () => {
  const r = validateLeadContact({ full_name: 'Jane Doe', email: 'jane@realbiz.com', company: 'Real Biz' });
  assert.equal(r.ok, true);
  assert.equal(r.reasons.length, 0);
});
