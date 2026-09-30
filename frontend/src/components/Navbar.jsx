import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import {
  Rocket,
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  Bell,
  LogOut,
  UserCheck,
  ChevronDown,
  Sparkles
} from 'lucide-react';

const DEMO_PERSONAS = [
  { name: 'Sarah Connor', email: 'manager@launchops.ai', role: 'Manager', dept: 'Customer Success' },
  { name: 'David Kim', email: 'it@launchops.ai', role: 'Member', dept: 'IT' },
  { name: 'Elena Rostova', email: 'finance@launchops.ai', role: 'Member', dept: 'Finance' },
  { name: 'Alex Rivera', email: 'sales@launchops.ai', role: 'Member', dept: 'Sales' },
  { name: 'Marcus Vance', email: 'admin@launchops.ai', role: 'Administrator', dept: 'Operations' }
];

export function Navbar() {
  const { user, logout, loginAsPersona } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const location = useLocation();
  const [showPersonaMenu, setShowPersonaMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);

  const isActive = (path) => {
    return location.pathname === path || (path !== '/' && location.pathname.startsWith(path));
  };

  return (
    <nav className="sticky top-0 z-40 w-full glass-panel border-b border-slate-800/80 bg-slate-950/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <Link to="/dashboard" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
                <Rocket className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
                  LaunchOps <span className="text-indigo-400">AI</span>
                </span>
                <span className="hidden sm:block text-[10px] uppercase font-semibold tracking-wider text-slate-400">
                  Onboarding Workspace
                </span>
              </div>
            </Link>

            {/* Main Nav Links */}
            <div className="hidden md:flex items-center gap-1 ml-8">
              <Link
                to="/dashboard"
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive('/dashboard')
                    ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-900'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </Link>

              <Link
                to="/projects"
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive('/projects')
                    ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-900'
                }`}
              >
                <FolderKanban className="w-4 h-4" />
                Projects
              </Link>

              <Link
                to="/my-tasks"
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive('/my-tasks')
                    ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-900'
                }`}
              >
                <CheckSquare className="w-4 h-4" />
                My Tasks
              </Link>
            </div>
          </div>

          {/* Right Toolbar */}
          <div className="flex items-center gap-3">
            {/* Quick Persona Switcher for Evaluators */}
            <div className="relative">
              <button
                onClick={() => setShowPersonaMenu(!showPersonaMenu)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-950/60 hover:bg-indigo-900/60 text-indigo-300 border border-indigo-500/30 transition-all cursor-pointer"
                title="Switch persona for testing different role permissions"
              >
                <UserCheck className="w-3.5 h-3.5 text-indigo-400" />
                <span className="hidden sm:inline">Role:</span>
                <span className="text-white font-bold">{user?.role} ({user?.department})</span>
                <ChevronDown className="w-3 h-3 text-indigo-400" />
              </button>

              {showPersonaMenu && (
                <div className="absolute right-0 mt-2 w-72 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                    Switch Demo Persona
                  </div>
                  <div className="mt-1 space-y-1">
                    {DEMO_PERSONAS.map((persona) => (
                      <button
                        key={persona.email}
                        onClick={async () => {
                          setShowPersonaMenu(false);
                          await loginAsPersona(persona.email);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between transition-colors ${
                          user?.email === persona.email
                            ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/40'
                            : 'text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <div>
                          <div className="font-semibold text-white">{persona.name}</div>
                          <div className="text-[11px] text-slate-400">{persona.dept} • {persona.role}</div>
                        </div>
                        {user?.email === persona.email && (
                          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Notifications Menu */}
            <div className="relative">
              <button
                onClick={() => setShowNotifMenu(!showNotifMenu)}
                className="relative p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 transition-colors cursor-pointer"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifMenu && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl z-50 p-2">
                  <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800">
                    <span className="text-xs font-bold text-white uppercase tracking-wider">In-App Notifications</span>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="text-[11px] text-indigo-400 hover:underline cursor-pointer"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-800/60 mt-1">
                    {notifications.length === 0 ? (
                      <div className="py-6 text-center text-xs text-slate-400">No notifications yet</div>
                    ) : (
                      notifications.map((notif) => (
                        <div
                          key={notif.id}
                          onClick={() => markAsRead(notif.id)}
                          className={`p-3 text-xs cursor-pointer hover:bg-slate-800/60 transition-colors ${
                            notif.is_read ? 'opacity-60' : 'bg-indigo-950/20'
                          }`}
                        >
                          <div className="font-semibold text-white flex items-center justify-between">
                            <span>{notif.title}</span>
                            {!notif.is_read && <span className="w-2 h-2 rounded-full bg-indigo-500"></span>}
                          </div>
                          <div className="text-slate-300 mt-1">{notif.message}</div>
                          <div className="text-[10px] text-slate-500 mt-1">
                            {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Logout button */}
            <button
              onClick={logout}
              className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-900 transition-colors cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
