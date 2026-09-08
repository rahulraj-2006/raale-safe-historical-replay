import React from 'react';
import { AlertOctagon, CheckCircle2, X } from 'lucide-react';

interface ReplayModalProps {
  isOpen: boolean;
  eventId: string;
  onConfirm: () => void;
  onClose: () => void;
  isLoading?: boolean;
}

export const ReplayModal: React.FC<ReplayModalProps> = ({
  isOpen,
  eventId,
  onConfirm,
  onClose,
  isLoading = false
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-[#131B2E] border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2 text-rose-400">
            <AlertOctagon className="w-5 h-5" />
            <h3 className="text-sm font-bold text-white">Confirm Safe Replay Execution</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3">
          <p className="text-xs text-slate-300 leading-relaxed">
            Are you sure you want to execute replay for event <span className="font-mono text-cyan-400 font-bold">{eventId}</span>?
          </p>
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 text-[11px] text-slate-400 space-y-1 font-mono">
            <p>• Safety Check: Enforced</p>
            <p>• Idempotency Lock: Active</p>
            <p>• Target Mutation: Isolated Mock Database</p>
          </div>
        </div>

        <div className="flex items-center justify-end space-x-3 pt-2">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 transition"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 transition disabled:opacity-50"
          >
            {isLoading ? (
              <span>Executing Replay...</span>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirm & Execute Replay</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
