'use client';

import React, { useState } from 'react';
import { MCPManagerModal } from '../../components/it/MCPManagerModal';
import { ITFeedbackWidget } from '../../components/it/ITFeedbackWidget';

const DEFAULT_MCPS = [
  {
    id: 'mcp-multi-llm',
    name: 'Multi-Model LLM Gateway',
    description: 'Route execution steps across OpenAI, Anthropic, Gemini, and local AXON models',
    category: 'ai',
    isEnabled: true,
  },
  {
    id: 'mcp-zapier-bridge',
    name: 'Zapier & Make Automation',
    description: 'Trigger multi-step Zapier and Make webhooks with structured JSON outputs',
    category: 'automation',
    isEnabled: true,
  },
  {
    id: 'mcp-supabase-db',
    name: 'Supabase & Postgres Connector',
    description: 'Directly read and write structured pipeline outputs into user databases',
    category: 'database',
    isEnabled: false,
  },
];

export default function BridgeAIPage() {
  const [tier, setTier] = useState<'free' | 'saas' | 'agentic'>('agentic');
  const [isMCPModalOpen, setIsMCPModalOpen] = useState(false);
  const [workflowPrompt, setWorkflowPrompt] = useState('');
  const [pipelineOutput, setPipelineOutput] = useState<any>(null);
  const [isRunning, setIsRunning] = useState(false);

  const handleRunWorkflow = () => {
    if (!workflowPrompt) return;
    setIsRunning(true);
    setTimeout(() => {
      setPipelineOutput({
        stepsExecuted: [
          { step: 1, name: 'Input Intake & Model Classification', status: 'completed' },
          { step: 2, name: 'Gemini 2.5 Pro Schema Formatting', status: 'completed' },
          { step: 3, name: 'MCP Webhook Dispatch to Zapier', status: 'completed' },
        ],
        payload: {
          status: 'success',
          target_nodes: 3,
          duration_ms: 412,
        },
      });
      setIsRunning(false);
    }, 850);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6 flex flex-col items-center">
      <div className="max-w-4xl w-full space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-zinc-900 border border-zinc-800 p-5 rounded-xl">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-black tracking-tight text-white">BridgeAI</h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-950 text-indigo-400 border border-indigo-800 font-mono">
                IT · Sector 3
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1">Cross-platform AI orchestration hub, webhook bridges & multi-model chaining.</p>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={tier}
              onChange={(e) => setTier(e.target.value as any)}
              className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-200 font-semibold"
            >
              <option value="free">Free Trial (10 free workflows)</option>
              <option value="saas">Standard Web Mode ($29/mo · Unlimited)</option>
              <option value="agentic">⚡ Autopilot Mode ($43.50/mo · Multi-AI + Zapier Bridges)</option>
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
            <label className="text-xs font-semibold text-zinc-300">Orchestration Instruction / Workflow Bridge</label>
            <textarea
              value={workflowPrompt}
              onChange={(e) => setWorkflowPrompt(e.target.value)}
              rows={4}
              placeholder="e.g. When a new customer record arrives, summarize with Claude Haiku, format JSON via Gemini, and dispatch to Zapier webhook..."
              className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-3 text-sm text-zinc-200 mt-1.5 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleRunWorkflow}
              disabled={isRunning || !workflowPrompt}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-800 text-white font-bold text-xs px-6 py-2.5 rounded-lg shadow transition"
            >
              {isRunning ? 'Executing Bridge...' : 'Trigger Pipeline Orchestration'}
            </button>
          </div>

          {pipelineOutput && (
            <div className="mt-4 pt-4 border-t border-zinc-800 space-y-3">
              <span className="text-xs font-semibold text-indigo-400">Pipeline Execution Trace:</span>
              <div className="space-y-2">
                {pipelineOutput.stepsExecuted.map((st: any) => (
                  <div key={st.step} className="bg-zinc-950 p-3 rounded-lg border border-zinc-800 flex justify-between items-center text-xs">
                    <span className="text-zinc-300">Step {st.step}: {st.name}</span>
                    <span className="text-emerald-400 font-mono">✓ {st.status}</span>
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
        toolId="bridgeai"
        tier={tier}
        defaultIntegrations={DEFAULT_MCPS}
      />

      <ITFeedbackWidget toolId="bridgeai" />
    </div>
  );
}
