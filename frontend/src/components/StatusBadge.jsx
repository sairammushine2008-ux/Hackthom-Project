import React from 'react';
import { Lock, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '../utils/cn';

/**
 * StatusBadge Component
 * Status tokens: Blocked (#EF4444), Pending (#F59E0B), Ready (#10B981)
 */
export function StatusBadge({ status, showIcon = true, className }) {
  const normalized = (status || '').toLowerCase();

  let styles = 'bg-slate-500/15 text-slate-300 border-slate-500/30';
  let Icon = Clock;
  let dotColor = 'bg-slate-400';

  if (normalized.includes('block')) {
    styles = 'bg-[#EF4444]/15 text-[#EF4444] border-[#EF4444]/30 animate-pulse';
    Icon = Lock;
    dotColor = 'bg-[#EF4444]';
  } else if (normalized.includes('pending') || normalized.includes('planning') || normalized.includes('progress')) {
    styles = 'bg-[#F59E0B]/15 text-[#F59E0B] border-[#F59E0B]/30';
    Icon = Clock;
    dotColor = 'bg-[#F59E0B]';
  } else if (normalized.includes('ready') || normalized.includes('complete') || normalized.includes('launch')) {
    styles = 'bg-[#10B981]/15 text-[#10B981] border-[#10B981]/30';
    Icon = CheckCircle2;
    dotColor = 'bg-[#10B981]';
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border transition-all",
        styles,
        className
      )}
    >
      {showIcon ? <Icon className="w-3 h-3 shrink-0" /> : <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", dotColor)} />}
      <span>{status}</span>
    </span>
  );
}

/**
 * DepartmentBadge Component
 * Department tokens: Sales (#8B5CF6), Finance (#EC4899), IT (#06B6D4), CS (#10B981), Security (#EF4444)
 */
export function DepartmentBadge({ department, className }) {
  const normalized = (department || '').toLowerCase();

  let styles = 'bg-slate-800 text-slate-300 border-slate-700';

  if (normalized.includes('sales')) {
    styles = 'bg-[#8B5CF6]/15 text-[#8B5CF6] border-[#8B5CF6]/30';
  } else if (normalized.includes('finance')) {
    styles = 'bg-[#EC4899]/15 text-[#EC4899] border-[#EC4899]/30';
  } else if (normalized.includes('it') || normalized.includes('tech')) {
    styles = 'bg-[#06B6D4]/15 text-[#06B6D4] border-[#06B6D4]/30';
  } else if (normalized.includes('cs') || normalized.includes('customer success')) {
    styles = 'bg-[#10B981]/15 text-[#10B981] border-[#10B981]/30';
  } else if (normalized.includes('security')) {
    styles = 'bg-[#EF4444]/15 text-[#EF4444] border-[#EF4444]/30';
  }

  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold border transition-all",
        styles,
        className
      )}
    >
      {department}
    </span>
  );
}
