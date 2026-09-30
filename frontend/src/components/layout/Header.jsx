import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import {
  Search,
  Building,
  Bell,
  ChevronDown,
  User,
  Shield,
  UserCheck,
  Sparkles,
  Command
} from 'lucide-react';
import { cn } from '../../utils/cn';

const WORKSPACES = [
  { id: 'ws-1', name: 'Acme Logistics Workspace', tag: 'Primary Onboarding' },
  { id: 'ws-2', name: 'Global Fleet Enterprise', tag: 'Planning' },
  { id: 'ws-3', name: 'Nexus Health Hub', tag: 'Active' }
];

const DEMO_PERSONAS = [
  { name: 'Sarah Connor', email: 'manager@launchops.ai', role: 'Manager', dept: 'CS' },
  { name: 'David Kim', email: 'it@launchops.ai', role: 'Member', dept: 'IT' },
  { name: 'Elena Rostova', email: 'finance@launchops.ai', role: 'Member', dept: 'Finance' },
  { name: 'Alex Rivera', email: 'sales@launchops.ai', role: 'Member', dept: 'Sales' }
];

export function Header({ onSearchQuery, onOpenCopilot }) {
  const { user, loginAsPersona } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  const [selectedWorkspace, setSelectedWorkspace] = useState(WORKSPACES[0]);
  const [showWorkspaceMenu, setShowWorkspaceMenu] = useState(false);
  const [showPersonaMenu, setShowPersonaMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [searchVal, setSearchVal] = useState('');

  const handleSearchChange = (e) => {
    setSearchVal(e.target.value);
    if (onSearchQuery) onSearchQuery(e.target.value);
  };

  return (
    <header className="h-16 px-6 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md flex items-center justify-between gap-4 sticky top-0 z-20">
      {/* Workspace Context Switcher */}
      <div className="relative">
        <button
          onClick={() => setShowWorkspaceMenu(!showWorkspaceMenu)}
          className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-semibold text-slate-200 transition-colors cursor-pointer"
        >
          <Building className="w-4 h-4 text-blue-500" />
          <span className="font-bold">{selectedWorkspace.name}</span>
          <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
        </button>

        {showWorkspaceMenu && (
          <div className="absolute left-0 mt-2 w-64 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
            <div className="px-2.5 py-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Switch Workspace
            </div>
            {WORKSPACES.map((ws) => (
              <button
                key={ws.id}
                onClick={() => {
                  setSelectedWorkspace(ws);
                  setShowWorkspaceMenu(false);
                }}
                className={cn(
                  "w-full text-left px-2.5 py-2 rounded-lg text-xs flex items-center justify-between transition-colors",
                  selectedWorkspace.id === ws.id
                    ? "bg-blue-600/20 text-blue-300 font-semibold"
                    : "text-slate-300 hover:bg-slate-800"
                )}
              >
                <span>{ws.name}</span>
                <span className="text-[10px] font-mono text-slate-500">{ws.tag}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Global Search Bar */}
      <div className="flex-1 max-w-md hidden sm:block relative">
        <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
        <input
          type="text"
          placeholder="Global Search (tasks, handoff notes, requirements)..."
          value={searchVal}
          onChange={handleSearchChange}
          className="w-full pl-9 pr-12 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
        />
        <div className="absolute right-3 top-2 text-[10px] font-mono text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700 flex items-center gap-0.5">
          <Command className="w-2.5 h-2.5" /> K
        </div>
      </div>

      {/* Right Controls: Notifications, Persona, Profile */}
      <div className="flex items-center gap-3">
        {/* Quick Persona Switcher for Hackathon Testing */}
        <div className="relative">
          <button
            onClick={() => setShowPersonaMenu(!showPersonaMenu)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-950/60 hover:bg-blue-900/60 text-blue-300 border border-blue-500/30 text-xs font-semibold transition-all cursor-pointer"
            title="Switch persona to test role-based views"
          >
            <UserCheck className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden md:inline">Role:</span>
            <span className="text-white font-bold">{user?.name} ({user?.department})</span>
            <ChevronDown className="w-3 h-3 text-blue-400" />
          </button>

          {showPersonaMenu && (
            <div className="absolute right-0 mt-2 w-64 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-3 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-800">
                Switch Active Role
              </div>
              <div className="mt-1 space-y-1">
                {DEMO_PERSONAS.map((p) => (
                  <button
                    key={p.email}
                    onClick={async () => {
                      setShowPersonaMenu(false);
                      await loginAsPersona(p.email);
                    }}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between transition-colors",
                      user?.email === p.email
                        ? "bg-blue-600/20 text-blue-300 border border-blue-500/40"
                        : "text-slate-300 hover:bg-slate-800"
                    )}
                  >
                    <div>
                      <div className="font-semibold text-white">{p.name}</div>
                      <div className="text-[10px] text-slate-400">{p.dept} • {p.role}</div>
                    </div>
                    {user?.email === p.email && (
                      <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Notifications Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifMenu(!showNotifMenu)}
            className="relative p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900 transition-colors cursor-pointer"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-3.5 h-3.5 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifMenu && (
            <div className="absolute right-0 mt-2 w-80 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl p-2 z-50">
              <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800">
                <span className="text-xs font-bold text-white uppercase tracking-wider">Notifications</span>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-[10px] text-blue-400 hover:underline cursor-pointer"
                  >
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-60 overflow-y-auto divide-y divide-slate-800/60 mt-1">
                {notifications.length === 0 ? (
                  <div className="py-6 text-center text-xs text-slate-500">No new notifications</div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => markAsRead(n.id)}
                      className={cn(
                        "p-2.5 text-xs cursor-pointer hover:bg-slate-800/60 transition-colors",
                        n.is_read ? "opacity-60" : "bg-blue-950/20"
                      )}
                    >
                      <div className="font-semibold text-white flex items-center justify-between">
                        <span>{n.title}</span>
                        {!n.is_read && <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>}
                      </div>
                      <div className="text-slate-300 text-[11px] mt-0.5">{n.message}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Avatar */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-slate-800 to-slate-700 border border-slate-700 flex items-center justify-center text-white text-xs font-bold">
            {user?.name?.slice(0, 2).toUpperCase() || 'SC'}
          </div>
        </div>
      </div>
    </header>
  );
}
