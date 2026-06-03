# New Supabase table — Sector 3 tool

## Naming
- Prefix all tables: `replyflow_` (replace `replyflow` when forking).
- Primary key for user-owned rows: `uuid` referencing `auth.users(id)`.
- Enable RLS on every new table.

## Migration checklist
1. SQL migration in Supabase (NI Brain project) — document in PR.
2. Policies: users `select/update` own rows; service role for webhooks/jobs.
3. Update `TEMPLATE.md` table list.
4. Add typed access in API routes with `{ error }` handling.

## Do not
- Store secrets in the database.
- Use a shared `users` table for tool-specific fields — use `{tool}_profiles`.

Snippets only. Wait for JB approval before merge.
