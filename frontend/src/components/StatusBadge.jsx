import React from 'react';

export function StatusBadge({ status, type = 'status' }) {
  const getBadgeStyle = () => {
    switch (status) {
      // Task & Project States
      case 'Completed':
      case 'Launched':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'In Progress':
        return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30';
      case 'Blocked':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30 animate-pulse';
      case 'Ready for Launch':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'Planning':
      case 'Not Started':
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/30';
    }
  };

  const getDotColor = () => {
    switch (status) {
      case 'Completed':
      case 'Launched':
        return 'bg-emerald-400';
      case 'In Progress':
        return 'bg-indigo-400';
      case 'Blocked':
        return 'bg-rose-400';
      case 'Ready for Launch':
        return 'bg-amber-400';
      default:
        return 'bg-slate-400';
    }
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${getBadgeStyle()}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${getDotColor()}`}></span>
      {status}
    </span>
  );
}

export function DepartmentBadge({ department }) {
  const getDeptColor = () => {
    switch (department) {
      case 'IT':
        return 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30';
      case 'Finance':
        return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
      case 'Customer Success':
        return 'bg-purple-500/15 text-purple-300 border-purple-500/30';
      case 'Security':
        return 'bg-rose-500/15 text-rose-300 border-rose-500/30';
      case 'Sales':
        return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
      case 'Operations':
      default:
        return 'bg-slate-500/15 text-slate-300 border-slate-500/30';
    }
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${getDeptColor()}`}>
      {department}
    </span>
  );
}
