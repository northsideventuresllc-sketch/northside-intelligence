/**
 * NI-OUTREACH-ARTIFACT-GAP-0914 — durable storage for generated lead artifacts.
 *
 * Storage-pattern decision (documented per the ticket's instruction to reuse an
 * existing pattern if one exists, or pick and document a default): this repo has
 * NO Supabase Storage bucket usage anywhere (checked — none found). It DOES
 * already have a live convention for lead deliverables: `_code-check/2026-08-03-
 * AX-DELIVERABLE-UPLOAD-LIVE.md` documents a deliverable stored as a private
 * nv-vault file referenced by its raw.githubusercontent.com URL, fetched
 * server-side via `resolveGithubPat()` (src/lib/axon/github-pat.mjs) so the
 * PAT never reaches the browser — `/api/leads/[id]/deliverable/route.ts` already
 * implements exactly that read path today. This module is the missing WRITE
 * half of that same convention: commit the generated HTML via the GitHub
 * Contents API to the same PAT-gated private repo, and hand back the same kind
 * of raw URL the existing read path already knows how to serve.
 *
 * Default target: `northsideventuresllc-sketch/nv-vault` (private) — matches
 * the one real precedent in this codebase, keeps prospect-research artifacts
 * out of this repo's own (public) git history, and needs no new secret: it
 * reuses whichever GH PAT resolveGithubPat() already finds. Override via env
 * if a dedicated artifacts repo/bucket is ever stood up.
 *
 * NOT verified live in this session — no GitHub write credentials were
 * available to this sandbox. The HTTP calls below are written to the documented
 * GitHub Contents API and unit-testable with a fetch stub (see
 * scripts/test-ni-services-artifact.ts), but an actual push to nv-vault has not
 * been exercised. Flagged, not silently assumed.
 */

export const DEFAULT_ARTIFACT_REPO = process.env.NI_ARTIFACT_REPO || 'northsideventuresllc-sketch/nv-vault';
export const DEFAULT_ARTIFACT_BRANCH = process.env.NI_ARTIFACT_BRANCH || 'main';
export const DEFAULT_ARTIFACT_PATH_PREFIX =
  process.env.NI_ARTIFACT_PATH_PREFIX || '_ai-artifacts/ni-outreach';

function toBase64(str) {
  if (typeof Buffer !== 'undefined') return Buffer.from(str, 'utf8').toString('base64');
  // Edge-runtime fallback (no Buffer global).
  return btoa(unescape(encodeURIComponent(str)));
}

/**
 * Write (create or update) one file via the GitHub Contents API.
 * @param {object} opts
 * @param {string} opts.pat GitHub token with contents:write on `repo`
 * @param {string} opts.repo "owner/name"
 * @param {string} opts.branch
 * @param {string} opts.path repo-relative path, no leading slash
 * @param {string} opts.content raw file text (this module base64-encodes it)
 * @param {string} opts.message commit message
 * @param {typeof fetch} [opts.fetchImpl]
 * @returns {Promise<{ path: string, sha: string|null, rawUrl: string }>}
 */
export async function putGithubFile({ pat, repo, branch, path, content, message, fetchImpl }) {
  if (!pat) throw new Error('No GitHub PAT available to store the artifact');
  if (!repo || !path) throw new Error('putGithubFile requires repo and path');
  const doFetch = fetchImpl || fetch;
  const apiBase = `https://api.github.com/repos/${repo}/contents/${path}`;
  const headers = {
    Authorization: `token ${pat}`,
    Accept: 'application/vnd.github+json',
  };

  // Look up the current sha (if the file already exists) so an overwrite is a
  // real update, not a doomed create-on-top-of-existing-file 422.
  let sha;
  const existing = await doFetch(`${apiBase}?ref=${encodeURIComponent(branch)}`, { headers });
  if (existing.ok) {
    const data = await existing.json();
    sha = data?.sha;
  } else if (existing.status !== 404) {
    const detail = await existing.text().catch(() => '');
    throw new Error(`GitHub GET ${path} failed: HTTP ${existing.status} ${detail.slice(0, 200)}`);
  }

  const putRes = await doFetch(apiBase, {
    method: 'PUT',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      content: toBase64(content),
      branch,
      ...(sha ? { sha } : {}),
    }),
  });
  if (!putRes.ok) {
    const detail = await putRes.text().catch(() => '');
    throw new Error(`GitHub PUT ${path} failed: HTTP ${putRes.status} ${detail.slice(0, 200)}`);
  }
  const putData = await putRes.json();
  return {
    path,
    sha: putData?.content?.sha ?? null,
    rawUrl: `https://raw.githubusercontent.com/${repo}/${branch}/${path}`,
  };
}

/** Filesystem/URL-safe slug from a business name, for a readable artifact path. */
export function slugify(input) {
  return String(input || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'business';
}
