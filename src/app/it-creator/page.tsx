'use client';

import React, { useState } from 'react';
import { ITFeedbackWidget } from '../../components/it/ITFeedbackWidget';

export default function ITCreatorPage() {
  const [toolName, setToolName] = useState('');
  const [slug, setSlug] = useState('');
  const [tagline, setTagline] = useState('');
  const [description, setDescription] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [saasPrice, setSaasPrice] = useState('19');
  const [selectedMCPs, setSelectedMCPs] = useState<string[]>([
    'mcp-serp-search',
    'mcp-doc-parser',
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdResult, setCreatedResult] = useState<any>(null);

  // Dynamic calculation for the new Agentic Tier (+50%)
  const basePriceNum = parseFloat(saasPrice) || 0;
  const agenticPrice = (basePriceNum * 1.5).toFixed(2);

  const availableMCPs = [
    { id: 'mcp-gmail', name: 'Email & Gmail Client', category: 'Support / Comms' },
    { id: 'mcp-twitter-x', name: 'Twitter / X API Connector', category: 'Social' },
    { id: 'mcp-linkedin', name: 'LinkedIn Engagement', category: 'Social' },
    { id: 'mcp-buffer', name: 'Buffer Social Manager', category: 'Social Management' },
    { id: 'mcp-grants-gov', name: 'Grants.gov Search', category: 'Public Data' },
    { id: 'mcp-doc-parser', name: 'Document & PDF Parser', category: 'Parsing' },
    { id: 'mcp-serp-search', name: 'Brave/SERP Web Search', category: 'Intelligence' },
    { id: 'mcp-hn-ph', name: 'HackerNews & ProductHunt', category: 'Trends' },
    { id: 'mcp-github-trends', name: 'GitHub Trends', category: 'Code' },
    { id: 'mcp-lighthouse', name: 'Lighthouse Auditor', category: 'Performance' },
    { id: 'mcp-site-crawler', name: 'Site Crawler', category: 'Diagnostics' },
    { id: 'mcp-multi-llm', name: 'Multi-Model LLM Gateway', category: 'AI Routing' },
    { id: 'mcp-zapier-bridge', name: 'Zapier / Make Webhooks', category: 'Automation' },
    { id: 'mcp-supabase-db', name: 'Supabase DB Sync', category: 'Storage' },
  ];

  const toggleMCP = (id: string) => {
    setSelectedMCPs((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleNameChange = (name: string) => {
    setToolName(name);
    setSlug(name.toLowerCase().replace(/[^a-z0-9]/g, ''));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!toolName || !slug || !description) return;
    setIsSubmitting(true);

    // Call API / scaffold endpoint
    setTimeout(() => {
      setCreatedResult({
        name: toolName,
        slug,
        route: `/${slug}`,
        saasPrice: `$${basePriceNum}/mo`,
        agenticPrice: `$${agenticPrice}/mo`,
        mcps: selectedMCPs,
        status: 'Scaffolded & Registered',
      });
      setIsSubmitting(false);
    }, 900);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6 flex flex-col items-center">
      <div className="max-w-4xl w-full space-y-6">
        {/* Header */}
        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-xl flex justify-between items-center">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-black text-white">IT Creator Studio</h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 font-mono">
                JB Direct Intake · Sector 3
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Submit new IT tool concepts. Automatically generates 3-tier pricing, wires default MCPs, mounts feedback & connects the weekly evolution agent.
            </p>
          </div>
        </div>

        {createdResult ? (
          <div className="bg-zinc-900 border border-emerald-700/60 rounded-xl p-6 space-y-4">
            <div className="flex items-center gap-3 text-emerald-400 font-bold text-lg">
              <span>✓ New IT Tool Successfully Scaffolded!</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-zinc-950 rounded border border-zinc-800">
                <span className="text-zinc-400 block">Tool Name</span>
                <span className="font-bold text-zinc-200">{createdResult.name}</span>
              </div>
              <div className="p-3 bg-zinc-950 rounded border border-zinc-800">
                <span className="text-zinc-400 block">Route</span>
                <span className="font-mono text-blue-400">{createdResult.route}</span>
              </div>
              <div className="p-3 bg-zinc-950 rounded border border-zinc-800">
                <span className="text-zinc-400 block">SaaS Standard</span>
                <span className="font-bold text-zinc-200">{createdResult.saasPrice}</span>
              </div>
              <div className="p-3 bg-zinc-950 rounded border border-zinc-800">
                <span className="text-zinc-400 block">⚡ Agentic Tier</span>
                <span className="font-bold text-emerald-400">{createdResult.agenticPrice}</span>
              </div>
            </div>

            <div className="p-3 bg-zinc-950 rounded border border-zinc-800 text-xs">
              <span className="text-zinc-400 block mb-1">Pre-Wired MCP Integrations ({createdResult.mcps.length}):</span>
              <div className="flex flex-wrap gap-1.5">
                {createdResult.mcps.map((m: string) => (
                  <span key={m} className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono text-[11px]">
                    {m}
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-3">
              <button
                onClick={() => setCreatedResult(null)}
                className="bg-zinc-800 hover:bg-zinc-700 px-4 py-2 rounded-lg text-xs font-semibold text-zinc-200"
              >
                Submit Another Concept
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-5">
            {/* Tool Identity */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-zinc-300">Tool Name</label>
                <input
                  type="text"
                  value={toolName}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g. PitchForge"
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-2.5 text-xs text-zinc-200 mt-1 focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-zinc-300">URL Slug / Route</label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''))}
                  placeholder="e.g. pitchforge"
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-2.5 text-xs text-zinc-200 font-mono mt-1 focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>
            </div>

            {/* Tagline & Audience */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-zinc-300">One-Line Hook / Tagline</label>
                <input
                  type="text"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  placeholder="e.g. Automated venture pitch deck and investor memo builder."
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-2.5 text-xs text-zinc-200 mt-1 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-zinc-300">Target Audience</label>
                <input
                  type="text"
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  placeholder="e.g. Startup founders, incubators, pitch coaches."
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-2.5 text-xs text-zinc-200 mt-1 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="text-xs font-semibold text-zinc-300">Core Workflow & Capabilities</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Describe how the tool functions, what inputs it takes, and what formatted output it generates..."
                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-2.5 text-xs text-zinc-200 mt-1 focus:outline-none focus:border-emerald-500"
                required
              />
            </div>

            {/* Pricing Configurator */}
            <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl space-y-3">
              <div>
                <span className="text-xs font-bold text-zinc-200 block">3-Tier Pricing Model (Automatically Calculated)</span>
                <p className="text-[11px] text-zinc-400 mt-0.5">Enter the standard web price below; the Autopilot tier price is calculated automatically.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-lg">
                  <span className="text-zinc-400 block font-medium">Free Trial</span>
                  <span className="font-bold text-zinc-200">$0 / mo</span>
                  <span className="text-[11px] text-zinc-500 block mt-1">10 free trial uses / mo</span>
                </div>
                <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-lg">
                  <span className="text-zinc-400 block font-medium">Standard Web Mode ($/mo)</span>
                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-zinc-400">$</span>
                    <input
                      type="number"
                      value={saasPrice}
                      onChange={(e) => setSaasPrice(e.target.value)}
                      className="w-16 bg-zinc-950 border border-zinc-700 rounded p-1 text-xs text-zinc-200 font-semibold"
                    />
                  </div>
                  <span className="text-[11px] text-zinc-500 block mt-1">Unlimited browser use</span>
                </div>
                <div className="p-3 bg-zinc-900 border border-emerald-800/80 rounded-lg bg-emerald-950/20">
                  <span className="text-emerald-400 block font-bold">⚡ Autopilot Tier (+50%)</span>
                  <span className="font-bold text-emerald-300 text-sm">${agenticPrice} / mo</span>
                  <span className="text-[11px] text-emerald-400/80 block mt-1">Direct app connections & background work</span>
                </div>
              </div>
            </div>

            {/* Default MCP Selection */}
            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-2">
                Select Pre-Wired Default MCP Connectors:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {availableMCPs.map((mcp) => {
                  const isChecked = selectedMCPs.includes(mcp.id);
                  return (
                    <div
                      key={mcp.id}
                      onClick={() => toggleMCP(mcp.id)}
                      className={`p-2.5 rounded-lg border cursor-pointer flex items-center justify-between transition ${isChecked ? 'bg-zinc-800 border-blue-500 text-zinc-100' : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'}`}
                    >
                      <div>
                        <div className="font-semibold text-xs text-zinc-200">{mcp.name}</div>
                        <div className="text-[10px] text-zinc-500">{mcp.category}</div>
                      </div>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        className="rounded border-zinc-700 bg-zinc-900 text-blue-600 focus:ring-0"
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isSubmitting || !toolName || !slug}
                className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-800 text-zinc-950 font-bold text-xs px-6 py-2.5 rounded-lg shadow transition"
              >
                {isSubmitting ? 'Scaffolding IT...' : 'Create & Register New IT Tool'}
              </button>
            </div>
          </form>
        )}
      </div>

      <ITFeedbackWidget toolId="it-creator" />
    </div>
  );
}
