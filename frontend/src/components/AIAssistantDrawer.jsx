import React, { useState } from 'react';
import {
  Sparkles,
  X,
  Send,
  AlertTriangle,
  FileCheck2,
  HelpCircle,
  Copy,
  Check,
  Bot
} from 'lucide-react';
import { aiApi } from '../services/api';

export function AIAssistantDrawer({ isOpen, onClose, projectId, customerName }) {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Hello! I am your **LaunchOps AI Onboarding Assistant**. I analyze project records, task dependencies, and source handoff documents for **${customerName}** to explain blockers and summarize launch readiness.`
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);

  if (!isOpen) return null;

  const handleAsk = async (promptText) => {
    const textToSubmit = promptText || query;
    if (!textToSubmit.trim() || isLoading) return;

    const userMessage = { role: 'user', content: textToSubmit };
    setMessages(prev => [...prev, userMessage]);
    setQuery('');
    setIsLoading(true);

    try {
      let aiResponseText = '';
      if (textToSubmit.toLowerCase().includes('prevent') || textToSubmit.toLowerCase().includes('block')) {
        const res = await aiApi.explainBlockers(projectId, textToSubmit);
        aiResponseText = res.data.explanation;
      } else if (textToSubmit.toLowerCase().includes('summary') || textToSubmit.toLowerCase().includes('progress')) {
        const res = await aiApi.summarizeProgress(projectId);
        aiResponseText = res.data.summary;
      } else {
        const res = await aiApi.explainBlockers(projectId, textToSubmit);
        aiResponseText = res.data.explanation;
      }

      setMessages(prev => [...prev, { role: 'assistant', content: aiResponseText }]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: `⚠️ **AI Query Error:** ${err.message || 'Unable to retrieve answer. Please try again.'}`
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[500px] bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
      {/* Drawer Header */}
      <div className="p-4 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-600/30 border border-indigo-500/50 flex items-center justify-center text-indigo-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="text-sm font-bold text-white flex items-center gap-1.5">
              LaunchOps AI Copilot
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
                Gemini
              </span>
            </div>
            <div className="text-[11px] text-slate-400">Grounded in project sources & task graph</div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Suggested Quick Prompts */}
      <div className="p-3 bg-slate-950/40 border-b border-slate-800 flex items-center gap-2 overflow-x-auto">
        <button
          onClick={() => handleAsk('What is preventing Acme from launching?')}
          disabled={isLoading}
          className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-rose-950/40 hover:bg-rose-900/40 text-rose-300 border border-rose-800/60 transition-colors cursor-pointer"
        >
          <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
          What is preventing launch?
        </button>

        <button
          onClick={() => handleAsk('Generate Executive Progress Summary')}
          disabled={isLoading}
          className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-950/40 hover:bg-indigo-900/40 text-indigo-300 border border-indigo-800/60 transition-colors cursor-pointer"
        >
          <FileCheck2 className="w-3.5 h-3.5 text-indigo-400" />
          Summarize Progress
        </button>
      </div>

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div className="flex items-center gap-1.5 mb-1 text-[11px] text-slate-400">
              {m.role === 'user' ? (
                <span>You</span>
              ) : (
                <>
                  <Bot className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="font-semibold text-indigo-300">LaunchOps AI</span>
                </>
              )}
            </div>

            <div
              className={`relative group p-3.5 rounded-2xl text-xs leading-relaxed max-w-[92%] ${
                m.role === 'user'
                  ? 'bg-indigo-600 text-white rounded-tr-none'
                  : 'bg-slate-950/90 text-slate-200 border border-slate-800 rounded-tl-none font-sans'
              }`}
            >
              {m.role === 'assistant' && (
                <button
                  onClick={() => copyToClipboard(m.content, idx)}
                  className="absolute top-2 right-2 p-1 rounded bg-slate-900/80 text-slate-400 hover:text-white transition-opacity opacity-0 group-hover:opacity-100 cursor-pointer"
                  title="Copy to clipboard"
                >
                  {copiedIndex === idx ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              )}

              <div className="prose prose-invert prose-xs max-w-none space-y-2 whitespace-pre-wrap">
                {m.content}
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-start gap-2">
            <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-indigo-400 flex items-center gap-2 animate-pulse">
              <Sparkles className="w-4 h-4 animate-spin text-indigo-400" />
              <span>Analyzing tasks, dependencies, and handoff sources...</span>
            </div>
          </div>
        )}
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleAsk(query);
        }}
        className="p-3 border-t border-slate-800 bg-slate-950"
      >
        <div className="relative flex items-center">
          <input
            type="text"
            placeholder="Ask about blockers, tasks, or citations..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={isLoading}
            className="w-full pl-3 pr-10 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
          />
          <button
            type="submit"
            disabled={isLoading || !query.trim()}
            className="absolute right-2 p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-40 transition-colors cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </form>
    </div>
  );
}
