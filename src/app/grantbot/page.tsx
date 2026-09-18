'use client';

import React, { useState } from 'react';
import { MCPManagerModal } from '../../components/it/MCPManagerModal';
import { ITFeedbackWidget } from '../../components/it/ITFeedbackWidget';

const DEFAULT_MCPS = [
  {
    id: 'mcp-grants-gov',
    name: 'Grants.gov Live Search',
    description: 'Search live federal and foundation grant databases and RFPs',
    category: 'search',
    isEnabled: true,
  },
  {
    id: 'mcp-doc-parser',
    name: 'Document & PDF Parser',
    description: 'Extract budget limits, deadlines, and eligibility rules from uploaded RFPs',
    category: 'parser',
    isEnabled: true,
  },
  {
    id: 'mcp-google-docs',
    name: 'Google Drive & Docs Exporter',
    description: 'Write approved proposal drafts straight into collaborative Google Docs',
    category: 'storage',
    isEnabled: false,
  },
];

export default function GrantBotPage() {
  const [tier, setTier] = useState<'free' | 'saas' | 'agentic'>('agentic');
  const [isMCPModalOpen, setIsMCPModalOpen] = useState(false);
  const [mission, setMission] = useState('');
  const [fundingAmount, setFundingAmount] = useState('');
  const [proposalOutput, setProposalOutput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = () => {
    if (!mission) return;
    setIsGenerating(true);
    setTimeout(() => {
      setProposalOutput(
        `# Executive Summary\n\n**Project Focus:** ${mission}\n**Requested Funding:** ${fundingAmount || '$50,000'}\n\n## 1. Problem Statement & Community Need\nThis initiative addresses critical gaps in access and community support through targeted interventions and measurable milestone tracking.\n\n## 2. Project Goals & Deliverables\n- Phase 1: Community intake and baseline metrics.\n- Phase 2: Core curriculum & programmatic execution.\n- Phase 3: Impact evaluation and stakeholder reporting.\n\n## 3. Budget Narrative\nAllocation prioritized across direct participant materials (65%), programmatic personnel (25%), and evaluation reporting (10%).`
      );
      setIsGenerating(false);
    }, 900);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6 flex flex-col items-center">
      <div className="max-w-4xl w-full space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-zinc-900 border border-zinc-800 p-5 rounded-xl">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-black tracking-tight text-white">GrantBot</h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 font-mono">
                IT · Sector 3
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1">End-to-end AI grant discovery & structured proposal drafting suite.</p>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={tier}
              onChange={(e) => setTier(e.target.value as any)}
              className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-200 font-semibold"
            >
              <option value="free">Free Trial (5 free grants)</option>
              <option value="saas">Standard Web Mode ($39/mo · Unlimited)</option>
              <option value="agentic">⚡ Autopilot Mode ($58.50/mo · Grants.gov + Google Docs)</option>
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

        {/* Input Interface */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-zinc-300">Organization Mission & Project Scope</label>
              <textarea
                value={mission}
                onChange={(e) => setMission(e.target.value)}
                rows={4}
                placeholder="Describe your non-profit or research initiative, community problem, and proposed solution..."
                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-3 text-sm text-zinc-200 mt-1.5 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-zinc-300">Target Budget / Amount</label>
              <input
                type="text"
                value={fundingAmount}
                onChange={(e) => setFundingAmount(e.target.value)}
                placeholder="e.g. $75,000"
                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-3 text-sm text-zinc-200 mt-1.5 focus:outline-none focus:border-emerald-500"
              />
              <div className="mt-4 p-3 bg-zinc-950 rounded border border-zinc-800 text-xs text-zinc-400">
                <span className="text-emerald-400 font-semibold block mb-1">Interactive Parser:</span>
                Agentic tier automatically cross-references uploaded RFPs with Grants.gov criteria.
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !mission}
              className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-800 text-zinc-950 font-bold text-xs px-6 py-2.5 rounded-lg shadow transition"
            >
              {isGenerating ? 'Structuring Proposal...' : 'Draft Complete Grant Narrative'}
            </button>
          </div>

          {proposalOutput && (
            <div className="mt-4 pt-4 border-t border-zinc-800 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-emerald-400">Structured Proposal Output:</span>
                <button
                  onClick={() => navigator.clipboard.writeText(proposalOutput)}
                  className="text-xs bg-zinc-800 hover:bg-zinc-700 px-2.5 py-1 rounded text-zinc-300"
                >
                  Copy Proposal
                </button>
              </div>
              <div className="bg-zinc-950 p-4 rounded-lg border border-zinc-800 text-sm whitespace-pre-wrap text-zinc-200 font-sans">
                {proposalOutput}
              </div>
            </div>
          )}
        </div>
      </div>

      <MCPManagerModal
        isOpen={isMCPModalOpen}
        onClose={() => setIsMCPModalOpen(false)}
        toolId="grantbot"
        tier={tier}
        defaultIntegrations={DEFAULT_MCPS}
      />

      <ITFeedbackWidget toolId="grantbot" />
    </div>
  );
}
