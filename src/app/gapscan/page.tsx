'use client';

import React, { useState } from 'react';
import { MCPManagerModal } from '../../components/it/MCPManagerModal';
import { ITFeedbackWidget } from '../../components/it/ITFeedbackWidget';

const DEFAULT_MCPS = [
  {
    id: 'mcp-lighthouse',
    name: 'Lighthouse Performance Auditor',
    description: 'Automated Core Web Vitals, performance scores, and SEO audits',
    category: 'analytics',
    isEnabled: true,
  },
  {
    id: 'mcp-site-crawler',
    name: 'Site Crawler & Funnel Analyzer',
    description: 'Crawl domain URLs to identify broken links, form drop-offs, and UI bottlenecks',
    category: 'crawler',
    isEnabled: true,
  },
  {
    id: 'mcp-dom-inspector',
    name: 'DOM & Visual Inspector',
    description: 'Capture headless DOM snapshots to detect visual layout shifts',
    category: 'inspection',
    isEnabled: false,
  },
];

export default function GapScanPage() {
  const [tier, setTier] = useState<'free' | 'saas' | 'agentic'>('agentic');
  const [isMCPModalOpen, setIsMCPModalOpen] = useState(false);
  const [url, setUrl] = useState('');
  const [auditResult, setAuditResult] = useState<any>(null);
  const [isScanning, setIsScanning] = useState(false);

  const handleAudit = () => {
    if (!url) return;
    setIsScanning(true);
    setTimeout(() => {
      setAuditResult({
        performanceScore: 78,
        seoScore: 92,
        detectedGaps: [
          'High LCP (3.2s) on mobile landing hero image',
          'Checkout funnel lacks clear single-tap Stripe payment links',
          'Missing automated meta open-graph tags on blog subpages',
        ],
        recommendedActions: [
          'Optimize hero image via next/image WebP format',
          'Mount 1-click Apple Pay & Google Pay express buttons',
          'Add structured JSON-LD schema markup',
        ],
      });
      setIsScanning(false);
    }, 900);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6 flex flex-col items-center">
      <div className="max-w-4xl w-full space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-zinc-900 border border-zinc-800 p-5 rounded-xl">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-black tracking-tight text-white">GapScan</h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800 font-mono">
                IT · Sector 3
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1">Operational, funnel & website profit leak diagnostic scanner.</p>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={tier}
              onChange={(e) => setTier(e.target.value as any)}
              className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-200 font-semibold"
            >
              <option value="free">Free Trial (10 free scans)</option>
              <option value="saas">Standard Web Mode ($18/mo · Unlimited)</option>
              <option value="agentic">⚡ Autopilot Mode ($27.00/mo · Speed & Funnel Audits)</option>
            </select>

            <button
              onClick={() => setIsMCPModalOpen(true)}
              className="bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 rounded-lg px-3 py-2 text-xs font-semibold text-zinc-200 flex items-center gap-1.5 shadow transition"
            >
              <span>⚡ Connected Apps</span>
              {tier === 'agentic' && (
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              )}
            </button>
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-5">
          <div>
            <label className="text-xs font-semibold text-zinc-300">Target Website URL or Sales Funnel</label>
            <div className="flex gap-3 mt-1.5">
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
                className="flex-1 bg-zinc-950 border border-zinc-700 rounded-lg p-3 text-sm text-zinc-200 focus:outline-none focus:border-cyan-500"
              />
              <button
                onClick={handleAudit}
                disabled={isScanning || !url}
                className="bg-cyan-600 hover:bg-cyan-500 disabled:bg-zinc-800 text-zinc-950 font-bold text-xs px-6 py-2.5 rounded-lg shadow transition"
              >
                {isScanning ? 'Auditing Funnel...' : 'Run Gap Audit'}
              </button>
            </div>
          </div>

          {auditResult && (
            <div className="mt-4 pt-4 border-t border-zinc-800 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-zinc-950 p-4 rounded-lg border border-zinc-800 text-center">
                  <div className="text-2xl font-bold text-amber-400">{auditResult.performanceScore}/100</div>
                  <div className="text-xs text-zinc-400 mt-1">Core Performance</div>
                </div>
                <div className="bg-zinc-950 p-4 rounded-lg border border-zinc-800 text-center">
                  <div className="text-2xl font-bold text-emerald-400">{auditResult.seoScore}/100</div>
                  <div className="text-xs text-zinc-400 mt-1">SEO & Structural Health</div>
                </div>
              </div>

              <div>
                <span className="text-xs font-semibold text-rose-400">Critical Friction & Gaps Detected:</span>
                <ul className="mt-2 space-y-1.5 text-xs text-zinc-300">
                  {auditResult.detectedGaps.map((gap: string, i: number) => (
                    <li key={i} className="bg-zinc-950 p-2.5 rounded border border-zinc-800">
                      • {gap}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>

      <MCPManagerModal
        isOpen={isMCPModalOpen}
        onClose={() => setIsMCPModalOpen(false)}
        toolId="gapscan"
        tier={tier}
        defaultIntegrations={DEFAULT_MCPS}
      />

      <ITFeedbackWidget toolId="gapscan" />
    </div>
  );
}
