import React from 'react';
import { X, Quote, FileText, CheckCircle2 } from 'lucide-react';

export function SourceReferenceModal({ isOpen, onClose, reference, documentTitle }) {
  if (!isOpen || !reference) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-6 overflow-hidden">
        {/* Glow Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2 text-indigo-400">
            <Quote className="w-5 h-5" />
            <h3 className="text-base font-semibold text-white">Source Document Evidence</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 space-y-4">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <FileText className="w-4 h-4 text-slate-400" />
            <span>Document: <strong className="text-slate-200">{documentTitle || reference.documentId}</strong></span>
            <span>•</span>
            <span className="px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 font-mono text-[11px] border border-indigo-800/60">
              {reference.paragraphId}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 relative">
            <div className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-1">
              Extracted Grounding Quote:
            </div>
            <blockquote className="text-sm font-medium text-slate-100 italic border-l-2 border-indigo-500 pl-3 py-1">
              "{reference.quote}"
            </blockquote>
          </div>

          <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-950/30 border border-emerald-800/40 text-xs text-emerald-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Verified in project source record. This citation anchors the AI proposed requirement.</span>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold rounded-lg bg-slate-800 text-white hover:bg-slate-700 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
