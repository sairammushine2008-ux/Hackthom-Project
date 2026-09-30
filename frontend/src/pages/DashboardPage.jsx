import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { dashboardApi } from '../services/api';
import { StatusBadge, DepartmentBadge } from '../components/StatusBadge';
import { NewProjectModal } from '../components/NewProjectModal';
import {
  FolderKanban,
  AlertOctagon,
  Clock,
  CheckCircle2,
  Calendar,
  ArrowUpRight,
  Plus,
  ShieldAlert,
  TrendingUp,
  Building,
  Sparkles
} from 'lucide-react';

export function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const res = await dashboardApi.getMetrics();
      setData(res.data);
    } catch (err) {
      console.error('Failed to load dashboard metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 flex items-center justify-center">
        <div className="text-center space-y-3">
          <Sparkles className="w-8 h-8 text-indigo-400 animate-spin mx-auto" />
          <div className="text-sm font-semibold text-slate-300">Loading Operational Dashboard...</div>
        </div>
      </div>
    );
  }

  const { metrics, projectsSummary = [], departmentBreakdown = {}, overdueTasks = [] } = data || {};

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
            Operational Overview
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
              Live Operations
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Track onboarding health, cross-departmental dependencies, and go-live velocity.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          New Onboarding Project
        </button>
      </div>

      {/* Metric KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Projects */}
        <div className="glass-card rounded-2xl p-5 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Customers</span>
            <FolderKanban className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">{metrics?.totalProjects || 0}</span>
            <span className="text-xs text-slate-400">onboarding</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-1">
            <span className="text-emerald-400 font-semibold">{metrics?.activeProjects || 0} active</span>
            <span>• {metrics?.readyProjects || 0} launch ready</span>
          </div>
        </div>

        {/* Blocked Projects Alert */}
        <div className="glass-card rounded-2xl p-5 border border-rose-900/50 bg-rose-950/10">
          <div className="flex items-center justify-between text-rose-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Blocked Projects</span>
            <AlertOctagon className="w-4 h-4 text-rose-400 animate-pulse" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-rose-300">{metrics?.blockedProjects || 0}</span>
            <span className="text-xs text-rose-400/80">need intervention</span>
          </div>
          <div className="mt-2 text-[11px] text-rose-300/80">
            {metrics?.blockedTasks || 0} blocked tasks across workstreams
          </div>
        </div>

        {/* Overdue Tasks */}
        <div className="glass-card rounded-2xl p-5 border border-amber-900/50 bg-amber-950/10">
          <div className="flex items-center justify-between text-amber-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Overdue Tasks</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-amber-300">{metrics?.overdueCount || 0}</span>
            <span className="text-xs text-amber-400/80">past target</span>
          </div>
          <div className="mt-2 text-[11px] text-amber-300/80">
            Prerequisites impacting launch schedule
          </div>
        </div>

        {/* Completion Rate */}
        <div className="glass-card rounded-2xl p-5 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Completion Velocity</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-emerald-400">{metrics?.overallCompletionRate || 0}%</span>
            <span className="text-xs text-slate-400">aggregate</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400">
            {metrics?.completedTasks || 0} of {metrics?.totalTasks || 0} tasks finished
          </div>
        </div>
      </div>

      {/* Projects Launch Countdown Stream */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Building className="w-4 h-4 text-indigo-400" />
            Customer Onboarding Workspaces
          </h2>
          <Link to="/projects" className="text-xs font-semibold text-indigo-400 hover:underline">
            View All Projects →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projectsSummary.map((p) => (
            <Link
              key={p.id}
              to={`/projects/${p.id}`}
              className="glass-card rounded-2xl p-5 border border-slate-800 hover:border-indigo-500/50 flex flex-col justify-between group transition-all"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-base font-bold text-white group-hover:text-indigo-400 transition-colors">
                      {p.customerName}
                    </h3>
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      <span>Launch: {p.targetLaunchDate}</span>
                    </div>
                  </div>
                  <StatusBadge status={p.status} />
                </div>

                {/* Days remaining badge */}
                <div className="mt-3">
                  <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded ${
                    p.daysToLaunch < 0
                      ? 'bg-rose-950 text-rose-300 border border-rose-800'
                      : p.daysToLaunch <= 14
                      ? 'bg-amber-950 text-amber-300 border border-amber-800'
                      : 'bg-slate-800 text-slate-300'
                  }`}>
                    <Clock className="w-3 h-3" />
                    {p.daysToLaunch < 0 ? `${Math.abs(p.daysToLaunch)} days overdue` : `${p.daysToLaunch} days to go-live`}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="mt-4 space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Progress</span>
                    <span className="font-semibold text-white">{p.progressPercent}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        p.status === 'Blocked' ? 'bg-rose-500' : 'bg-indigo-500'
                      }`}
                      style={{ width: `${p.progressPercent}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <span>{p.completedTasks}/{p.totalTasks} tasks complete</span>
                <span className="text-indigo-400 font-semibold group-hover:translate-x-1 transition-transform flex items-center gap-1">
                  Open Workspace <ArrowUpRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Department Breakdown & Overdue Alert Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Departmental Workstreams */}
        <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            Departmental Distribution
          </h2>
          <div className="space-y-3">
            {Object.entries(departmentBreakdown).map(([dept, counts]) => (
              <div key={dept} className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <DepartmentBadge department={dept} />
                  <span className="text-xs text-slate-300 font-medium">{counts.total} total task(s)</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-emerald-400 font-semibold">{counts.completed} done</span>
                  <span className="text-slate-600">•</span>
                  <span className={counts.blocked > 0 ? 'text-rose-400 font-bold' : 'text-slate-400'}>
                    {counts.blocked} blocked
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actionable Overdue Tasks */}
        <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 text-amber-400">
            <ShieldAlert className="w-4 h-4" />
            Overdue / Critical Attention Tasks
          </h2>

          {overdueTasks.length === 0 ? (
            <div className="py-10 text-center text-xs text-slate-400">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
              All launch tasks are currently on or ahead of schedule!
            </div>
          ) : (
            <div className="space-y-2.5">
              {overdueTasks.slice(0, 5).map((task) => (
                <div key={task.id} className="p-3 rounded-xl bg-slate-900/60 border border-amber-900/30 flex items-center justify-between gap-3">
                  <div className="truncate">
                    <div className="text-xs font-semibold text-white truncate">{task.title}</div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                      <DepartmentBadge department={task.department} />
                      <span className="text-rose-400 font-mono">Due: {task.due_date}</span>
                    </div>
                  </div>
                  <Link
                    to={`/projects/${task.project_id}`}
                    className="shrink-0 px-2.5 py-1 rounded bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 text-xs font-semibold transition-colors"
                  >
                    View
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* New Project Modal */}
      <NewProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onProjectCreated={() => fetchMetrics()}
      />
    </div>
  );
}
