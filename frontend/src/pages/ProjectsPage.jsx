import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { projectsApi } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { NewProjectModal } from '../components/NewProjectModal';
import {
  FolderKanban,
  Plus,
  Search,
  Calendar,
  User,
  ArrowRight,
  Filter,
  CheckCircle2,
  Clock,
  Sparkles
} from 'lucide-react';

export function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const res = await projectsApi.getAll();
      setProjects(res.data);
    } catch (err) {
      console.error('Failed to load projects:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const filteredProjects = projects.filter((p) => {
    const matchesSearch = p.customer_name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'All' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
            <FolderKanban className="w-6 h-6 text-indigo-400" />
            Customer Onboarding Projects
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage handoffs, extracted requirements, and team accountability across all enterprise launches.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Create Onboarding Project
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search customers (e.g. Acme Logistics)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-500 shrink-0" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-indigo-500"
          >
            <option value="All">All Statuses</option>
            <option value="Planning">Planning</option>
            <option value="In Progress">In Progress</option>
            <option value="Blocked">Blocked</option>
            <option value="Ready for Launch">Ready for Launch</option>
            <option value="Launched">Launched</option>
          </select>
        </div>
      </div>

      {/* Projects List */}
      {loading ? (
        <div className="py-16 text-center text-slate-400 space-y-2">
          <Sparkles className="w-6 h-6 text-indigo-400 animate-spin mx-auto" />
          <div className="text-xs">Loading customer workspaces...</div>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="py-16 text-center glass-card rounded-2xl border border-slate-800 p-8 space-y-3">
          <FolderKanban className="w-10 h-10 text-slate-600 mx-auto" />
          <div className="text-sm font-semibold text-slate-300">No onboarding projects match your criteria</div>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try adjusting your search filters or start a new onboarding project for a customer handoff.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProjects.map((project) => (
            <Link
              key={project.id}
              to={`/projects/${project.id}`}
              className="glass-card rounded-2xl p-5 border border-slate-800 hover:border-indigo-500/50 flex flex-col justify-between group transition-all"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-base font-bold text-white group-hover:text-indigo-400 transition-colors">
                    {project.customer_name}
                  </h3>
                  <StatusBadge status={project.status} />
                </div>

                <div className="mt-3 space-y-1.5 text-xs text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    <span>Target Launch: <strong className="text-slate-200">{project.target_launch_date}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-500" />
                    <span>Manager: <strong className="text-slate-200">{project.manager_name || 'Unassigned'}</strong></span>
                  </div>
                </div>

                {/* Task counts */}
                <div className="mt-4 p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="text-slate-400">{project.total_tasks || 0} total tasks</span>
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-400 font-semibold">{project.completed_tasks || 0} done</span>
                    {project.blocked_tasks > 0 && (
                      <span className="text-rose-400 font-bold">• {project.blocked_tasks} blocked</span>
                    )}
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-3 space-y-1">
                  <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        project.status === 'Blocked' ? 'bg-rose-500' : 'bg-indigo-500'
                      }`}
                      style={{ width: `${project.progress_percent || 0}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-mono text-[10px]">{project.id}</span>
                <span className="text-indigo-400 font-semibold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  Open Project Workspace <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Modal */}
      <NewProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onProjectCreated={() => fetchProjects()}
      />
    </div>
  );
}
