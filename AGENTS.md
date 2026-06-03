# northside-intelligence

Placeholder repository (initial commit). No application source, dependency manifests, or service definitions yet.

## Cursor Cloud specific instructions

### Repository state

- **Tracked files:** `README.md` only (as of initial commit).
- **No** `package.json`, `docker-compose`, Makefile, CI workflows, or language-specific project files.
- **No services** to start for local development until application code is added.

### VM update script behavior

The startup update script is intentionally a no-op (`true`) because there are no dependencies to refresh. When you add manifests (for example `package.json`, `requirements.txt`, `go.mod`), update the VM update script in Cursor environment settings to match (e.g. `npm ci`, `pnpm install`, `uv sync`).

### Lint / test / build / dev

| Operation | Status |
|-----------|--------|
| Lint | Not configured |
| Test | Not configured |
| Build | Not configured |
| Dev server | Not configured |

### Toolchain on Cloud Agent VMs (for future scaffolding)

These runtimes are typically available without extra VM setup:

- **Node.js** v22 + **npm** / **pnpm**
- **Python** 3.12
- **Go** 1.22

Docker is not preinstalled on the default Cloud Agent image. If the project later needs Docker, install it during setup or document host-specific requirements.

### When adding the first application

1. Add dependency manifests and document commands in `README.md` (or per-package READMEs).
2. Extend the VM **update script** to install dependencies idempotently.
3. Update this section with: required vs optional services, ports, env vars, and exact lint/test/dev commands.
4. Prefer non-interactive install flags (e.g. `pnpm install --frozen-lockfile` when a lockfile exists).

### Sanity check (current repo)

```bash
cd /workspace
test -f README.md && git status && git log -1 --oneline
```

Expected: clean working tree on `main`, latest commit is the initial commit.
