import React from 'react';

interface StatusBadgeProps {
  status: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const getStyle = () => {
    switch (status.toUpperCase()) {
      case 'PASS':
      case 'SUCCESS':
      case 'REPLAYED':
      case 'EXECUTED':
      case 'APPROVED':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'WARNING':
      case 'PENDING_APPROVAL':
      case 'PENDING_REPLAY':
      case 'MEDIUM':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'BLOCKED':
      case 'FAILED':
      case 'REJECTED':
      case 'CRITICAL':
      case 'HIGH':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      case 'ARCHIVED':
      case 'LOW':
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${getStyle()}`}>
      {status}
    </span>
  );
};
