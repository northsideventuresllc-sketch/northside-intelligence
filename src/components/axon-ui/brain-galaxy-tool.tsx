'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import type { BrainCluster, BrainNode } from '@/lib/axon/brain-graph';

const CLUSTER_COLOR: Record<string, string> = {
  context: '#60a5fa',
  decisions: '#c9a962',
  learnings: '#2dd4bf',
  memories: '#818cf8',
};

/**
 * NIP-AXON-BRAIN-GALAXY — Obsidian-style map of what AXON knows.
 * Layout is deterministic (fixed angles per index), so the map does not
 * reshuffle on every render and JB can build a spatial memory of it.
 */
export function BrainGalaxyTool({
  clusters,
  basePath,
}: {
  clusters: BrainCluster[];
  basePath: string;
}) {
  const [hovered, setHovered] = useState<BrainNode | null>(null);
  const [focus, setFocus] = useState<string | null>(null);

  const size = 720;
  const center = size / 2;

  const laidOut = useMemo(() => {
    const live = clusters.filter((c) => c.nodes.length > 0);
    return live.map((cluster, ci) => {
      const clusterAngle = (2 * Math.PI * ci) / Math.max(live.length, 1) - Math.PI / 2;
      const clusterRadius = 190;
      const cx = center + clusterRadius * Math.cos(clusterAngle);
      const cy = center + clusterRadius * Math.sin(clusterAngle);

      const nodes = cluster.nodes.map((node, ni) => {
        const ring = Math.floor(ni / 8);
        const inRing = ni % 8;
        const r = 46 + ring * 34;
        const a = (2 * Math.PI * inRing) / 8 + ring * 0.4;
        return { node, x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
      });

      return { cluster, cx, cy, nodes };
    });
  }, [clusters, center]);

  const total = clusters.reduce((n, c) => n + c.total, 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">AXON Brain</h1>
          <p className="mt-1 max-w-xl text-sm text-axon-muted">
            Everything AXON knows, mapped. Hover a dot to read it. {total} things stored.
          </p>
        </div>
        <Link
          href={`${basePath}/dashboard`}
          className="rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white"
        >
          Back
        </Link>
      </div>

      <div className="flex flex-wrap gap-2">
        {clusters.map((c) => (
          <button
            key={c.key}
            type="button"
            onClick={() => setFocus(focus === c.key ? null : c.key)}
            className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
              focus === c.key ? 'text-black' : 'text-axon-muted hover:text-white'
            }`}
            style={
              focus === c.key
                ? { background: CLUSTER_COLOR[c.key], borderColor: CLUSTER_COLOR[c.key] }
                : { borderColor: 'rgba(255,255,255,0.15)' }
            }
          >
            {c.label} ({c.total})
          </button>
        ))}
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#050b16]">
        <svg viewBox={`0 0 ${size} ${size}`} className="h-auto w-full">
          <circle cx={center} cy={center} r={26} fill="#0a1424" stroke="#60a5fa" strokeWidth={2} />
          <text
            x={center}
            y={center + 4}
            textAnchor="middle"
            className="fill-white text-[13px] font-bold"
          >
            AXON
          </text>

          {laidOut.map(({ cluster, cx, cy, nodes }) => {
            const color = CLUSTER_COLOR[cluster.key] ?? '#7a8fa8';
            const dim = focus !== null && focus !== cluster.key;
            return (
              <g key={cluster.key} opacity={dim ? 0.15 : 1}>
                <line
                  x1={center}
                  y1={center}
                  x2={cx}
                  y2={cy}
                  stroke={color}
                  strokeWidth={1.5}
                  opacity={0.4}
                />
                {nodes.map(({ node, x, y }) => (
                  <g key={node.id}>
                    <line x1={cx} y1={cy} x2={x} y2={y} stroke={color} strokeWidth={0.6} opacity={0.25} />
                    <circle
                      cx={x}
                      cy={y}
                      r={hovered?.id === node.id ? 7 : 4.5}
                      fill={color}
                      opacity={hovered?.id === node.id ? 1 : 0.75}
                      className="cursor-pointer transition-all"
                      onMouseEnter={() => setHovered(node)}
                      onFocus={() => setHovered(node)}
                      tabIndex={0}
                    />
                  </g>
                ))}
                <circle cx={cx} cy={cy} r={13} fill="#0a1424" stroke={color} strokeWidth={1.5} />
                <text
                  x={cx}
                  y={cy - 22}
                  textAnchor="middle"
                  className="text-[12px] font-semibold"
                  fill={color}
                >
                  {cluster.label}
                </text>
              </g>
            );
          })}
        </svg>

        <div className="border-t border-white/10 bg-black/40 p-4">
          {hovered ? (
            <>
              <p className="text-sm text-white">{hovered.detail.slice(0, 600)}</p>
              {hovered.date ? (
                <p className="mt-1 text-xs text-axon-muted">
                  {new Date(hovered.date).toLocaleDateString()}
                </p>
              ) : null}
            </>
          ) : (
            <p className="text-sm text-axon-muted">Hover any dot to read what it holds.</p>
          )}
        </div>
      </div>
    </div>
  );
}
