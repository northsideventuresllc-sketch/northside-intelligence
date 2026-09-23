/**
 * MCP tool annotation hints for `tools/list` (spec 2025-06-18 `ToolAnnotations`).
 * Only the obvious, safe-to-assert hints are set — read-only search/lookup tools.
 * Everything else is left unannotated rather than guessed at.
 */

export const READ_ONLY_TOOLS = new Set<string>([
  "mf_search_coaches",
  "ni_store_search",
  "ni_order_status",
]);

export function annotationsFor(toolName: string): { readOnlyHint: boolean } | undefined {
  if (READ_ONLY_TOOLS.has(toolName)) return { readOnlyHint: true };
  return undefined;
}
