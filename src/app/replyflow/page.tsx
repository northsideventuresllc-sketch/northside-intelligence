'use client';

import React, { useState } from 'react';
import { MCPManagerModal } from '../../components/it/MCPManagerModal';
import { ITFeedbackWidget } from '../../components/it/ITFeedbackWidget';

const DEFAULT_MCPS = [
  // Email & Support Hubs
  {
    id: 'mcp-gmail',
    name: 'Email & Gmail Client',
    description: 'Fetch incoming customer emails and draft instant responses directly in client',
    category: 'email',
    isEnabled: true,
  },
  {
    id: 'mcp-zendesk',
    name: 'Zendesk & HelpDesk Hub',
    description: 'Query customer ticket history and sync drafted resolutions',
    category: 'crm',
    isEnabled: false,
  },
  {
    id: 'mcp-slack',
    name: 'Slack & Discord Messenger',
    description: 'Monitor support channels and post verified replies directly',
    category: 'chat',
    isEnabled: false,
  },
  // Social Media Management Platforms
  {
    id: 'mcp-buffer',
    name: 'Buffer Management Platform',
    description: 'Sync scheduled drafts and reply queues across all connected Buffer channels',
    category: 'social-platform',
    isEnabled: false,
  },
  {
    id: 'mcp-hootsuite',
    name: 'Hootsuite Streams Hub',
    description: 'Monitor brand mentions, inbox streams, and dispatch approved social responses',
    category: 'social-platform',
    isEnabled: false,
  },
  // Individual Social Networks
  {
    id: 'mcp-twitter-x',
    name: 'Twitter / X API Connector',
    description: 'Auto-scan mentions, quote tweets, and DMs with 1-tap contextual reply dispatch',
    category: 'social-network',
    isEnabled: true,
  },
  {
    id: 'mcp-linkedin',
    name: 'LinkedIn Direct & Post Engagement',
    description: 'Draft executive commentary and direct message responses for B2B accounts',
    category: 'social-network',
    isEnabled: true,
  },
  {
    id: 'mcp-meta-instagram',
    name: 'Instagram & Meta Business Suite',
    description: 'Capture Instagram DMs, story replies, and post comments for instant support',
    category: 'social-network',
    isEnabled: false,
  },
  {
    id: 'mcp-reddit',
    name: 'Reddit Community Scanner',
    description: 'Track brand keywords on target subreddits and generate helpful community replies',
    category: 'social-network',
    isEnabled: false,
  },
  {
    id: 'mcp-youtube',
    name: 'YouTube Comments Manager',
    description: 'Synthesize helpful responses to video comments and customer inquiries',
    category: 'social-network',
    isEnabled: false,
  },
];

export default function ReplyFlowPage() {
  const [tier, setTier] = useState<'free' | 'saas' | 'agentic'>('agentic');
  const [isMCPModalOpen, setIsMCPModalOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [tone, setTone] = useState('Professional');
  const [generatedReply, setGeneratedReply] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = () => {
    if (!inputMessage) return;
    setIsGenerating(true);
    setTimeout(() => {
      setGeneratedReply(
        `Hi there,\n\nThank you for reaching out to us. We truly appreciate your patience. Based on your inquiry regarding "${inputMessage.slice(0, 30)}...", we have verified the details and have applied the requested adjustments to your account.\n\nPlease let us know if you have any further questions!\n\nBest regards,\nCustomer Support Team`
      );
      setIsGenerating(false);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6 flex flex-col items-center">
      <div className="max-w-4xl w-full space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-zinc-900 border border-zinc-800 p-5 rounded-xl">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-black tracking-tight text-white">ReplyFlow</h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-950 text-blue-400 border border-blue-800 font-mono">
                IT · Sector 3
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1">Instant customer response and automated support reply generator.</p>
          </div>

          <div className="flex items-center gap-3">
            {/* Simple Tier Switcher */}
            <select
              value={tier}
              onChange={(e) => setTier(e.target.value as any)}
              className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-200 font-semibold"
            >
              <option value="free">Free Trial (10 free replies)</option>
              <option value="saas">Standard Web Mode ($15/mo · Unlimited)</option>
              <option value="agentic">⚡ Autopilot Mode ($22.50/mo · Connects to Email & Socials)</option>
            </select>

            {/* Connected Apps Button */}
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

        {/* Main Interface */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-5">
          <div>
            <label className="text-xs font-semibold text-zinc-300">Customer Message / Inquiry / Email</label>
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              rows={4}
              placeholder="Paste customer message, DM, or support inquiry here..."
              className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-3 text-sm text-zinc-200 mt-1.5 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-400">Tone:</span>
              {['Professional', 'Friendly', 'Empathetic', 'Firm'].map((t) => (
                <button
                  key={t}
                  onClick={() => setTone(t)}
                  className={`px-3 py-1 rounded-md text-xs font-medium border ${tone === t ? 'bg-blue-600 border-blue-500 text-white' : 'bg-zinc-800 border-zinc-700 text-zinc-400'}`}
                >
                  {t}
                </button>
              ))}
            </div>

            <button
              onClick={handleGenerate}
              disabled={isGenerating || !inputMessage}
              className="bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-800 text-white text-xs font-bold px-5 py-2.5 rounded-lg shadow transition"
            >
              {isGenerating ? 'Synthesizing...' : 'Generate On-Brand Reply'}
            </button>
          </div>

          {generatedReply && (
            <div className="mt-4 pt-4 border-t border-zinc-800 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-emerald-400">Generated Reply:</span>
                <button
                  onClick={() => navigator.clipboard.writeText(generatedReply)}
                  className="text-xs bg-zinc-800 hover:bg-zinc-700 px-2.5 py-1 rounded text-zinc-300"
                >
                  Copy to Clipboard
                </button>
              </div>
              <div className="bg-zinc-950 p-4 rounded-lg border border-zinc-800 text-sm whitespace-pre-wrap text-zinc-200 font-sans">
                {generatedReply}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MCP Manager Modal */}
      <MCPManagerModal
        isOpen={isMCPModalOpen}
        onClose={() => setIsMCPModalOpen(false)}
        toolId="replyflow"
        tier={tier}
        defaultIntegrations={DEFAULT_MCPS}
      />

      {/* Persistent Feedback Widget */}
      <ITFeedbackWidget toolId="replyflow" />
    </div>
  );
}
