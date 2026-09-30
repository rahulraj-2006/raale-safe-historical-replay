import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, CheckCircle2, PlaySquare, Send, ShieldCheck,
  RotateCcw, AlertTriangle, FileCode, Layers, History, Lock, XCircle
} from 'lucide-react';
import {
  fetchEventDetails, checkDependencies, executeDryRun,
  requestReplay, approveReplay, rejectReplay, executeReplay
} from '../services/api';
import { EventDetail, UserRole, DependencyCheckResult, DryRunResult } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { JsonViewer } from '../components/JsonViewer';
import { DiffViewer } from '../components/DiffViewer';
import { ReplayModal } from '../components/ReplayModal';

interface EventDetailsProps {
  currentRole: UserRole;
}

export const EventDetails: React.FC<EventDetailsProps> = ({ currentRole }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [depResult, setDepResult] = useState<DependencyCheckResult | null>(null);
  const [dryRunResult, setDryRunResult] = useState<DryRunResult | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadEventData = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await fetchEventDetails(id);
      setEvent(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEventData();
  }, [id]);

  const handleCheckDependencies = async () => {
    if (!id) return;
    setErrorMessage(null);
    try {
      setActionLoading(true);
      const res = await checkDependencies(id, currentRole);
      setDepResult(res);
      setActionMessage(`Dependency Check Completed: ${res.status}`);
    } catch (err: any) {
      setErrorMessage(`Error: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRunDryRun = async () => {
    if (!id) return;
    setErrorMessage(null);
    try {
      setActionLoading(true);
      const res = await executeDryRun(id, currentRole, 'v2.0');
      setDryRunResult(res);
      setActionMessage(`Dry Run Completed: Risk Level ${res.risk_level}`);
    } catch (err: any) {
      setErrorMessage(`Dry Run Failed: ${err.response?.data?.detail || err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRequestReplay = async () => {
    if (!id) return;
    setErrorMessage(null);
    try {
      setActionLoading(true);
      const res = await requestReplay(id, currentRole, 'Transformation defect v2.0 fix');
      setActionMessage(res.message);
      loadEventData();
    } catch (err: any) {
      setErrorMessage(`Replay Request Error: ${err.response?.data?.detail || err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleApproveReplay = async () => {
    if (!id) return;
    setErrorMessage(null);
    try {
      setActionLoading(true);
      const res = await approveReplay(id, currentRole, 'Clinical Lead approval granted');
      setActionMessage(res.message);
      loadEventData();
    } catch (err: any) {
      setErrorMessage(err.response?.data?.detail || err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectReplay = async () => {
    if (!id) return;
    setErrorMessage(null);
    try {
      setActionLoading(true);
      const res = await rejectReplay(id, currentRole, 'Clinical Lead rejected replay');
      setActionMessage(res.message);
      loadEventData();
    } catch (err: any) {
      setErrorMessage(err.response?.data?.detail || err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleExecuteReplayConfirm = async () => {
    if (!id) return;
    setErrorMessage(null);
    try {
      setActionLoading(true);
      const res = await executeReplay(id, currentRole);
      setActionMessage(res.message);
      setIsModalOpen(false);
      loadEventData();
    } catch (err: any) {
      setErrorMessage(err.response?.data?.detail || err.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading || !event) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const isClinicalLead = currentRole === 'Clinical Lead' || currentRole === 'Auditor / Operations Manager';

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header & Back button */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/events')}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center space-x-3">
              <h2 className="text-xl font-bold text-white tracking-tight font-mono">{event.id}</h2>
              <StatusBadge status={event.status} />
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Entity: <span className="text-cyan-400 font-mono font-semibold">{event.entity_reference}</span> • Source: {event.source_system}
            </p>
          </div>
        </div>

        {/* Workflow Action Bar */}
        <div className="flex items-center space-x-3 flex-wrap gap-y-2">
          <button
            onClick={handleCheckDependencies}
            disabled={actionLoading}
            className="flex items-center space-x-2 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 hover:bg-slate-800 text-xs font-semibold text-slate-200 transition disabled:opacity-50"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Check Dependencies</span>
          </button>

          <button
            onClick={handleRunDryRun}
            disabled={actionLoading}
            className="flex items-center space-x-2 px-3 py-2 rounded-xl bg-purple-500/10 border border-purple-500/30 hover:bg-purple-500/20 text-xs font-semibold text-purple-300 transition disabled:opacity-50"
          >
            <PlaySquare className="w-3.5 h-3.5 text-purple-400" />
            <span>Run Dry Run</span>
          </button>

          <button
            onClick={handleRequestReplay}
            disabled={actionLoading || event.status === 'REPLAYED'}
            className="flex items-center space-x-2 px-3 py-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 hover:bg-cyan-500/20 text-xs font-semibold text-cyan-300 transition disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5 text-cyan-400" />
            <span>Request Replay</span>
          </button>

          {/* Role-Enforced Approval Button */}
          {isClinicalLead ? (
            <div className="flex items-center space-x-2">
              <button
                onClick={handleApproveReplay}
                disabled={actionLoading || event.status === 'REPLAYED'}
                className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 text-xs font-semibold text-emerald-300 transition disabled:opacity-50"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Approve</span>
              </button>

              <button
                onClick={handleRejectReplay}
                disabled={actionLoading || event.status === 'REPLAYED'}
                className="flex items-center space-x-2 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 text-xs font-semibold text-red-300 transition disabled:opacity-50"
              >
                <XCircle className="w-3.5 h-3.5 text-red-400" />
                <span>Reject</span>
              </button>
            </div>
          ) : (
            <div
              className="flex items-center space-x-2 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-500 cursor-not-allowed opacity-60"
              title="Approval requires Clinical Lead role."
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Approve (Requires Clinical Lead)</span>
            </div>
          )}

          <button
            onClick={() => setIsModalOpen(true)}
            disabled={actionLoading || event.status === 'REPLAYED'}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-cyan-500/20 transition disabled:opacity-50"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Execute Safe Replay</span>
          </button>
        </div>
      </div>

      {/* Action Notification Banner */}
      {actionMessage && (
        <div className="bg-slate-900 border border-emerald-500/30 rounded-xl p-3 text-xs text-emerald-300 flex items-center justify-between">
          <span>{actionMessage}</span>
          <button onClick={() => setActionMessage(null)} className="text-slate-500 hover:text-white">Clear</button>
        </div>
      )}

      {/* Authorization Error Alert */}
      {errorMessage && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3.5 text-xs text-red-300 flex items-center justify-between animate-in fade-in">
          <div className="flex items-center space-x-2">
            <Lock className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-red-400 hover:text-white text-xs font-bold px-2 py-0.5 rounded bg-red-950/40">Dismiss</button>
        </div>
      )}

      {/* Dependency Check Results (If Triggered) */}
      {depResult && (
        <div className={`p-4 rounded-2xl border ${depResult.status === 'BLOCKED' ? 'bg-rose-500/10 border-rose-500/20' : 'bg-emerald-500/10 border-emerald-500/20'} space-y-2`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white">Dependency Validation Results</span>
            <StatusBadge status={depResult.status} />
          </div>
          <p className="text-xs text-slate-300">
            Checks Passed: <span className="font-bold">{depResult.checks_passed}</span> / {depResult.checks_total}
          </p>
          {depResult.block_reasons.length > 0 && (
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-rose-400 uppercase">Block Reasons:</span>
              <ul className="list-disc list-inside text-xs text-rose-300">
                {depResult.block_reasons.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Dry Run simulation results embedded if run */}
      {dryRunResult && (
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-white flex items-center space-x-2">
            <PlaySquare className="w-4 h-4 text-purple-400" />
            <span>Dry Run Structural Diff Output</span>
          </h3>
          <DiffViewer dryRun={dryRunResult} />
        </div>
      )}

      {/* Grid layout for Metadata, Payload, Target Snapshot */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Metadata & Dependencies */}
        <div className="space-y-6">
          <div className="bg-[#131B2E] border border-slate-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-2">
              <FileCode className="w-4 h-4 text-cyan-400" />
              <span>Event Metadata</span>
            </h3>
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-500">Event ID</span>
                <span className="font-mono text-cyan-400">{event.id}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-500">Source System</span>
                <span className="text-slate-300">{event.source_system}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-500">Event Type</span>
                <span className="text-slate-300">{event.event_type}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-500">Entity Ref</span>
                <span className="font-mono text-indigo-300">{event.entity_reference}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-500">Schema Version</span>
                <span className="text-slate-300">{event.schema_version}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-500">Transformation</span>
                <span className="text-cyan-400 font-semibold">{event.transformation_version}</span>
              </div>
            </div>
          </div>

          {/* Dependencies Detail */}
          <div className="bg-[#131B2E] border border-slate-800 rounded-2xl p-5 space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-2">
              <Layers className="w-4 h-4 text-indigo-400" />
              <span>Prerequisite Dependencies</span>
            </h3>
            {event.dependencies_detail.length > 0 ? (
              <div className="space-y-2">
                {event.dependencies_detail.map((dep, idx) => (
                  <div key={idx} className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 flex items-center justify-between text-xs font-mono">
                    <div>
                      <p className="text-cyan-400 font-bold">{dep.required_event_id}</p>
                      <p className="text-[10px] text-slate-500">{dep.type}</p>
                    </div>
                    <StatusBadge status={dep.status} />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">No prerequisite event dependencies registered.</p>
            )}
          </div>
        </div>

        {/* Center & Right Column: Payload & Target Snapshot */}
        <div className="lg:col-span-2 space-y-6">
          <JsonViewer data={event.payload} title="HISTORICAL_EVENT_PAYLOAD" maxHeight="max-h-80" />
          
          {event.target_snapshot && (
            <JsonViewer data={event.target_snapshot.state} title={`CURRENT_TARGET_SNAPSHOT (Hash: ${event.target_snapshot.hash.slice(0, 16)}...)`} maxHeight="max-h-80" />
          )}

          {/* Replay History */}
          <div className="bg-[#131B2E] border border-slate-800 rounded-2xl p-5 space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-2">
              <History className="w-4 h-4 text-purple-400" />
              <span>Replay Audit History</span>
            </h3>
            {event.replay_history.length > 0 ? (
              <div className="space-y-2">
                {event.replay_history.map((rec) => (
                  <div key={rec.id} className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-semibold text-white">{rec.status}</span>
                      <p className="text-[10px] text-slate-500">Requested by: {rec.requested_by}</p>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">{rec.requested_at ? new Date(rec.requested_at).toLocaleString() : ''}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">No previous replay attempts logged.</p>
            )}
          </div>
        </div>
      </div>

      {/* Replay Confirmation Modal */}
      <ReplayModal
        isOpen={isModalOpen}
        eventId={event.id}
        onConfirm={handleExecuteReplayConfirm}
        onClose={() => setIsModalOpen(false)}
        isLoading={actionLoading}
      />
    </div>
  );
};
