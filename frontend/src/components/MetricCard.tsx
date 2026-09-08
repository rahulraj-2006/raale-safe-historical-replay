import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  color?: 'cyan' | 'emerald' | 'amber' | 'rose' | 'purple' | 'indigo';
}

export const MetricCard: React.FC<MetricCardProps> = ({ title, value, subtitle, icon: Icon, color = 'cyan' }) => {
  const getColorStyles = () => {
    switch (color) {
      case 'emerald':
        return { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' };
      case 'amber':
        return { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' };
      case 'rose':
        return { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/20' };
      case 'purple':
        return { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20' };
      case 'indigo':
        return { bg: 'bg-indigo-500/10', text: 'text-indigo-400', border: 'border-indigo-500/20' };
      case 'cyan':
      default:
        return { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/20' };
    }
  };

  const styles = getColorStyles();

  return (
    <div className="bg-[#131B2E] border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition shadow-lg shadow-black/20">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-slate-400">{title}</span>
        <div className={`p-2.5 rounded-xl ${styles.bg} border ${styles.border}`}>
          <Icon className={`w-4 h-4 ${styles.text}`} />
        </div>
      </div>
      <div className="flex items-baseline justify-between">
        <h3 className="text-2xl font-bold text-white tracking-tight">{typeof value === 'number' ? value.toLocaleString() : value}</h3>
      </div>
      {subtitle && <p className="text-[11px] text-slate-500 mt-1 font-medium">{subtitle}</p>}
    </div>
  );
};
