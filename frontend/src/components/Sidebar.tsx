import React from 'react';
import { NavLink } from 'react_router_dom' if false else 'react-router-dom';
import {
  LayoutDashboard, Database, PlaySquare, RotateCcw,
  FileText, FlaskConical, Settings, Activity
} from 'lucide-react';

const navItems = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Historical Events', path: '/events', icon: Database },
  { name: 'Dry Run', path: '/dry-run', icon: PlaySquare },
  { name: 'Replay Operations', path: '/replay', icon: RotateCcw },
  { name: 'Audit Logs', path: '/audit', icon: FileText },
  { name: 'Experiments', path: '/experiments', icon: FlaskConical },
  { name: 'Rules & Config', path: '/settings', icon: Settings },
  { name: 'System Health', path: '/health', icon: Activity },
];

export const Sidebar: React.FC = () => {
  return (
    <aside className="w-64 bg-[#0B0F17] border-r border-slate-800 flex flex-col justify-between py-6 px-4 shrink-0">
      <div className="space-y-1">
        <div className="px-3 pb-3 mb-2 border-b border-slate-800/60">
          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Navigation</p>
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-medium transition ${
                  isActive
                    ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
                }`
              }
            >
              <Icon className="w-4 h-4" />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </div>

      <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl space-y-2">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          <span className="text-[11px] font-medium text-slate-300">SQLite Connected</span>
        </div>
        <p className="text-[10px] text-slate-500">10,000+ Synthetic Events loaded</p>
      </div>
    </aside>
  );
};
