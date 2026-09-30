import React from 'react';
import { useNotifications } from '../context/NotificationContext';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export function Toast() {
  const { activeToast, closeToast } = useNotifications();

  if (!activeToast) return null;

  const getIcon = () => {
    switch (activeToast.type) {
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />;
      default:
        return <Info className="w-5 h-5 text-indigo-400 shrink-0" />;
    }
  };

  const getBorderColor = () => {
    switch (activeToast.type) {
      case 'success':
        return 'border-emerald-500/50 bg-slate-900/95';
      case 'error':
        return 'border-rose-500/50 bg-slate-900/95';
      default:
        return 'border-indigo-500/50 bg-slate-900/95';
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-sm animate-in slide-in-from-bottom-5 duration-200">
      <div className={`p-4 rounded-xl shadow-2xl border flex items-start gap-3 backdrop-blur-md ${getBorderColor()}`}>
        {getIcon()}
        <div className="flex-1 pr-2">
          <div className="text-xs font-bold text-white uppercase tracking-wider">{activeToast.title}</div>
          <div className="text-xs text-slate-300 mt-0.5 leading-relaxed">{activeToast.message}</div>
        </div>
        <button
          onClick={closeToast}
          className="text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
