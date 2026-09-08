import React from 'react';
import { ShieldCheck, UserCheck, Activity, Sparkles } from 'lucide-react';
import { UserRole } from '../types';

interface HeaderProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  onDemoWorkflowClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ currentRole, onRoleChange, onDemoWorkflowClick }) => {
  return (
    <header className="h-16 bg-[#0F172A]/90 backdrop-blur border-b border-slate-800 px-6 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center space-x-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
          <ShieldCheck className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-white tracking-tight flex items-center space-x-2">
            <span>RAALE</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-medium">
              v1.0.0
            </span>
          </h1>
          <p className="text-xs text-slate-400">Safe Historical Replay Platform • Synthetic Demo</p>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        {/* Quick Demo Workflow Trigger */}
        <button
          onClick={onDemoWorkflowClick}
          className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-semibold shadow-md shadow-indigo-500/20 transition"
          title="Run guided demonstration on EVT-DEMO-001"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Launch EVT-DEMO-001</span>
        </button>

        {/* Local Role Switcher */}
        <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1">
          <button
            onClick={() => onRoleChange('Integration Engineer')}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              currentRole === 'Integration Engineer'
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Integration Engineer</span>
          </button>

          <button
            onClick={() => onRoleChange('Auditor / Operations Manager')}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              currentRole === 'Auditor / Operations Manager'
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Auditor / Ops</span>
          </button>
        </div>

        {/* Live Indicator */}
        <div className="flex items-center space-x-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg text-xs text-emerald-400 font-medium">
          <Activity className="w-3.5 h-3.5 animate-pulse" />
          <span>System Healthy</span>
        </div>
      </div>
    </header>
  );
};
