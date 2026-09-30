import React, { useState } from 'react';
import { StatusBadge, DepartmentBadge } from '../StatusBadge';
import {
  Lock,
  Clock,
  CheckCircle2,
  AlertTriangle,
  User,
  Calendar,
  Filter,
  Check,
  Quote,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { cn } from '../../utils/cn';

export function TaskBoard({ tasks = [], onUpdateStatus, onInspectCitation }) {
  const [selectedDept, setSelectedDept] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');

  const departments = ['All', 'Sales', 'Finance', 'IT', 'CS', 'Security'];
  const statuses = ['All', 'Not Started', 'In Progress', 'Blocked', 'Completed'];

  const filteredTasks = tasks.filter((t) => {
    const matchesDept = selectedDept === 'All' || t.department === selectedDept || (selectedDept === 'CS' && t.department === 'Customer Success');
    const matchesStatus = selectedStatus === 'All' || t.status === selectedStatus;
    return matchesDept && matchesStatus;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
        {/* Department Pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] font-bold uppercase text-slate-500 mr-1">Dept:</span>
          {departments.map((dept) => (
            <button
              key={dept}
              onClick={() => setSelectedDept(dept)}
              className={cn(
                "px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                selectedDept === dept
                  ? "bg-blue-600 text-white shadow-md shadow-blue-500/25"
                  : "bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800"
              )}
            >
              {dept}
            </button>
          ))}
        </div>

        {/* Status Dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold uppercase text-slate-500">Status:</span>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-blue-500"
          >
            {statuses.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800 text-slate-400 text-xs">
            No tasks match the selected department and status filters.
          </div>
        ) : (
          filteredTasks.map((task) => {
            const isBlocked = task.status === 'Blocked';
            const hasDependencies = task.dependencies && task.dependencies.length > 0;
            const prereqName = hasDependencies ? task.dependencies[0].title || task.dependencies[0].prerequisite_title : null;

            return (
              <div
                key={task.id}
                className={cn(
                  "p-4 sm:p-5 rounded-2xl bg-slate-900/80 border transition-all space-y-3",
                  isBlocked
                    ? "border-[#EF4444] bg-[#EF4444]/5 shadow-sm shadow-[#EF4444]/10"
                    : "border-slate-800 hover:border-slate-700"
                )}
              >
                {/* Top Row: Department, Status, Citation */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <DepartmentBadge department={task.department} />
                    <StatusBadge status={task.status} />

                    {/* Blocked Indicator Badge */}
                    {isBlocked && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-[#EF4444]/20 text-[#EF4444] border border-[#EF4444]/40 animate-pulse">
                        <Lock className="w-3 h-3" />
                        <span>Prerequisite Bottleneck</span>
                      </span>
                    )}
                  </div>

                  {/* Inline Citation Trigger Pill */}
                  {task.source_references && task.source_references.length > 0 && (
                    <button
                      onClick={() => onInspectCitation && onInspectCitation(task.source_references[0])}
                      className="shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-950/60 hover:bg-blue-900 text-blue-300 text-xs font-semibold border border-blue-800/80 transition-colors cursor-pointer"
                      title="Inspect extracted source reference"
                    >
                      <Quote className="w-3 h-3" />
                      <span>Ref: {task.source_references[0].paragraphId || 'p1'}</span>
                    </button>
                  )}
                </div>

                {/* Title & Description */}
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    {task.title}
                  </h3>
                  {task.description && (
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      {task.description}
                    </p>
                  )}
                </div>

                {/* Blocked Warning Tooltip / Banner naming the prerequisite task */}
                {isBlocked && (
                  <div className="p-3 rounded-xl bg-[#EF4444]/10 border border-[#EF4444]/30 text-xs text-[#EF4444] flex items-start gap-2.5">
                    <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Execution Blocked: </span>
                      <span>
                        Cannot begin until prerequisite <strong>"{prereqName || 'Security Review'}"</strong> is marked <strong>Completed</strong>.
                      </span>
                    </div>
                  </div>
                )}

                {/* Metadata & Actions */}
                <div className="pt-2 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-400">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-500" />
                      Owner: <strong className="text-slate-200">{task.owner_name || 'Unassigned'}</strong>
                    </span>

                    {task.due_date && (
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        Due: <strong className="text-slate-200">{task.due_date}</strong>
                      </span>
                    )}
                  </div>

                  {/* Quick Action Button */}
                  <div className="flex items-center gap-2">
                    {task.status !== 'Completed' && (
                      <button
                        onClick={() => onUpdateStatus && onUpdateStatus(task.id, 'Completed')}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 font-semibold border border-emerald-500/30 transition-colors cursor-pointer flex items-center gap-1.5"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Mark Completed</span>
                      </button>
                    )}

                    {task.status === 'Not Started' && (
                      <button
                        onClick={() => onUpdateStatus && onUpdateStatus(task.id, 'In Progress')}
                        className="px-3 py-1.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 font-semibold border border-blue-500/30 transition-colors cursor-pointer"
                      >
                        Start Task
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
