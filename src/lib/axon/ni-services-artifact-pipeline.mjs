/**
 * NI-OUTREACH-ARTIFACT-GAP-0914 — orchestrator.
 *
 * Wires the pure HTML generator (ni-services-artifact.mjs) to durable storage
 * (artifact-storage.mjs) and decides, per lead row, whether an artifact is
 * owed at all. Dependency-injected (resolvePat / storeFile) so this is
 * unit-testable without live GitHub credentials — see
 * scripts/test-ni-services-artifact.ts.
 */
import { SOURCE, parseNotes, formatNotes, shortId } from './constants.mjs';
import { resolveGithubPat } from './github-pat.mjs';
import {
  putGithubFile,
  slugify,
  DEFAULT_ARTIFACT_REPO,
  DEFAULT_ARTIFACT_BRANCH,
  DEFAULT_ARTIFACT_PATH_PREFIX,
} from './artifact-storage.mjs';
import { buildNiServicesArtifactHtml, deriveBusinessName } from './ni-services-artifact.mjs';

/**
 * A lead is owed a v1 artifact when it is:
 *  - an NI Services lead (source === axon_ni_services — Match Fit leads never
 *    get one, per the Venture Map: this deliverable is NI Services-only today)
 *  - not already carrying one (checks the new `artifact_url` column first,
 *    then the legacy `meta.deliverable_url` convention so an older manually
 *    attached deliverable is never silently overwritten)
 *  - flagged (or not yet disproven) as having no existing website
 *
 * KNOWN GAP: there is no structured "has_website" boolean on this row today —
 * AXON's research produces `meta.icp_scan` / free-text fields, not that field.
 * Until AXON's scan writes one, this treats `meta.website` (only set when
 * something explicitly recorded a URL) as the sole "they already have a site"
 * signal, and otherwise assumes eligible. That is a real assumption, not a
 * verified fact — flagged here rather than silently treated as certain.
 */
export function isNiServicesLeadEligibleForArtifact(lead) {
  if (!lead || lead.source !== SOURCE) return false;
  if (lead.artifact_url) return false;
  const meta = lead.meta || parseNotes(lead.notes);
  if (meta.deliverable_url || meta.artifact_url) return false;
  if (meta.website) return false; // explicit signal they already have a site
  return true;
}

/**
 * Generate (if owed) and store the artifact for one lead.
 * @param {import('./types').Lead & { meta?: import('./types').LeadMeta }} lead
 * @param {object} [deps] injection seam for tests
 * @returns {Promise<{ artifact_url: string, notes: string } | null>} a patch
 *   ready for updateLeadStatus(id, patch), or null if nothing was owed/needed.
 */
export async function ensureNiServicesArtifact(lead, deps = {}) {
  const {
    resolvePat = resolveGithubPat,
    storeFile = putGithubFile,
    repo = DEFAULT_ARTIFACT_REPO,
    branch = DEFAULT_ARTIFACT_BRANCH,
    pathPrefix = DEFAULT_ARTIFACT_PATH_PREFIX,
    buildHtml = buildNiServicesArtifactHtml,
  } = deps;

  if (!isNiServicesLeadEligibleForArtifact(lead)) return null;

  const pat = await resolvePat();
  if (!pat) return null; // best-effort: no PAT configured yet — skip quietly, try again next call

  const html = buildHtml(lead);
  const slug = slugify(deriveBusinessName(lead));
  const path = `${pathPrefix}/${slug}-${shortId(lead.id)}.html`;

  const stored = await storeFile({
    pat,
    repo,
    branch,
    path,
    content: html,
    message: `NI Services artifact: ${slug} (lead ${shortId(lead.id)})`,
  });

  const meta = { ...(lead.meta || parseNotes(lead.notes)) };
  meta.deliverable_url = stored.rawUrl; // keeps the existing /deliverable proxy + read path working unchanged
  meta.deliverable_label = 'Interactive site preview';
  meta.artifact_generated_at = new Date().toISOString();

  return {
    artifact_url: stored.rawUrl,
    notes: formatNotes(meta),
  };
}

/**
 * Best-effort backfill across a batch of already-fetched rows (mutates each
 * eligible row in place with the new fields so a caller's in-memory list
 * reflects the change immediately, without a second round-trip read).
 * Capped per call so one slow GitHub round-trip can never turn a leads-list
 * request into a multi-artifact-generation request.
 * @param {Array<import('./types').Lead>} rows
 * @param {{ limit?: number, persist?: (id: string, patch: Record<string, unknown>) => Promise<unknown>, onError?: (err: unknown, lead: Record<string, unknown>) => void }} [opts]
 */
export async function backfillNiServicesArtifacts(rows, opts = {}) {
  const { limit = 3, persist, onError } = opts;
  let used = 0;
  for (const row of rows || []) {
    if (used >= limit) break;
    if (!isNiServicesLeadEligibleForArtifact(row)) continue;
    try {
      const patch = await ensureNiServicesArtifact(row);
      if (!patch) continue;
      if (typeof persist === 'function') {
        await persist(row.id, patch);
      }
      Object.assign(row, patch);
      used += 1;
    } catch (err) {
      if (typeof onError === 'function') onError(err, row);
    }
  }
  return used;
}
