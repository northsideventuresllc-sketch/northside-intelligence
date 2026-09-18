'use client';

import React, { useState } from 'react';

interface ITFeedbackWidgetProps {
  toolId: string;
}

export const ITFeedbackWidget: React.FC<ITFeedbackWidgetProps> = ({ toolId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [feedbackType, setFeedbackType] = useState<'idea' | 'bug' | 'general'>('idea');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description) return;
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toolId,
          feedbackType,
          title,
          description,
          metadata: {
            url: typeof window !== 'undefined' ? window.location.href : '',
            userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
            timestamp: new Date().toISOString(),
          },
        }),
      });

      if (res.ok) {
        setSubmitted(true);
        setTitle('');
        setDescription('');
        setTimeout(() => {
          setSubmitted(false);
          setIsOpen(false);
        }, 2000);
      }
    } catch (err) {
      console.error('Failed to submit feedback', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Floating Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-40 bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300 hover:text-zinc-100 border border-zinc-700/80 rounded-full px-3 py-1.5 text-xs font-medium shadow-lg backdrop-blur flex items-center gap-1.5 transition"
      >
        <span>💡 Ideas & 🐞 Bug Report</span>
      </button>

      {/* Drawer / Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-end sm:justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl max-w-md w-full p-5 text-zinc-100">
            <div className="flex justify-between items-center pb-3 border-b border-zinc-800">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <span>Direct Product Feedback & Bug Log</span>
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-zinc-400 hover:text-zinc-200 text-sm p-1 rounded"
              >
                ✕
              </button>
            </div>

            {submitted ? (
              <div className="py-8 text-center space-y-2">
                <div className="text-2xl">✨</div>
                <div className="text-sm font-semibold text-emerald-400">Feedback Submitted!</div>
                <p className="text-xs text-zinc-400">
                  Our weekly autonomous intelligence agent will analyze this submission for upcoming patches.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-3 space-y-3">
                <div className="flex gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setFeedbackType('idea')}
                    className={`flex-1 py-1.5 rounded font-medium border ${feedbackType === 'idea' ? 'bg-blue-950 border-blue-600 text-blue-300' : 'bg-zinc-800 border-zinc-700 text-zinc-400'}`}
                  >
                    💡 Feature Idea
                  </button>
                  <button
                    type="button"
                    onClick={() => setFeedbackType('bug')}
                    className={`flex-1 py-1.5 rounded font-medium border ${feedbackType === 'bug' ? 'bg-red-950 border-red-600 text-red-300' : 'bg-zinc-800 border-zinc-700 text-zinc-400'}`}
                  >
                    🐞 Bug Report
                  </button>
                  <button
                    type="button"
                    onClick={() => setFeedbackType('general')}
                    className={`flex-1 py-1.5 rounded font-medium border ${feedbackType === 'general' ? 'bg-zinc-800 border-zinc-500 text-zinc-200' : 'bg-zinc-800 border-zinc-700 text-zinc-400'}`}
                  >
                    💬 General
                  </button>
                </div>

                <div>
                  <label className="text-xs text-zinc-400">Summary</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={feedbackType === 'bug' ? 'What broke?' : 'What would you like to see?'}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-xs text-zinc-200 mt-1"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs text-zinc-400">Details / Steps to reproduce</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    placeholder="Provide any relevant context, expected behavior, or workflow friction..."
                    className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-xs text-zinc-200 mt-1"
                    required
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-zinc-100 font-semibold rounded text-xs transition disabled:opacity-50"
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
};
