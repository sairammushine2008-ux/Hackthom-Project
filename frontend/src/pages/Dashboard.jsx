import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { StatusBadge, DepartmentBadge } from '../components/StatusBadge';
import {
  FolderKanban,
  AlertOctagon,
  Clock,
  Sparkles,
  Search,
  ArrowUpRight,
  Filter,
  CheckCircle2,
  Lock,
  Building,
  ChevronRight,
  Plus
} from 'lucide-react';
import { cn } from '../utils/cn';

const MOCK_PROJECTS = [
  {
    id: 'acme-logistics',
    name: 'Acme Logistics',
    targetDate: '2026-11-15',
    daysRemaining: 46,
    status: 'Blocked',
    departments: ['IT', 'Finance', 'CS', 'Security'],
    progress: 35,
    lead: 'Sarah Connor',
    seats: 500,
    blockerReason: 'Okta SSO waiting on Security Review'
  },
  {
    id: 'global-fleet',
    name: 'Global Fleet Inc.',
    targetDate: '2026-10-28',
    daysRemaining: 28,
    status: 'Ready',
    departments: ['IT', 'CS'],
    progress: 92,
    lead: 'David Kim',
    seats: 250,
    blockerReason: null
  },
  {
    id: 'nexus-health',
    name: 'Nexus Health Technologies',
    targetDate: '2026-11-02',
    daysRemaining: 33,
    status: 'Pending',
    departments: ['Finance', 'Security', 'CS'],
    progress: 55,
    lead: 'Elena Rostova',
    seats: 1200,
    blockerReason: 'BAA Agreement in legal review'
  },
  {
    id: 'apex-cloud',
    name: 'Apex Cloud Infrastructure',
    targetDate: '2026-11-20',
    daysRemaining: 51,
    status: 'Pending',
    departments: ['IT', 'Sales'],
    progress: 40,
    lead: 'Alex Rivera',
    seats: 150,
    blockerReason: null
  },
  {
    id: 'vanguard-retail',
    name: 'Vanguard Retail Systems',
    targetDate: '2026-12-01',
    daysRemaining: 62,
    status: 'Ready',
    departments: ['CS', 'Finance'],
    progress: 88,
    lead: 'Sarah Connor',
    seats: 800,
    blockerReason: null
  }
];

export function Dashboard() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const filteredProjects = MOCK_PROJECTS.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.lead.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-800/80">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
            Operations & Customer Onboarding Dashboard
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time launch velocity, cross-department handoff tracking, and automated blocker resolution.
          </p>
        </div>

        <Link
          to="/projects/acme-logistics"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/25 transition-all cursor-pointer"
        >
          <Building className="w-4 h-4" />
          <span>Open Acme Logistics Workspace</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* 1. Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Onboardings */}
        <div className="glass-card rounded-2xl p-5 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Onboardings</span>
            <FolderKanban className="w-4 h-4 text-blue-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">12</span>
            <span className="text-xs text-slate-500">enterprise accounts</span>
          </div>
          <div className="text-[11px] text-emerald-400 flex items-center gap-1 font-semibold">
            <span>↑ 3 new deals this month</span>
          </div>
        </div>

        {/* Blocked Launches */}
        <div className="glass-card rounded-2xl p-5 border border-[#EF4444]/40 bg-[#EF4444]/5 space-y-2">
          <div className="flex items-center justify-between text-[#EF4444]">
            <span className="text-xs font-semibold uppercase tracking-wider">Blocked Launches</span>
            <AlertOctagon className="w-4 h-4 text-[#EF4444] animate-pulse" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-[#EF4444]">3</span>
            <span className="text-xs text-[#EF4444]/80">require intervention</span>
          </div>
          <div className="text-[11px] text-[#EF4444] font-medium flex items-center gap-1">
            <Lock className="w-3 h-3" />
            <span>Acme Logistics blocked by Security</span>
          </div>
        </div>

        {/* Avg. Days to Launch */}
        <div className="glass-card rounded-2xl p-5 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Avg. Days to Launch</span>
            <Clock className="w-4 h-4 text-[#F59E0B]" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">18.4</span>
            <span className="text-xs text-slate-500">days target velocity</span>
          </div>
          <div className="text-[11px] text-slate-400 flex items-center gap-1">
            <span className="text-emerald-400 font-semibold">↓ 32% faster</span> with LaunchOps AI
          </div>
        </div>

        {/* Open AI Tasks */}
        <div className="glass-card rounded-2xl p-5 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Open AI Tasks</span>
            <Sparkles className="w-4 h-4 text-[#8B5CF6]" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">7</span>
            <span className="text-xs text-slate-500">draft proposals</span>
          </div>
          <div className="text-[11px] text-[#8B5CF6] font-semibold">
            Grounded in source handoff notes
          </div>
        </div>
      </div>

      {/* 2. Projects Table */}
      <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden space-y-4 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <FolderKanban className="w-4 h-4 text-blue-500" />
              Customer Onboarding Workspaces
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Select any project to inspect source handoff documents, AI proposed plan, and departmental boards.
            </p>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Filter by customer name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-blue-500"
            >
              <option value="All">All Statuses</option>
              <option value="Blocked">Blocked</option>
              <option value="Pending">Pending</option>
              <option value="Ready">Ready</option>
            </select>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 text-slate-400 uppercase tracking-wider text-[10px] font-bold border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Customer Account</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Target Launch</th>
                <th className="py-3 px-4">Department Stakeholders</th>
                <th className="py-3 px-4">Completion Progress</th>
                <th className="py-3 px-4 text-right">Workspace Link</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredProjects.map((project) => (
                <tr
                  key={project.id}
                  className={cn(
                    "hover:bg-slate-900/60 transition-colors group",
                    project.status === 'Blocked' && "bg-[#EF4444]/5"
                  )}
                >
                  {/* Account Name */}
                  <td className="py-3.5 px-4 font-semibold text-white">
                    <Link
                      to={`/projects/${project.id}`}
                      className="hover:text-blue-400 transition-colors flex items-center gap-2"
                    >
                      <span>{project.name}</span>
                      <span className="text-[10px] font-mono text-slate-500 font-normal">
                        ({project.seats} seats)
                      </span>
                    </Link>
                    {project.blockerReason && (
                      <div className="text-[10px] text-[#EF4444] font-normal flex items-center gap-1 mt-0.5">
                        <Lock className="w-2.5 h-2.5 shrink-0" />
                        <span>{project.blockerReason}</span>
                      </div>
                    )}
                  </td>

                  {/* Status */}
                  <td className="py-3.5 px-4">
                    <StatusBadge status={project.status} />
                  </td>

                  {/* Target Launch */}
                  <td className="py-3.5 px-4 text-slate-300">
                    <div>{project.targetDate}</div>
                    <div className="text-[10px] text-slate-500">{project.daysRemaining} days remaining</div>
                  </td>

                  {/* Department Stakeholders */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {project.departments.map((d) => (
                        <DepartmentBadge key={d} department={d} />
                      ))}
                    </div>
                  </td>

                  {/* Progress Bar */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-24 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all",
                            project.status === 'Blocked' ? "bg-[#EF4444]" : "bg-blue-500"
                          )}
                          style={{ width: `${project.progress}%` }}
                        ></div>
                      </div>
                      <span className="font-mono text-slate-300 text-[11px] font-semibold">{project.progress}%</span>
                    </div>
                  </td>

                  {/* Action Link */}
                  <td className="py-3.5 px-4 text-right">
                    <Link
                      to={`/projects/${project.id}`}
                      className="inline-flex items-center gap-1 text-xs font-bold text-blue-400 hover:text-blue-300 group-hover:translate-x-1 transition-all"
                    >
                      <span>Open Workspace</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
