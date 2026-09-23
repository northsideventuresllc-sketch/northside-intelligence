# WebMCP directory submission — step by step

Owner: lane-5 (webmcp transport/spec compliance). Endpoint under submission:
`https://www.northsideintelligence.com/api/webmcp` (Streamable HTTP, spec 2025-06-18).
`server.json` (repo root) and `public/.well-known/webmcp.json` / `public/llms.txt` are the
source manifests these listings read from — keep them in sync before re-submitting anywhere.

Written so a browser-automation agent can execute each step without a human filling in
blanks. Where a step needs a credential, it names the exact secret key to pull from
`ni_platform_secrets` / GitHub Actions secrets — never paste a live value into this file.

---

## (a) Official MCP Registry — publish with `mcp-publisher`

The official registry (`registry.modelcontextprotocol.io`) publishes from the repo's
`server.json`, authenticated as the GitHub identity that owns the `io.github.*` namespace
in that file's `name` field (`io.github.northsideventuresllc-sketch/northside-intelligence`).

1. Install the publisher CLI (one-time, in the CI/agent shell):
   ```bash
   curl -fsSL https://github.com/modelcontextprotocol/registry/releases/latest/download/mcp-publisher-linux-amd64.tar.gz | tar xz
   sudo mv mcp-publisher /usr/local/bin/
   mcp-publisher --version
   ```
   If the release asset name has changed, browse
   `https://github.com/modelcontextprotocol/registry/releases/latest` and pick the
   `linux-amd64` (or matching platform) `mcp-publisher` binary.
2. From the repo root (where `server.json` lives), authenticate with GitHub OAuth:
   ```bash
   mcp-publisher login github
   ```
   This opens a device-code flow: it prints a URL (`https://github.com/login/device`) and an
   8-character code. A browser-automation agent should:
   - Navigate to the printed URL.
   - Sign in as the `northsideventuresllc-sketch` GitHub account if not already signed in
     (credentials: GitHub App / PAT flow documented in `northside-intelligence` repo's
     `AGENTS.md` — do not create a new GitHub account for this).
   - Enter the device code shown in the terminal.
   - Click **Authorize**.
   - Return to the terminal/CLI session; it will report "Login successful" once GitHub
     confirms the device code.
3. Validate the manifest locally before publishing:
   ```bash
   mcp-publisher validate ./server.json
   ```
   Fix any schema errors it reports (field names/types must match
   `https://static.modelcontextprotocol.io/schemas/2025-12-11/server.schema.json` — re-fetch
   that schema URL if this fails on an unrecognized field, since the registry's schema
   version advances independently of this repo).
4. Publish:
   ```bash
   mcp-publisher publish ./server.json
   ```
   On success it prints the published server's registry URL, of the form
   `https://registry.modelcontextprotocol.io/v0/servers/<id>`. Save that URL — it's the
   proof-of-publish artifact for the write-back.
5. Re-publishing after a `server.json` edit: bump `version` first (the registry rejects a
   republish at an unchanged version), then repeat step 4.
6. Verify: `curl https://registry.modelcontextprotocol.io/v0/servers?search=northside-intelligence`
   should return the published entry.

---

## (b) Glama — connector listing

1. Navigate to `https://glama.ai/mcp/servers`.
2. Sign in (GitHub OAuth, same `northsideventuresllc-sketch` account as above) if prompted.
3. Click **Submit a server** / **Add server** (button text has moved before — look for a
   "+" or "Submit" control near the top of the server directory page).
4. In the submission form:
   - **Repository URL**: `https://github.com/northsideventuresllc-sketch/northside-intelligence`
   - **Server type**: Remote / Hosted (not stdio/local) — Glama distinguishes local MCP
     servers (npm/pip packages) from remote HTTP ones; pick the remote option.
   - **Endpoint URL**: `https://www.northsideintelligence.com/api/webmcp`
   - **Transport**: Streamable HTTP (not SSE, not stdio).
   - **Name**: `Northside Intelligence WebMCP`
   - **Description**: paste the `description` field verbatim from `server.json`.
5. Submit. Glama typically auto-crawls the endpoint (it will call `initialize` then
   `tools/list`) to verify liveness and populate the tool list — this is exactly what lane-5's
   spec-compliance work (protocol negotiation, `Mcp-Session-Id`, JSON-RPC error shape) exists
   to pass. If the crawl fails, re-run the curl checks in this repo's `README`/session report
   against the live production URL before resubmitting.
6. Note the resulting Glama listing URL for the write-back.

---

## (c) Smithery — remote server add

1. Navigate to `https://smithery.ai/`.
2. Sign in (GitHub OAuth, same account).
3. Click **Add Server** / **Deploy** → choose **Remote server** (Smithery separates
   "Local" packages it runs for you from "Remote" servers you already host).
4. Fill in:
   - **Server URL**: `https://www.northsideintelligence.com/api/webmcp`
   - **Transport**: Streamable HTTP.
   - **Qualified name**: `northsideventuresllc-sketch/northside-intelligence` (match the
     GitHub repo slug — Smithery derives its own namespace from this).
   - **Repository**: link the GitHub repo above so Smithery can pull the README/description.
5. Smithery will attempt a live handshake against the URL (same `initialize` → `tools/list`
   flow as Glama). Confirm the tool count it reports back matches 12 before finishing the
   submission — a mismatch means it hit a stale deploy, not a manifest problem.
6. Publish/confirm the listing. Save the resulting `smithery.ai/server/...` URL.

---

## (d) mcpservers.org — directory form

1. Navigate to `https://mcpservers.org/submit` (or the "Submit a server" link from the
   site's nav if the path has moved).
2. This directory is typically a simple form, no OAuth required:
   - **Name**: `Northside Intelligence`
   - **GitHub URL**: `https://github.com/northsideventuresllc-sketch/northside-intelligence`
   - **Server URL / endpoint**: `https://www.northsideintelligence.com/api/webmcp`
   - **Category**: closest match is "Business" / "Productivity" / "Web Search & Data" —
     pick whichever the form's dropdown offers that best fits lead-gen/commerce/market-intel
     tools; there is no single perfect category.
   - **Description**: use the `llms.txt` "Provider Info" summary line, trimmed to the
     form's character limit if one is shown.
3. Submit. Some instances of this kind of directory queue submissions for manual review
   rather than publishing instantly — if a confirmation email address is requested, use
   `jb@northsideintelligence.com`.
4. No CLI/API path is known for this one; it is form-only. If the form has been replaced by
   a GitHub-PR-based submission process (check the site's footer/nav for a "Contribute on
   GitHub" link) by the time this runs, follow that repo's `CONTRIBUTING.md` instead and
   note the change here as a `[STALE-PROMPT]`-style correction.

---

## (e) awesome-remote-mcp-servers — corrected PR entry

**Before touching the PR:** this fork branch is known stale (~184 lines behind
`upstream main` at last check), which is what caused a duplicate-flag review comment last
time. Do not add the new entry to a stale branch — it will re-trigger the same duplicate
complaint.

1. Confirm the account (`northsideventuresllc-sketch`) has **starred**
   `github.com/<upstream-owner>/awesome-remote-mcp-servers` — most awesome-lists require
   this before a PR is accepted; if unstarred, open the repo and click the **Star** button
   first.
2. Rebase the fork's working branch onto the current upstream `main`:
   ```bash
   git remote add upstream https://github.com/<upstream-owner>/awesome-remote-mcp-servers.git 2>/dev/null || true
   git fetch upstream main
   git checkout <fork-branch-name>
   git rebase upstream/main
   # resolve any conflicts, then:
   git push --force-with-lease origin <fork-branch-name>
   ```
   Do this even if no PR is open yet — a stale base is the root cause to fix, not just the
   symptom.
3. Add the entry as **exactly 3 lines**, matching this repo's existing row format. Use:
   - **Auth marker**: `🔓` only (this endpoint requires no auth for `tools/list`/discovery —
     individual paid tools gate on Stripe Checkout at call time, not on connection auth, so
     `🔓` is correct, not `🔐`).
   - **Description**: exactly one sentence, ≤120 characters, ending with a period. Use:
     `Northside Intelligence WebMCP: lead automation, site audits, market briefs, and grant search tools for AI agents.`
     (count this string before pasting — recount if the tool list or wording changes, since
     the character budget is tight).
   - **Badge slug**: `io.github.northsideventuresllc-sketch/northside-intelligence` — this
     must exactly match `server.json`'s `name` field, since badge-generating CI in that repo
     resolves it against the official registry entry from step (a). Publish to the official
     registry (step a) **before** opening this PR, or the badge will 404 in CI.
4. Open the PR from the rebased branch. Title: `Add Northside Intelligence WebMCP server`.
   PR body: link the production endpoint, the official registry URL from step (a), and note
   "rebased onto upstream main" so reviewers don't re-flag it as stale.
5. If CI in that repo runs a live liveness check against the URL (some awesome-lists do),
   it will call the same `initialize`/`tools/list` handshake as (b)/(c) above — this is the
   spec-compliance work in `src/app/api/webmcp/route.ts` being exercised end to end.

---

## Re-verification after any manifest change

Any time `server.json`, `public/.well-known/webmcp.json`, or the route's protocol behavior
changes, re-run the curl checks against production (see the lane-5 session report for the
exact commands) before re-submitting to any directory above — a directory crawl that hits a
broken deploy produces a permanent bad first impression (some directories cache a failed
crawl and don't re-crawl automatically).
