import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Rocket,
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  Sparkles,
  ChevronRight,
  Shield,
  Layers,
  LifeBuoy
} from 'lucide-react';
import { cn } from '../../utils/cn';

export function Sidebar({ collapsed, setCollapsed }) {
  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/projects', label: 'Projects', icon: FolderKanban },
    { to: '/tasks', label: 'My Tasks', icon: CheckSquare }
  ];

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col border-r border-slate-800/80 bg-slate-950 transition-all duration-300 z-30 shrink-0",
        collapsed ? "w-20" : "w-64"
      )}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center px-4 border-b border-slate-800/80 justify-between">
        <NavLink to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
            <Rocket className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-base font-bold tracking-tight text-white flex items-center gap-1.5">
                LaunchOps <span className="text-blue-500">AI</span>
              </span>
              <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-500">
                Workspace OS
              </span>
            </div>
          )}
        </NavLink>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 py-6 px-3 space-y-1.5 overflow-y-auto">
        <div className={cn("px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500", collapsed && "sr-only")}>
          Main Navigation
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all group",
                  isActive
                    ? "bg-blue-600/15 text-blue-400 border border-blue-500/30 shadow-sm"
                    : "text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent"
                )
              }
              title={collapsed ? item.label : undefined}
            >
              <Icon className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          );
        })}

        {/* Collateral Section */}
        <div className="pt-6">
          <div className={cn("px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500", collapsed && "sr-only")}>
            Active Customer
          </div>
          <NavLink
            to="/projects/acme-logistics"
            className={({ isActive }) =>
              cn(
                "flex items-center justify-between p-3 rounded-xl border text-xs transition-all",
                isActive
                  ? "bg-rose-950/20 border-rose-900/60 text-rose-300"
                  : "bg-slate-900/50 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-900"
              )
            }
          >
            <div className="flex items-center gap-2.5 truncate">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse shrink-0"></span>
              {!collapsed && (
                <div className="truncate text-left">
                  <div className="font-bold text-white truncate">Acme Logistics</div>
                  <div className="text-[10px] text-rose-400 font-semibold">Blocked Launch</div>
                </div>
              )}
            </div>
            {!collapsed && <ChevronRight className="w-3.5 h-3.5 text-slate-500" />}
          </NavLink>
        </div>
      </div>

      {/* Bottom Status Panel */}
      <div className="p-3 border-t border-slate-800/80">
        <div className={cn("p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs", collapsed && "p-2 text-center")}>
          <div className="flex items-center gap-2 text-emerald-400 font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            {!collapsed && <span>AI Copilot Ready</span>}
          </div>
          {!collapsed && (
            <p className="text-[10px] text-slate-500 mt-1">
              Grounded with Gemini
            </p>
          )}
        </div>
      </div>
    </aside>
  );
}
