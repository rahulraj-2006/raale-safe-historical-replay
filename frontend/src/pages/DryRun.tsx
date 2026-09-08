import React, { useState } from 'react';
import { PlaySquare, Search, Sparkles, ShieldCheck } from 'lucide-react';
import { executeDryRun } from '../services/api';
import { DryRunResult, UserRole } from '../types';
import { DiffViewer } from '../components/DiffViewer';

interface DryRunProps {
  currentRole: UserRole;
}

export const DryRun: React.FC<DryRunProps> = ({ currentRole }) => {
  const [selectedId, setSelectedId] = useState('EVT-DEMO-001');
  const [transformationVer, setTransformationVer] = useState('v2.0');
  const [result, setResult] = useState<DryRunResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRunSimulation = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedId.trim()) return;

    try {
      setLoading(true);
      setError(null);
      const res = await executeDryRun(selectedId.trim(), currentRole, transformationVer);
      setResult(res);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Simulation error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight">Dry Run Simulation Engine</h2>
        <p className="text-xs text-slate-400 mt-1">
          Predict target state changes with zero mutation risk before requesting or executing replay
        </p>
      </div>

      {/* Control Input Bar */}
      <div className="bg-[#131B2E] border border-slate-800 rounded-2xl p-5 shadow-xl">
        <form onSubmit={handleRunSimulation} className="flex flex-wrap gap-4 items-end justify-between">
          <div className="flex flex-wrap gap-4 items-center flex-1">
            <div className="space-y-1.5 min-w-[240px]">
              <label className="text-xs font-semibold text-slate-400">Target Event ID</label>
              <div className="relative">
                <input
                  type="text"
                  value={selectedId}
                  onChange={(e) => setSelectedId(e.target.value)}
                  placeholder="e.g. EVT-DEMO-001"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400">Corrected Transformation Version</label>
              <select
                value={transformationVer}
                onChange={(e) => setTransformationVer(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 transition"
              >
                <option value="v2.0">v2.0 (Corrected Standard Transformation)</option>
                <option value="v1.2">v1.2 (Legacy Transformation)</option>
              </select>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={() => { setSelectedId('EVT-DEMO-001'); }}
              className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-medium transition"
            >
              Preset: EVT-DEMO-001
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center space-x-2 px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-500/20 transition disabled:opacity-50"
            >
              <PlaySquare className="w-4 h-4" />
              <span>{loading ? 'Simulating...' : 'Run Simulation'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 text-xs text-rose-300">
          Simulation Failed: {error}
        </div>
      )}

      {/* Results View */}
      {result ? (
        <DiffViewer dryRun={result} />
      ) : (
        <div className="bg-[#131B2E]/50 border border-slate-800/80 rounded-2xl p-12 text-center space-y-3">
          <Sparkles className="w-10 h-10 text-purple-400/50 mx-auto" />
          <h3 className="text-sm font-semibold text-slate-300">No Dry Run Executed Yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Select an event ID above (or click Preset: EVT-DEMO-001) and click "Run Simulation" to generate non-mutating predicted target state diffs.
          </p>
        </div>
      )}
    </div>
  );
};
