import React from 'react';
import { ArrowRight, AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react';
import { DryRunResult } from '../types';
import { JsonViewer } from './JsonViewer';
import { StatusBadge } from './StatusBadge';

interface DiffViewerProps {
  dryRun: DryRunResult;
}

export const DiffViewer: React.FC<DiffViewerProps> = ({ dryRun }) => {
  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-[#131B2E] border border-slate-800 rounded-2xl p-5 flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center space-x-3">
            <h3 className="text-sm font-semibold text-white">Dry Run Simulation Result</h3>
            <StatusBadge status={dryRun.risk_level} />
            <StatusBadge status={dryRun.dependency_status} />
          </div>
          <p className="text-xs text-slate-400">
            ID: <span className="font-mono text-cyan-400">{dryRun.dry_run_id}</span> • Version: {dryRun.transformation_version}
          </p>
        </div>

        <div className="flex items-center space-x-6 text-right">
          <div>
            <p className="text-[10px] text-slate-500 font-medium uppercase">Hash Match</p>
            <p className={`text-xs font-semibold ${dryRun.hash_difference ? 'text-amber-400' : 'text-emerald-400'}`}>
              {dryRun.hash_difference ? 'State Modified' : 'Identical State'}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-slate-500 font-medium uppercase">Changed Fields</p>
            <p className="text-xs font-bold text-cyan-400">{dryRun.changed_fields.length + dryRun.added_fields.length}</p>
          </div>
        </div>
      </div>

      {/* Field Diffs Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
          <span className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider block mb-2">Changed Fields</span>
          {dryRun.changed_fields.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {dryRun.changed_fields.map((f) => (
                <span key={f} className="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-mono">
                  {f}
                </span>
              ))}
            </div>
          ) : (
            <span className="text-xs text-slate-500 italic">None</span>
          )}
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
          <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider block mb-2">Added Fields</span>
          {dryRun.added_fields.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {dryRun.added_fields.map((f) => (
                <span key={f} className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-mono">
                  +{f}
                </span>
              ))}
            </div>
          ) : (
            <span className="text-xs text-slate-500 italic">None</span>
          )}
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
          <span className="text-[11px] font-semibold text-rose-400 uppercase tracking-wider block mb-2">Removed Fields</span>
          {dryRun.removed_fields.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {dryRun.removed_fields.map((f) => (
                <span key={f} className="px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-mono">
                  -{f}
                </span>
              ))}
            </div>
          ) : (
            <span className="text-xs text-slate-500 italic">None</span>
          )}
        </div>
      </div>

      {/* Side-by-side Before/After JSON View */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase">BEFORE (Original Target State)</span>
            <span className="text-[10px] text-slate-500 font-mono truncate max-w-[180px]">Hash: {dryRun.hash_before}</span>
          </div>
          <JsonViewer data={dryRun.original_snapshot} title="ORIGINAL_TARGET_STATE" maxHeight="max-h-96" />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-cyan-400 uppercase flex items-center space-x-1">
              <span>AFTER (Predicted Target State)</span>
              <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
            </span>
            <span className="text-[10px] text-slate-500 font-mono truncate max-w-[180px]">Hash: {dryRun.hash_after}</span>
          </div>
          <JsonViewer data={dryRun.predicted_snapshot} title="PREDICTED_TARGET_STATE" maxHeight="max-h-96" />
        </div>
      </div>
    </div>
  );
};
