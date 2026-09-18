'use client';

import React, { useState } from 'react';

interface MCPIntegration {
  id: string;
  name: string;
  description: string;
  category: string;
  isEnabled: boolean;
  endpoint?: string;
  isCustom?: boolean;
}

interface MCPManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  toolId: string;
  tier: 'free' | 'saas' | 'agentic' | 'open_weight';
  defaultIntegrations: MCPIntegration[];
}

export const MCPManagerModal: React.FC<MCPManagerModalProps> = ({
  isOpen,
  onClose,
  toolId,
  tier,
  defaultIntegrations,
}) => {
  const [integrations, setIntegrations] = useState<MCPIntegration[]>(defaultIntegrations);
  const [activeTab, setActiveTab] = useState<'defaults' | 'custom' | 'byok'>('defaults');
  const [customName, setCustomName] = useState('');
  const [customEndpoint, setCustomEndpoint] = useState('');
  const [customAuth, setCustomAuth] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [apiProvider, setApiProvider] = useState('openai');
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const isAgenticTier = tier === 'agentic' || tier === 'open_weight';

  const toggleIntegration = (id: string) => {
    if (!isAgenticTier) return;
    setIntegrations((prev) =>
      prev.map((item) => (item.id === id ? { ...item, isEnabled: !item.isEnabled } : item))
    );
  };

  const handleAddCustomMCP = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName || !customEndpoint) return;
    const newMcp: MCPIntegration = {
      id: `custom-${Date.now()}`,
      name: customName,
      description: 'Your custom connected app',
      category: 'custom',
      isEnabled: true,
      endpoint: customEndpoint,
      isCustom: true,
    };
    setIntegrations([...integrations, newMcp]);
    setCustomName('');
    setCustomEndpoint('');
    setCustomAuth('');
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl max-w-2xl w-full p-6 text-zinc-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex justify-between items-start pb-4 border-b border-zinc-800">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white">⚡ Connected Apps & Autopilot</h2>
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${isAgenticTier ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-amber-950 text-amber-400 border border-amber-800'}`}>
                {isAgenticTier ? 'Autopilot Active' : 'Standard Web Mode'}
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Connect this tool directly to your email, social accounts, and apps so it can do the work for you automatically.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-200 text-lg p-1.5 rounded-lg hover:bg-zinc-800 transition"
          >
            ✕
          </button>
        </div>

        {/* Upgrade Banner if not on Autopilot / Agentic Tier */}
        {!isAgenticTier && (
          <div className="my-4 p-4 bg-amber-950/40 border border-amber-700/60 rounded-xl text-xs text-amber-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <span className="font-bold text-amber-300 block mb-0.5">Want this tool to connect to your outside apps?</span>
              <span>Upgrade to the <strong>Autopilot Tier</strong> to link your Gmail, Slack, Twitter, and custom apps with 1-click.</span>
            </div>
            <button className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold px-4 py-2 rounded-lg text-xs whitespace-nowrap shadow">
              Unlock Autopilot (+50%)
            </button>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex border-b border-zinc-800 my-3 gap-6 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('defaults')}
            className={`pb-2.5 transition ${activeTab === 'defaults' ? 'text-blue-400 border-b-2 border-blue-500' : 'text-zinc-400 hover:text-zinc-300'}`}
          >
            1-Click App Connections ({integrations.filter((i) => !i.isCustom).length})
          </button>
          <button
            onClick={() => setActiveTab('custom')}
            className={`pb-2.5 transition ${activeTab === 'custom' ? 'text-blue-400 border-b-2 border-blue-500' : 'text-zinc-400 hover:text-zinc-300'}`}
          >
            Connect Any Other App
          </button>
          <button
            onClick={() => setActiveTab('byok')}
            className={`pb-2.5 transition ${activeTab === 'byok' ? 'text-blue-400 border-b-2 border-blue-500' : 'text-zinc-400 hover:text-zinc-300'}`}
          >
            Use Your Own AI Account (Optional)
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto pr-1">
          {activeTab === 'defaults' && (
            <div className="space-y-2.5">
              <p className="text-[11px] text-zinc-400 mb-2">
                Turn on any app connection below to let this tool read information and send responses automatically.
              </p>
              {integrations
                .filter((i) => !i.isCustom)
                .map((mcp) => (
                  <div
                    key={mcp.id}
                    className="p-3.5 bg-zinc-950/80 border border-zinc-800 rounded-xl flex items-center justify-between hover:border-zinc-700 transition"
                  >
                    <div>
                      <div className="font-bold text-sm text-zinc-200">{mcp.name}</div>
                      <div className="text-xs text-zinc-400 mt-0.5">{mcp.description}</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer ml-3">
                      <input
                        type="checkbox"
                        checked={mcp.isEnabled}
                        disabled={!isAgenticTier}
                        onChange={() => toggleIntegration(mcp.id)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                ))}
            </div>
          )}

          {activeTab === 'custom' && (
            <div className="space-y-4">
              <form onSubmit={handleAddCustomMCP} className="space-y-3 bg-zinc-950 p-4 border border-zinc-800 rounded-xl">
                <div>
                  <h3 className="text-sm font-bold text-zinc-200">Connect a Custom App or Internal Tool</h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    If your team uses a custom CRM, database, or internal software, you can connect it here by pasting its web link.
                  </p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-zinc-300">Connection Name</label>
                  <input
                    type="text"
                    value={customName}
                    disabled={!isAgenticTier}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="e.g. My Company Helpdesk"
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-2.5 text-xs text-zinc-200 mt-1"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-zinc-300">App Web Link / Address</label>
                  <input
                    type="url"
                    value={customEndpoint}
                    disabled={!isAgenticTier}
                    onChange={(e) => setCustomEndpoint(e.target.value)}
                    placeholder="https://mycompany.com/api/connector"
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-2.5 text-xs text-zinc-200 mt-1"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-zinc-300">Security Password / Token (If needed)</label>
                  <input
                    type="password"
                    value={customAuth}
                    disabled={!isAgenticTier}
                    onChange={(e) => setCustomAuth(e.target.value)}
                    placeholder="Optional secret key provided by your IT admin"
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-2.5 text-xs text-zinc-200 mt-1"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!isAgenticTier}
                  className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-800 text-white font-bold p-2.5 rounded-lg text-xs transition"
                >
                  Save & Link Connection
                </button>
              </form>

              {savedSuccess && (
                <div className="p-3 bg-emerald-950 text-emerald-300 border border-emerald-800 rounded-lg text-xs text-center font-medium">
                  ✓ Connection successfully linked and ready to use!
                </div>
              )}
            </div>
          )}

          {activeTab === 'byok' && (
            <div className="space-y-4">
              <div className="bg-zinc-950 p-5 border border-zinc-800 rounded-xl space-y-3">
                <h3 className="text-sm font-bold text-zinc-200">Connect Your Own AI Account (Optional Backup)</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  All subscriptions come with built-in AI power. If you are doing massive amounts of work and ever run out of monthly credits, you can plug in your own OpenAI, Google, or Anthropic account key so your automations never pause.
                </p>
                <div>
                  <label className="text-xs font-semibold text-zinc-300">AI Provider</label>
                  <select
                    value={apiProvider}
                    onChange={(e) => setApiProvider(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-2.5 text-xs text-zinc-200 mt-1"
                  >
                    <option value="openai">OpenAI (ChatGPT / GPT-4o)</option>
                    <option value="anthropic">Anthropic (Claude 3.5)</option>
                    <option value="gemini">Google Gemini</option>
                    <option value="groq">Groq (Ultra-Fast)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-zinc-300">Your Account Secret Key</label>
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Paste secret key here..."
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-2.5 text-xs text-zinc-200 mt-1"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSavedSuccess(true);
                    setTimeout(() => setSavedSuccess(false), 2500);
                  }}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-bold p-2.5 rounded-lg text-xs transition"
                >
                  Save My AI Key
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="pt-4 border-t border-zinc-800 flex justify-end">
          <button
            onClick={onClose}
            className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-5 py-2 rounded-lg text-xs font-semibold transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
