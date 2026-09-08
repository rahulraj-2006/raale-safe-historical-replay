import React, { useEffect, useState } from 'react';
import { RotateCcw, CheckCircle2, XCircle, Send, ShieldCheck, AlertOctagon } from 'lucide-react';
import { fetchEvents, requestReplay, approveReplay, rejectReplay, executeReplay } from '../services/api';
import { EventBase, UserRole } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { ReplayModal } from '../components/ReplayModal';

interface ReplayOperationsProps {
  currentRole: UserRole;
}

export const ReplayOperations: React.FC<ReplayOperationsProps> = ({ currentRole }) => {
  const [events, setEvents] = useState<EventBase[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const loadOperationalEvents = async () => {
    try {
      setLoading(true);
      const res = await fetchEvents({ page: 1, size: 50 });
      setEvents(res.items);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOperationalEvents();
  }, []);

  const handleApprove = async (eventId: string) => {
    try {
      const res = await approveReplay(eventId, currentRole);
      setMessage(res.message);
      loadOperationalEvents();
    } catch (err: any) {
      setMessage(`Approval Error: ${err.message}`);
    }
  };

  const handleReject = async (eventId: string) => {
    try {
      const res = await rejectReplay(eventId, currentRole, 'Rejected by Auditor in Replay Control');
      setMessage(res.message);
      loadOperationalEvents();
    } catch (err: any) {
      setMessage(`Rejection Error: ${err.message}`);
    }
  };

  const handleExecuteClick = (eventId: string) => {
    setSelectedEventId(eventId);
    setIsModalOpen(true);
  };

  const handleConfirmExecution = async () => {
    if (!selectedEventId) return;
    try {
      const res = await executeReplay(selectedEventId, currentRole);
      setMessage(res.message);
      setIsModalOpen(false);
      loadOperationalEvents();
    } catch (err: any) {
      setMessage(`Execution Error: ${err.response?.data?.detail || err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Replay Operations & Governance Queue</h2>
          <p className="text-xs text-slate-400 mt-1">
            Active role: <span className="text-cyan-400 font-semibold">{currentRole}</span> • Enforcing dual-control approval & safety locks
          </p>
        </div>
      </div>

      {message && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-cyan-300 flex items-center justify-between">
          <span>{message}</span>
          <button onClick={() => setMessage(null)} className="text-slate-500 hover:text-white">Clear</button>
        </div>
      )}

      {/* Operations Table */}
      <div className="bg-[#131B2E] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px] font-semibold border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">Event ID</th>
                <th className="px-4 py-3">Source / Entity</th>
                <th className="px-4 py-3">Event Type</th>
                <th className="px-4 py-3">Transformation</th>
                <th className="px-4 py-3">Current Status</th>
                <th className="px-4 py-3 text-right">Role Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500 italic">
                    Loading queue items...
                  </td>
                </tr>
              ) : (
                events.map((evt) => (
                  <tr key={evt.id} className="hover:bg-slate-800/40 transition">
                    <td className="px-4 py-3.5 font-bold text-cyan-400">{evt.id}</td>
                    <td className="px-4 py-3.5">
                      <p className="text-slate-200">{evt.source_system}</p>
                      <p className="text-[10px] text-slate-500">{evt.entity_reference}</p>
                    </td>
                    <td className="px-4 py-3.5 text-slate-300">{evt.event_type}</td>
                    <td className="px-4 py-3.5 text-cyan-400 font-semibold">{evt.transformation_version}</td>
                    <td className="px-4 py-3.5">
                      <StatusBadge status={evt.status} />
                    </td>
                    <td className="px-4 py-3.5 text-right font-sans">
                      <div className="flex items-center justify-end space-x-2">
                        {currentRole === 'Auditor / Operations Manager' && (
                          <>
                            <button
                              onClick={() => handleApprove(evt.id)}
                              disabled={evt.status === 'REPLAYED'}
                              className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 text-xs font-semibold transition disabled:opacity-40"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleReject(evt.id)}
                              disabled={evt.status === 'REPLAYED'}
                              className="px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 text-xs font-semibold transition disabled:opacity-40"
                            >
                              Reject
                            </button>
                          </>
                        )}

                        <button
                          onClick={() => handleExecuteClick(evt.id)}
                          disabled={evt.status === 'REPLAYED'}
                          className="flex items-center space-x-1 px-3 py-1 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition disabled:opacity-40"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Safe Replay</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ReplayModal
        isOpen={isModalOpen}
        eventId={selectedEventId || ''}
        onConfirm={handleConfirmExecution}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};
