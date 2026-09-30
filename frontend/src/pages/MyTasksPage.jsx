import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { tasksApi } from '../services/api';
import { StatusBadge, DepartmentBadge } from '../components/StatusBadge';
import {
  CheckSquare,
  Calendar,
  AlertTriangle,
  Check,
  FolderKanban,
  Clock,
  Sparkles,
  ArrowRight
} from 'lucide-react';

export function MyTasksPage() {
  const { user } = useAuth();
  const { showToast } = useNotifications();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMyTasks = async () => {
    try {
      setLoading(true);
      const res = await tasksApi.getMyTasks();
      setTasks(res.data);
    } catch (err) {
      console.error('Failed to load my tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyTasks();
  }, [user]);

  const handleUpdateStatus = async (taskId, newStatus) => {
    try {
      const res = await tasksApi.updateTask(taskId, { status: newStatus });
      const { notification } = res.data;
      if (notification) {
        showToast('Workflow Automation Cleared', notification, 'success');
      } else {
        showToast('Task Updated', `Task status set to "${newStatus}".`, 'info');
      }
      await fetchMyTasks();
    } catch (err) {
      showToast('Error', err.message, 'error');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
            <CheckSquare className="w-6 h-6 text-indigo-400" />
            My Departmental Tasks
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Tasks assigned directly to you ({user?.name}) or queued for the <strong className="text-indigo-400">{user?.department}</strong> department.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <DepartmentBadge department={user?.department || 'Operations'} />
          <span className="text-xs text-slate-400 font-mono">Role: {user?.role}</span>
        </div>
      </div>

      {loading ? (
        <div className="py-16 text-center text-slate-400 space-y-2">
          <Sparkles className="w-6 h-6 text-indigo-400 animate-spin mx-auto" />
          <div className="text-xs">Loading departmental tasks...</div>
        </div>
      ) : tasks.length === 0 ? (
        <div className="py-16 text-center glass-card rounded-2xl border border-slate-800 p-8 space-y-3">
          <CheckSquare className="w-10 h-10 text-slate-600 mx-auto" />
          <div className="text-sm font-bold text-white">No pending tasks for your department!</div>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            All tasks are either completed or unassigned in other departments. Check the Projects board to explore handoffs.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {tasks.map((task) => (
            <div
              key={task.id}
              className={`glass-card rounded-2xl p-5 border flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${
                task.status === 'Blocked' ? 'border-rose-900/50 bg-rose-950/10' : 'border-slate-800'
              }`}
            >
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <DepartmentBadge department={task.department} />
                  <StatusBadge status={task.status} />
                  <Link
                    to={`/projects/${task.project_id}`}
                    className="text-xs font-bold text-indigo-400 hover:underline flex items-center gap-1"
                  >
                    <FolderKanban className="w-3.5 h-3.5" />
                    {task.customer_name}
                  </Link>
                </div>

                <h3 className="text-sm font-bold text-white">{task.title}</h3>
                {task.description && (
                  <p className="text-xs text-slate-400 leading-relaxed">{task.description}</p>
                )}

                <div className="flex items-center gap-3 text-xs text-slate-500">
                  {task.due_date && (
                    <span className="flex items-center gap-1 text-slate-400">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      Due: {task.due_date}
                    </span>
                  )}
                  <span>•</span>
                  <span>Target Launch: {task.target_launch_date}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="shrink-0 flex items-center gap-2">
                {task.status !== 'Completed' && (
                  <button
                    onClick={() => handleUpdateStatus(task.id, 'Completed')}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/30 transition-all cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Mark Completed
                  </button>
                )}

                {task.status === 'Not Started' && (
                  <button
                    onClick={() => handleUpdateStatus(task.id, 'In Progress')}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-all cursor-pointer"
                  >
                    Start Task
                  </button>
                )}

                <Link
                  to={`/projects/${task.project_id}`}
                  className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
                  title="Go to project workspace"
                >
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
