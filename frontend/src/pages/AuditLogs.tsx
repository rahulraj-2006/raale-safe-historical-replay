import React, { useEffect, useState } from 'react';
import { Search, FileText, RefreshCw, Eye } from 'lucide-react';
import { fetchAuditLogs } from '../services/api';
import { AuditLogItem } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { JsonViewer } from '../components/JsonViewer';

export const AuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const res = await fetchAuditLogs({
        search: search || undefined,
        action: actionFilter || undefined,
        limit: 100
      });
      setLogs(res.items);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [actionFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadLogs();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Replay Audit Trail</h2>
          <p className="text-xs text-slate-400 mt-1">
            Immutable log recorder tracking every dry run, approval, rejection, safety block, and execution
          </p>
        </div>
        <button
          onClick={loadLogs}
          className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-medium transition"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Audit Log</span>
        </button>
      </div>

      {/* Search & Filter */}
      <div className="bg-[#131B2E] border border-slate-800 rounded-2xl p-4 flex flex-wrap gap-4 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="flex items-center space-x-2 flex-1 min-w-[260px]">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search Event ID, Actor Role, Action, or Reason..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
            />
          </div>
          <button type="submit" className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition">
            Search
          </button>
        </form>

        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-cyan-500 transition"
        >
          <option value="">All Actions</option>
          <option value="DRY_RUN_COMPLETED">DRY_RUN_COMPLETED</option>
          <option value="REPLAY_REQUESTED">REPLAY_REQUESTED</option>
          <option value="REPLAY_APPROVED">REPLAY_APPROVED</option>
          <option value="REPLAY_REJECTED">REPLAY_REJECTED</option>
          <option value="REPLAY_BLOCKED">REPLAY_BLOCKED</option>
          <option value="REPLAY_COMPLETED">REPLAY_COMPLETED</option>
        </select>
      </div>

      {/* Audit Log Table */}
      <div className="bg-[#131B2E] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px] font-semibold border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Event ID</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Actor Role</th>
                <th className="px-4 py-3">Result / Status</th>
                <th className="px-4 py-3">Reason / Details</th>
                <th className="px-4 py-3 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500 italic">
                    Loading audit trail...
                  </td>
                </tr>
              ) : logs.length > 0 ? (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition">
                    <td className="px-4 py-3.5 text-slate-400 text-[11px]">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="px-4 py-3.5 font-bold text-cyan-400">{log.event_id}</td>
                    <td className="px-4 py-3.5 font-semibold text-slate-200">{log.action}</td>
                    <td className="px-4 py-3.5 text-indigo-300 font-sans text-xs">{log.actor_role}</td>
                    <td className="px-4 py-3.5">
                      <StatusBadge status={log.status} />
                    </td>
                    <td className="px-4 py-3.5 text-slate-300 max-w-xs truncate font-sans text-xs" title={log.reason || ''}>
                      {log.reason || '-'}
                    </td>
                    <td className="px-4 py-3.5 text-right font-sans">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs text-cyan-400 transition"
                      >
                        Payload
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500 italic">
                    No audit log records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Log Payload Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#131B2E] border border-slate-800 rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white font-mono">Audit Detail ID #{selectedLog.id}</h3>
              <button onClick={() => setSelectedLog(null)} className="text-slate-400 hover:text-white">Close</button>
            </div>
            <div className="space-y-4">
              {selectedLog.dry_run_result && (
                <JsonViewer data={selectedLog.dry_run_result} title="DRY_RUN_RESULT_PAYLOAD" maxHeight="max-h-60" />
              )}
              {selectedLog.replay_result && (
                <JsonViewer data={selectedLog.replay_result} title="REPLAY_RESULT_PAYLOAD" maxHeight="max-h-60" />
              )}
              {!selectedLog.dry_run_result && !selectedLog.replay_result && (
                <p className="text-xs text-slate-400 italic">No structured JSON payload attached to this audit entry.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
