/**
 * NI-OUTREACH-ARTIFACT-GAP-0914 regression test (run manually:
 * `npx tsx scripts/test-ni-services-artifact.ts`).
 *
 * Exercises the pure generator + eligibility + pipeline logic with ZERO
 * network/DB access (a stub GitHub PAT resolver and a stub storeFile — no
 * live GitHub write is attempted). Proves:
 *  - the generator produces a complete, well-formed HTML document per
 *    category, individualized to the business name/fields on the row
 *  - two leads in the same category render different accent colors (seeded,
 *    not one static template)
 *  - eligibility correctly excludes Match Fit leads, leads that already have
 *    an artifact_url, and leads with an explicit meta.website
 *  - ensureNiServicesArtifact() calls the injected storeFile with the
 *    generated HTML and returns a patch with the resulting URL
 *
 * Also writes each sample artifact to /tmp for manual visual inspection.
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import {
  buildNiServicesArtifactHtml,
  detectCategory,
  deriveBusinessName,
} from '../src/lib/axon/ni-services-artifact.mjs';
import {
  ensureNiServicesArtifact,
  isNiServicesLeadEligibleForArtifact,
} from '../src/lib/axon/ni-services-artifact-pipeline.mjs';

type SampleLead = {
  id: string;
  handle: string;
  niche: string | null;
  target_group: string | null;
  why_match_fit: string | null;
  dm_draft: string | null;
  comment_draft: string | null;
  status: string;
  notes: string | null;
  added: string | null;
  source: string | null;
  dm_sent: boolean | null;
  followed: boolean | null;
  commented: boolean | null;
  created_at: string;
  artifact_url?: string | null;
  meta?: Record<string, unknown>;
};

function baseLead(overrides: Partial<SampleLead>): SampleLead {
  return {
    id: 'lead-0000-0000-0000-000000000001',
    handle: 'sample_business',
    niche: 'general',
    target_group: 'smb',
    why_match_fit: 'Local business with no site found, strong candidate for web design.',
    dm_draft: null,
    comment_draft: null,
    status: 'pending_approval',
    notes: null,
    added: null,
    source: 'axon_ni_services',
    dm_sent: null,
    followed: null,
    commented: null,
    created_at: new Date().toISOString(),
    meta: {},
    ...overrides,
  };
}

let failures = 0;
function assert(cond: unknown, msg: string) {
  if (!cond) {
    failures += 1;
    console.error(`FAIL: ${msg}`);
  } else {
    console.log(`ok — ${msg}`);
  }
}

async function main() {
  const outDir = '/tmp/ni-services-artifact-samples';
  mkdirSync(outDir, { recursive: true });

  const samples: Array<{ id: string; lead: SampleLead }> = [
    {
      id: 'restaurant',
      lead: baseLead({
        id: 'lead-restaurant-0001',
        handle: '@luigis_pizzeria',
        niche: 'family-owned pizzeria',
        why_match_fit: 'Popular local pizzeria with no website, only an Instagram page.',
      }),
    },
    {
      id: 'salon',
      lead: baseLead({
        id: 'lead-salon-0002',
        handle: 'bella_hair_studio',
        niche: 'hair salon and beauty studio',
      }),
    },
    {
      id: 'homeServices',
      lead: baseLead({
        id: 'lead-plumbing-0003',
        handle: 'apex_plumbing_co',
        niche: 'residential plumbing contractor',
        target_group: 'enterprise',
      }),
    },
    {
      id: 'general-with-contact',
      lead: baseLead({
        id: 'lead-general-0004',
        handle: 'riverside_consulting',
        niche: 'independent consultant',
        meta: { contact_email: 'hello@example-consulting.invalid', recommended_service: 'Workflow Integration & Automation' },
      }),
    },
  ];

  for (const { id, lead } of samples) {
    const category = detectCategory(lead as never);
    const html = buildNiServicesArtifactHtml(lead as never);
    const name = deriveBusinessName(lead as never);

    assert(html.startsWith('<!doctype html>'), `${id}: starts with a doctype`);
    assert(html.includes('</html>'), `${id}: closes the html tag`);
    assert(html.includes(name), `${id}: includes the derived business name "${name}"`);
    assert(!/\{\{|\}\}|undefined|\[object Object\]/.test(html), `${id}: no leftover template placeholders or stringified objects`);
    assert(html.length > 2000, `${id}: artifact is a real page, not a stub (${html.length} bytes)`);

    const filePath = `${outDir}/${id}.html`;
    writeFileSync(filePath, html, 'utf8');
    console.log(`  wrote ${filePath} (category=${category.key}, ${html.length} bytes)`);
  }

  // Two different leads in the same category should not render an identical
  // accent color — proves the per-business seeding actually varies output.
  const salonA = buildNiServicesArtifactHtml(baseLead({ id: 'salon-a', handle: 'salon_one', niche: 'hair salon' }) as never);
  const salonB = buildNiServicesArtifactHtml(baseLead({ id: 'salon-b', handle: 'salon_two', niche: 'hair salon' }) as never);
  const accentA = salonA.match(/--accent:\s*(#[0-9a-f]{6})/i)?.[1];
  const accentB = salonB.match(/--accent:\s*(#[0-9a-f]{6})/i)?.[1];
  assert(accentA && accentB && accentA !== accentB, `same-category leads get different seeded accents (${accentA} vs ${accentB})`);

  // --- Eligibility ---
  const matchFitLead = baseLead({ source: 'match_fit' });
  assert(!isNiServicesLeadEligibleForArtifact(matchFitLead as never), 'Match Fit leads are never eligible');

  const alreadyHasArtifact = baseLead({ artifact_url: 'https://raw.githubusercontent.com/example/example/main/x.html' });
  assert(!isNiServicesLeadEligibleForArtifact(alreadyHasArtifact as never), 'a lead that already has artifact_url is not regenerated');

  const hasWebsite = baseLead({ meta: { website: 'https://existing-site.example.invalid' } });
  assert(!isNiServicesLeadEligibleForArtifact(hasWebsite as never), 'a lead with a known website is skipped');

  const eligible = baseLead({});
  assert(isNiServicesLeadEligibleForArtifact(eligible as never), 'a fresh NI Services lead with no site/artifact is eligible');

  // --- Pipeline (storeFile is stubbed — no live GitHub write attempted) ---
  let storeCalledWith: { path: string; content: string } | null = null;
  const patch = await ensureNiServicesArtifact(eligible as never, {
    resolvePat: async () => 'fake-pat-for-test',
    storeFile: async (args: { path: string; content: string }) => {
      storeCalledWith = { path: args.path, content: args.content };
      return { path: args.path, sha: 'deadbeef', rawUrl: `https://raw.githubusercontent.com/example/example/main/${args.path}` };
    },
  });
  assert(!!patch?.artifact_url, 'ensureNiServicesArtifact returns a patch with artifact_url when storeFile succeeds');
  assert(!!storeCalledWith && (storeCalledWith as { content: string }).content.includes('<!doctype html>'), 'storeFile was called with real generated HTML');
  assert(!!patch?.notes && JSON.parse(patch.notes).deliverable_url === patch.artifact_url, 'patch.notes carries the legacy meta.deliverable_url too, kept in sync');

  const noPat = await ensureNiServicesArtifact(baseLead({ id: 'no-pat-lead' }) as never, {
    resolvePat: async () => '',
    storeFile: async () => {
      throw new Error('storeFile should never be called when no PAT is resolved');
    },
  });
  assert(noPat === null, 'no PAT configured -> skips quietly (returns null), never throws');

  console.log(`\nSample artifacts written to ${outDir} for manual visual review.`);

  if (failures > 0) {
    console.error(`\n${failures} check(s) failed.`);
    process.exit(1);
  }
  console.log('\nAll checks passed.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
