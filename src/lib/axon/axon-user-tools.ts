export type AxonUserToolSource = 'outreach_engine' | 'it_clone' | 'custom';

export interface AxonUserTool {
  slug: string;
  defaultDisplayName: string;
  href: string;
  icon: string;
  sourceType: AxonUserToolSource;
  /** Sidebar-only action (no route navigation). */
  action?: 'test-mode-panel';
  /** AX-MKT-OUT-DEMERGE (2026-08-03): groups this tile under a venture
   *  section in the sidebar ("Match Fit" / "NI") instead of the old flat
   *  blended "AXON Tools" list. Omit for tools that aren't venture-specific
   *  (Repo Manager, Financial Tracker, etc.) — those stay in the general group. */
  venture?: 'match_fit' | 'ni';
}

/** Built-in AXON tools surfaced under sidebar "AXON Tools". Order = sidebar order. */
export const AXON_USER_TOOLS: AxonUserTool[] = [
  {
    slug: 'manager-dispatch',
    defaultDisplayName: 'Repo Manager Agent Dispatch',
    href: '/tools/dispatch',
    icon: '⚡',
    sourceType: 'custom',
  },
  {
    slug: 'match-fit-admin',
    defaultDisplayName: 'Match Fit Marketing',
    href: '/tools/match-fit-admin',
    icon: '🏋',
    sourceType: 'custom',
    venture: 'match_fit',
  },
  {
    // AX-MKT-OUT-DEMERGE (2026-08-03): Match Fit's own real outreach
    // queue/approve/pipeline screen — was previously only a 20-row
    // read-only stub inside Match Fit Admin with no actions wired up.
    slug: 'mf-outreach',
    defaultDisplayName: 'Match Fit Outreach',
    href: '/tools/mf-outreach',
    icon: '✉',
    sourceType: 'outreach_engine',
    venture: 'match_fit',
  },
  {
    slug: 'ni-outreach',
    defaultDisplayName: 'NI Outreach',
    href: '/tools/ni-outreach',
    icon: '✉',
    sourceType: 'outreach_engine',
    venture: 'ni',
  },
  {
    slug: 'content-machine',
    defaultDisplayName: 'NI Marketing',
    // Fixed 2026-07-31 (NI-CONTENT-MACHINE-404): href pointed at a route that never existed.
    // The real page lives at tools/ni-content — this tile 404'd every time JB opened it.
    href: '/tools/ni-content',
    icon: '📝',
    sourceType: 'custom',
    venture: 'ni',
  },
  {
    // AX-MKT-OUT-DEMERGE (2026-08-03): renamed from "NI Marketing HQ" — this
    // tile is actually the AXON dispatch/task mirror, not an NI marketing
    // approval screen (that's "NI Marketing" / content-machine above). The
    // old name was itself part of the smoosh JB flagged.
    slug: 'hermes-sync',
    defaultDisplayName: 'AXON Dispatch Mirror',
    href: '/tools/hermes',
    icon: '📣',
    sourceType: 'custom',
  },
  {
    slug: 'deal-tracker',
    defaultDisplayName: 'Financial Tracker',
    href: '/tools/deals',
    icon: '◆',
    sourceType: 'custom',
  },
  {
    slug: 'lucielle',
    defaultDisplayName: 'Lucielle',
    href: '/tools/lucielle',
    icon: '💠',
    sourceType: 'custom',
  },
  {
    slug: 'usage-tower',
    defaultDisplayName: 'Usage Tower',
    href: '/tools/usage-tower',
    icon: '🗼',
    sourceType: 'custom',
  },
  {
    slug: 'reddit',
    defaultDisplayName: 'Reddit Queues',
    href: '/tools/reddit',
    icon: '👽',
    sourceType: 'custom',
  },
  {
    slug: 'fire-hold',
    defaultDisplayName: 'Fire / Hold Control',
    href: '/tools/fire-hold',
    icon: '🔒',
    sourceType: 'custom',
  },
  {
    slug: 'test-mode',
    defaultDisplayName: 'Test Mode',
    href: '/tools/test-mode',
    icon: '🧪',
    sourceType: 'custom',
    action: 'test-mode-panel',
  },
];

export const AXON_TOOL_NAME_STORAGE_KEY = 'axon.toolDisplayNames';
export const AXON_TOOL_LAUNCH_KEY = 'axon.toolLaunch';

export function readToolDisplayNames(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(AXON_TOOL_NAME_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, string>) : {};
  } catch {
    return {};
  }
}

export function resolveToolDisplayName(tool: AxonUserTool, names?: Record<string, string>): string {
  const custom = names?.[tool.slug]?.trim();
  return custom || tool.defaultDisplayName;
}

export function writeToolDisplayName(slug: string, displayName: string): Record<string, string> {
  const next = { ...readToolDisplayNames(), [slug]: displayName.trim() };
  localStorage.setItem(AXON_TOOL_NAME_STORAGE_KEY, JSON.stringify(next));
  return next;
}

export function markToolLaunch(slug: string): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(AXON_TOOL_LAUNCH_KEY, slug);
}

export function consumeToolLaunch(expectedSlug: string): boolean {
  if (typeof window === 'undefined') return false;
  const value = sessionStorage.getItem(AXON_TOOL_LAUNCH_KEY);
  if (value === expectedSlug) {
    sessionStorage.removeItem(AXON_TOOL_LAUNCH_KEY);
    return true;
  }
  return false;
}
