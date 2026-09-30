import React, { useState } from 'react';
import { ShieldCheck, UserCheck, Activity, Sparkles, CheckCircle2, Award, Info, Lock } from 'lucide-react';
import { UserRole } from '../types';

interface HeaderProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  onDemoWorkflowClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ currentRole, onRoleChange, onDemoWorkflowClick }) => {
  const [showProgressModal, setShowProgressModal] = useState(false);

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
              Review 2 (70%)
            </span>
          </h1>
          <p className="text-xs text-slate-400">Safe Historical Replay Platform • Healthcare Edition</p>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        {/* Review 2 Progress Badge */}
        <button
          onClick={() => setShowProgressModal(!showProgressModal)}
          className="flex items-center space-x-2 px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-medium hover:bg-indigo-500/20 transition"
          title="View Review 2 Completion & Feature Progress"
        >
          <Award className="w-3.5 h-3.5 text-indigo-400" />
          <span>Review Progress: 70%</span>
        </button>

        {/* Quick Demo Workflow Trigger */}
        <button
          onClick={onDemoWorkflowClick}
          className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-semibold shadow-md shadow-indigo-500/20 transition"
          title="Run guided demonstration on EVT-DEMO-001"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Launch EVT-DEMO-001</span>
        </button>

        {/* Role Switcher */}
        <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1">
          <button
            onClick={() => onRoleChange('Integration Engineer')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              currentRole === 'Integration Engineer'
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Integration Eng</span>
          </button>

          <button
            onClick={() => onRoleChange('Clinical Lead')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              currentRole === 'Clinical Lead' || currentRole === 'Auditor / Operations Manager'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Clinical Lead</span>
          </button>
        </div>

        {/* Live System Indicator */}
        <div className="flex items-center space-x-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg text-xs text-emerald-400 font-medium">
          <Activity className="w-3.5 h-3.5 animate-pulse" />
          <span>System Active</span>
        </div>
      </div>

      {/* Review Progress Breakdown Modal */}
      {showProgressModal && (
        <div className="absolute right-6 top-20 w-96 bg-[#0F172A] border border-slate-700 rounded-2xl shadow-2xl p-5 z-50 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
            <h3 className="font-semibold text-white text-sm flex items-center space-x-2">
              <Award className="w-4 h-4 text-cyan-400" />
              <span>Project Review Roadmap</span>
            </h3>
            <button
              onClick={() => setShowProgressModal(false)}
              className="text-slate-400 hover:text-white text-xs font-bold px-2 py-1 rounded bg-slate-800"
            >
              ✕
            </button>
          </div>

          <div className="space-y-3">
            {/* Review 1 */}
            <div className="bg-slate-900/80 border border-emerald-500/30 rounded-xl p-3">
              <div className="flex items-center justify-between text-xs font-semibold text-emerald-400 mb-1">
                <span className="flex items-center space-x-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Review 1 (35%)</span>
                </span>
                <span className="bg-emerald-500/10 px-2 py-0.5 rounded text-[10px]">Completed</span>
              </div>
              <p className="text-[11px] text-slate-300">
                Core safety rules, baseline engine comparison, dependency validation, non-mutating dry run, snapshot manager, audit log.
              </p>
            </div>

            {/* Review 2 */}
            <div className="bg-gradient-to-r from-cyan-950/40 to-indigo-950/40 border border-cyan-500/50 rounded-xl p-3 shadow-lg shadow-cyan-500/10">
              <div className="flex items-center justify-between text-xs font-semibold text-cyan-400 mb-1">
                <span className="flex items-center space-x-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
                  <span>Review 2 (35%)</span>
                </span>
                <span className="bg-cyan-500/20 px-2 py-0.5 rounded text-[10px] text-cyan-300 font-bold border border-cyan-500/30">
                  Current (Total 70%)
                </span>
              </div>
              <ul className="text-[11px] text-slate-200 space-y-1 list-disc list-inside">
                <li>Quantified RAALE vs Baseline Comparative Experiment (14 metrics)</li>
                <li>Multi-role JWT Auth & Backend RBAC (Integration Eng vs Clinical Lead)</li>
                <li>Realistic Synthetic HL7 ADT, HL7 ORU & FHIR Bundle Validation</li>
                <li>10 Edge-case Healthcare Payload Test Cases</li>
                <li>Audit trail updates & automated unit test suite</li>
              </ul>
            </div>

            {/* Review 3 */}
            <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-3 opacity-70">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-400 mb-1">
                <span className="flex items-center space-x-1.5">
                  <Lock className="w-3.5 h-3.5 text-slate-500" />
                  <span>Review 3 (30%)</span>
                </span>
                <span className="bg-slate-800 px-2 py-0.5 rounded text-[10px]">Future Work</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Future production enterprise integrations, advanced ML anomaly detection, multi-region failover.
              </p>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
