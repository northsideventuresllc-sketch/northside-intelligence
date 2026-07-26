import 'server-only';

import { getClient } from './leads';

export type BrainNode = {
  id: string;
  label: string;
  detail: string;
  date: string | null;
};

export type BrainCluster = {
  key: string;
  label: string;
  total: number;
  nodes: BrainNode[];
};

function clip(text: string, max = 90): string {
  const clean = (text || '').replace(/\s+/g, ' ').trim();
  return clean.length > max ? `${clean.slice(0, max - 1)}…` : clean;
}

/**
 * NIP-AXON-BRAIN-GALAXY — what AXON actually knows, grouped for a map view.
 * We sample per cluster rather than pulling everything: the graph is for
 * orientation, and the counts tell the true size.
 */
export async function loadBrainGraph(perCluster = 24): Promise<BrainCluster[]> {
  const { sbSelect } = getClient();

  const sources: {
    key: string;
    label: string;
    table: string;
    query: string;
    map: (row: Record<string, unknown>) => BrainNode;
  }[] = [
    {
      key: 'context',
      label: 'Context',
      table: 'Context',
      query: `select=id,context,updated_at&order=updated_at.desc&limit=${perCluster}`,
      map: (r) => ({
        id: `context-${String(r.id)}`,
        label: clip(String(r.context ?? '')),
        detail: String(r.context ?? ''),
        date: (r.updated_at as string) ?? null,
      }),
    },
    {
      key: 'decisions',
      label: 'Decisions',
      table: 'Decisions',
      query: `select=id,decision,outcome,date&order=date.desc&limit=${perCluster}`,
      map: (r) => ({
        id: `decision-${String(r.id)}`,
        label: clip(String(r.decision ?? '')),
        detail: [r.decision, r.outcome].filter(Boolean).join('\n\n'),
        date: (r.date as string) ?? null,
      }),
    },
    {
      key: 'learnings',
      label: 'Learnings',
      table: 'Learnings',
      query: `select=id,learning,source,date&order=date.desc&limit=${perCluster}`,
      map: (r) => ({
        id: `learning-${String(r.id)}`,
        label: clip(String(r.learning ?? '')),
        detail: String(r.learning ?? ''),
        date: (r.date as string) ?? null,
      }),
    },
    {
      key: 'memories',
      label: 'About You',
      table: 'axon_memories',
      query: `select=id,content,memory_type,created_at&order=created_at.desc&limit=${perCluster}`,
      map: (r) => ({
        id: `memory-${String(r.id)}`,
        label: clip(String(r.content ?? '')),
        detail: String(r.content ?? ''),
        date: (r.created_at as string) ?? null,
      }),
    },
  ];

  const clusters = await Promise.all(
    sources.map(async (src) => {
      try {
        const rows = ((await sbSelect(src.table, src.query)) || []) as Record<string, unknown>[];
        const nodes = rows.map(src.map).filter((n) => n.label.length > 0);
        return { key: src.key, label: src.label, total: nodes.length, nodes };
      } catch {
        // A single unreadable table must not blank the whole map.
        return { key: src.key, label: src.label, total: 0, nodes: [] };
      }
    }),
  );

  return clusters;
}
