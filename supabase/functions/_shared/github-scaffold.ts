const GITHUB_API = "https://api.github.com";
const GITHUB_ORG = "northsideventuresllc-sketch";
const TEMPLATE_REPO = "replyflow";
const TEMPLATE_BRANCH = "main";

const SKIP_PATH_PREFIXES = [
  "node_modules/",
  ".next/",
  ".git/",
];

const SKIP_PATHS = new Set([
  "SYNC_README.md",
  "apply-to-replyflow.sh",
  "PHASE.md",
  "package-lock.json",
]);

interface GitTreeItem {
  path?: string;
  mode?: string;
  type?: string;
  sha?: string;
  size?: number;
}

interface ScaffoldInput {
  slug: string;
  displayName: string;
  description?: string | null;
}

interface ScaffoldResult {
  repoFullName: string;
  repoUrl: string;
  commitSha: string;
  filesPushed: number;
}

function githubHeaders(token: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "Content-Type": "application/json",
  };
}

function shouldSkipPath(path: string): boolean {
  if (SKIP_PATHS.has(path)) return true;
  return SKIP_PATH_PREFIXES.some((prefix) => path.startsWith(prefix));
}

function applyTemplateTransforms(
  content: string,
  input: ScaffoldInput
): string {
  const { slug, displayName } = input;
  const slugUpper = slug.toUpperCase();
  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
    .slice(0, 3);

  return content
    .replaceAll("replyflow.northsideintelligence.com", `${slug}.northsideintelligence.com`)
    .replaceAll("northsideintelligence.com/replyflow", `northsideintelligence.com/${slug}`)
    .replaceAll("replyflow_profiles", `${slug}_profiles`)
    .replaceAll("replyflow_replies", `${slug}_replies`)
    .replaceAll("ReplyFlow", displayName)
    .replaceAll("REPLYFLOW", slugUpper)
    .replaceAll("replyflow", slug)
    .replaceAll("TOOL_SLUG: replyflow", `TOOL_SLUG: ${slug}`)
    .replaceAll('name": "replyflow"', `name": "${slug}"`)
    .replaceAll(">RF<", `>${initials || slug.slice(0, 2).toUpperCase()}<`);
}

function decodeGitContent(
  encoding: string,
  content: string
): Uint8Array {
  if (encoding === "base64") {
    const binary = atob(content.replace(/\n/g, ""));
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }
  return new TextEncoder().encode(content);
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

async function fetchTemplateTree(token: string): Promise<GitTreeItem[]> {
  const refRes = await fetch(
    `${GITHUB_API}/repos/${GITHUB_ORG}/${TEMPLATE_REPO}/git/ref/heads/${TEMPLATE_BRANCH}`,
    { headers: githubHeaders(token) }
  );

  if (!refRes.ok) {
    const body = await refRes.text();
    throw new Error(`Template ref lookup failed (${refRes.status}): ${body}`);
  }

  const refData = (await refRes.json()) as { object: { sha: string } };
  const treeRes = await fetch(
    `${GITHUB_API}/repos/${GITHUB_ORG}/${TEMPLATE_REPO}/git/trees/${refData.object.sha}?recursive=1`,
    { headers: githubHeaders(token) }
  );

  if (!treeRes.ok) {
    const body = await treeRes.text();
    throw new Error(`Template tree lookup failed (${treeRes.status}): ${body}`);
  }

  const treeData = (await treeRes.json()) as { tree: GitTreeItem[] };
  return treeData.tree.filter(
    (item) =>
      item.type === "blob" &&
      item.path &&
      !shouldSkipPath(item.path)
  );
}

async function fetchBlobContent(
  token: string,
  sha: string
): Promise<Uint8Array> {
  const blobRes = await fetch(
    `${GITHUB_API}/repos/${GITHUB_ORG}/${TEMPLATE_REPO}/git/blobs/${sha}`,
    { headers: githubHeaders(token) }
  );

  if (!blobRes.ok) {
    const body = await blobRes.text();
    throw new Error(`Template blob fetch failed (${blobRes.status}): ${body}`);
  }

  const blob = (await blobRes.json()) as {
    content: string;
    encoding: string;
  };

  return decodeGitContent(blob.encoding, blob.content);
}

async function createRepo(
  token: string,
  slug: string,
  description?: string | null
): Promise<{ fullName: string; htmlUrl: string }> {
  const createRes = await fetch(`${GITHUB_API}/orgs/${GITHUB_ORG}/repos`, {
    method: "POST",
    headers: githubHeaders(token),
    body: JSON.stringify({
      name: slug,
      description:
        description?.trim() ||
        `Sector 3 tool scaffold — ${slug} (NI autonomous pipeline)`,
      private: false,
      auto_init: false,
    }),
  });

  if (createRes.status === 422) {
    const existingRes = await fetch(
      `${GITHUB_API}/repos/${GITHUB_ORG}/${slug}`,
      { headers: githubHeaders(token) }
    );
    if (!existingRes.ok) {
      const body = await createRes.text();
      throw new Error(`GitHub repo create failed (${createRes.status}): ${body}`);
    }
    const existing = (await existingRes.json()) as {
      full_name: string;
      html_url: string;
    };
    return { fullName: existing.full_name, htmlUrl: existing.html_url };
  }

  if (!createRes.ok) {
    const body = await createRes.text();
    throw new Error(`GitHub repo create failed (${createRes.status}): ${body}`);
  }

  const repo = (await createRes.json()) as {
    full_name: string;
    html_url: string;
  };
  return { fullName: repo.full_name, htmlUrl: repo.html_url };
}

export async function scaffoldSector3Repo(
  token: string,
  input: ScaffoldInput
): Promise<ScaffoldResult> {
  const repo = await createRepo(token, input.slug, input.description);
  const templateItems = await fetchTemplateTree(token);

  const treeEntries: Array<{
    path: string;
    mode: string;
    type: string;
    sha: string;
  }> = [];

  for (const item of templateItems) {
    if (!item.path || !item.sha) continue;

    const rawBytes = await fetchBlobContent(token, item.sha);
    const isText =
      !item.path.endsWith(".svg") &&
      !item.path.endsWith(".png") &&
      !item.path.endsWith(".jpg") &&
      !item.path.endsWith(".ico");

    let payload: Uint8Array;
    if (isText) {
      const text = new TextDecoder().decode(rawBytes);
      payload = new TextEncoder().encode(
        applyTemplateTransforms(text, input)
      );
    } else {
      payload = rawBytes;
    }

    const blobRes = await fetch(
      `${GITHUB_API}/repos/${repo.fullName}/git/blobs`,
      {
        method: "POST",
        headers: githubHeaders(token),
        body: JSON.stringify({
          content: bytesToBase64(payload),
          encoding: "base64",
        }),
      }
    );

    if (!blobRes.ok) {
      const body = await blobRes.text();
      throw new Error(
        `GitHub blob create failed for ${item.path} (${blobRes.status}): ${body}`
      );
    }

    const blob = (await blobRes.json()) as { sha: string };
    treeEntries.push({
      path: item.path,
      mode: item.mode ?? "100644",
      type: "blob",
      sha: blob.sha,
    });
  }

  const treeRes = await fetch(
    `${GITHUB_API}/repos/${repo.fullName}/git/trees`,
    {
      method: "POST",
      headers: githubHeaders(token),
      body: JSON.stringify({ tree: treeEntries }),
    }
  );

  if (!treeRes.ok) {
    const body = await treeRes.text();
    throw new Error(`GitHub tree create failed (${treeRes.status}): ${body}`);
  }

  const tree = (await treeRes.json()) as { sha: string };

  const commitRes = await fetch(
    `${GITHUB_API}/repos/${repo.fullName}/git/commits`,
    {
      method: "POST",
      headers: githubHeaders(token),
      body: JSON.stringify({
        message: `chore: scaffold ${input.displayName} from ReplyFlow template`,
        tree: tree.sha,
      }),
    }
  );

  if (!commitRes.ok) {
    const body = await commitRes.text();
    throw new Error(`GitHub commit create failed (${commitRes.status}): ${body}`);
  }

  const commit = (await commitRes.json()) as { sha: string };

  const refRes = await fetch(
    `${GITHUB_API}/repos/${repo.fullName}/git/refs`,
    {
      method: "POST",
      headers: githubHeaders(token),
      body: JSON.stringify({
        ref: "refs/heads/main",
        sha: commit.sha,
      }),
    }
  );

  if (!refRes.ok) {
    const body = await refRes.text();
    throw new Error(`GitHub ref create failed (${refRes.status}): ${body}`);
  }

  return {
    repoFullName: repo.fullName,
    repoUrl: repo.htmlUrl,
    commitSha: commit.sha,
    filesPushed: treeEntries.length,
  };
}
