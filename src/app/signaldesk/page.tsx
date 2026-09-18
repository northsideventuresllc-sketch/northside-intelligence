'use client';

import React, { useState } from 'react';
import { MCPManagerModal } from '../../components/it/MCPManagerModal';
import { ITFeedbackWidget } from '../../components/it/ITFeedbackWidget';

const DEFAULT_MCPS = [
  {
    id: 'mcp-serp-search',
    name: 'Brave Web & SERP Search',
    description: 'Execute targeted real-time web searches on market shifts and competitor news',
    category: 'search',
    isEnabled: true,
  },
  {
    id: 'mcp-hn-ph',
    name: 'HackerNews & ProductHunt Scanner',
    description: 'Scan tech trends and emerging launches across developer hubs',
    category: 'social',
    isEnabled: true,
  },
  {
    id: 'mcp-github-trends',
    name: 'GitHub Trends Tracker',
    description: 'Monitor rapidly rising open-source repositories and competitor repos',
    category: 'developer',
    isEnabled: false,
  },
];

export default function SignalDeskPage() {
  const [tier, setTier] = useState<'free' | 'saas' | 'agentic'>('agentic');
  const [isMCPModalOpen, setIsMCPModalOpen] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [signals, setSignals] = useState<string[]>([]);
  const [isScanning, setIsScanning] = useState(false);

  const handleScan = () => {
    if (!keyword) return;
    setIsScanning(true);
    setTimeout(() => {
      setSignals([
        `🟢 Signal 1: Key competitor in "${keyword}" announced automated webhook integrations (+24% engagement).`,
        `🟡 Signal 2: Trending GitHub repo surfaced with 1.4k stars solving modular workflow orchestration.`,
        `🔵 Signal 3: ProductHunt top release today features self-hosted BYOK compliance features for enterprise teams.`,
      ]);
      setIsScanning(false);
    }, 850);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6 flex flex-col items-center">
      <div className="max-w-4xl w-full space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-zinc-900 border border-zinc-800 p-5 rounded-xl">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-black tracking-tight text-white">SignalDesk</h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-950 text-purple-400 border border-purple-800 font-mono">
                IT · Sector 3
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1">Intelligence signals aggregator & competitor trend surveillance engine.</p>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={tier}
              onChange={(e) => setTier(e.target.value as any)}
              className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-200 font-semibold"
            >
              <option value="free">Free Trial (10 free signals)</option>
              <option value="saas">Standard Web Mode ($24/mo · Unlimited)</option>
              <option value="agentic">⚡ Autopilot Mode ($36.00/mo · Live Web + Tech Trends)</option>
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
            <label className="text-xs font-semibold text-zinc-300">Target Industry, Niche, or Competitor Domain</label>
            <div className="flex gap-3 mt-1.5">
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="e.g. AI Customer Support / Agentic Frameworks / CRM Tooling"
                className="flex-1 bg-zinc-950 border border-zinc-700 rounded-lg p-3 text-sm text-zinc-200 focus:outline-none focus:border-purple-500"
              />
              <button
                onClick={handleScan}
                disabled={isScanning || !keyword}
                className="bg-purple-600 hover:bg-purple-500 disabled:bg-zinc-800 text-white font-bold text-xs px-6 py-2.5 rounded-lg shadow transition"
              >
                {isScanning ? 'Scanning...' : 'Scan Intelligence'}
              </button>
            </div>
          </div>

          {signals.length > 0 && (
            <div className="mt-4 pt-4 border-t border-zinc-800 space-y-3">
              <span className="text-xs font-semibold text-purple-400">Live Market Briefing Cards:</span>
              <div className="space-y-2">
                {signals.map((sig, idx) => (
                  <div key={idx} className="bg-zinc-950 p-3.5 rounded-lg border border-zinc-800 text-sm text-zinc-200">
                    {sig}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <MCPManagerModal
        isOpen={isMCPModalOpen}
        onClose={() => setIsMCPModalOpen(false)}
        toolId="signaldesk"
        tier={tier}
        defaultIntegrations={DEFAULT_MCPS}
      />

      <ITFeedbackWidget toolId="signaldesk" />
    </div>
  );
}
