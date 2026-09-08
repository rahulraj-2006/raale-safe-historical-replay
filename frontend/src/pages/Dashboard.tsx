import React, { useEffect, useState } from 'react';
import {
  Database, CheckCircle2, ShieldAlert, RotateCcw,
  PlaySquare, Award, AlertTriangle, ShieldCheck
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { fetchDashboardMetrics } from '../services/api';
import { DashboardMetrics } from '../types';
import { MetricCard } from '../components/MetricCard';

const COLORS = ['#38BDF8', '#34D399', '#FBBF24', '#F43F5E', '#A78BFA', '#F472B6'];

export const Dashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchDashboardMetrics();
      setMetrics(data);
    } catch (err: any) {
      setError(err.message || 'Failed to connect to RAALE backend service.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-400 font-medium">Loading Real-Time Platform Dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-6 text-center space-y-3">
        <AlertTriangle className="w-8 h-8 text-rose-400 mx-auto" />
        <h3 className="text-sm font-bold text-white">Backend Connection Error</h3>
        <p className="text-xs text-slate-400">{error || 'Could not load backend statistics.'}</p>
        <button
          onClick={loadData}
          className="px-4 py-2 bg-rose-500 hover:bg-rose-400 text-slate-950 text-xs font-bold rounded-xl transition"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  const sourceChartData = Object.entries(metrics.events_by_source).map(([name, value]) => ({ name, value }));
  const statusChartData = Object.entries(metrics.replay_status_counts).map(([name, value]) => ({ name, value }));
  const failureChartData = Object.entries(metrics.failure_reason_counts).map(([name, value]) => ({ name, value }));

  return (
    <div className="space-y-8">
      {/* Title & Banner */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Integration Safety Dashboard</h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time telemetry across 10,000+ synthetic historical healthcare events
          </p>
        </div>
        <div className="flex items-center space-x-2 text-xs font-semibold text-slate-400 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl">
          <span>Avg Latency:</span>
          <span className="text-cyan-400 font-mono">{metrics.avg_processing_time_ms} ms</span>
        </div>
      </div>

      {/* 8 Mandatory Dashboard Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Total Events" value={metrics.total_events} subtitle="Synthetic Archive" icon={Database} color="cyan" />
        <MetricCard title="Eligible Events" value={metrics.eligible_events} subtitle="Passed Validation" icon={CheckCircle2} color="emerald" />
        <MetricCard title="Blocked Events" value={metrics.blocked_events} subtitle="Safety Violation" icon={ShieldAlert} color="rose" />
        <MetricCard title="Already Replayed" value={metrics.already_replayed} subtitle="Idempotency Locked" icon={RotateCcw} color="indigo" />
        <MetricCard title="Dry Runs" value={metrics.dry_runs_executed} subtitle="Non-mutating Simulations" icon={PlaySquare} color="purple" />
        <MetricCard title="Successful Replays" value={metrics.successful_replays} subtitle="Target Updated" icon={Award} color="emerald" />
        <MetricCard title="Failed Replays" value={metrics.failed_replays} subtitle="Execution Failures" icon={AlertTriangle} color="amber" />
        <MetricCard title="Duplicates Prevented" value={metrics.duplicates_prevented} subtitle="Idempotency Protection" icon={ShieldCheck} color="cyan" />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Events by Source System */}
        <div className="bg-[#131B2E] border border-slate-800 rounded-2xl p-6 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center space-x-2">
            <span>Historical Events by Source System</span>
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sourceChartData} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                <XAxis dataKey="name" stroke="#64748B" fontSize={10} angle={-25} textAnchor="end" />
                <YAxis stroke="#64748B" fontSize={10} />
                <Tooltip contentStyle={{ backgroundColor: '#0F172A', borderColor: '#1E293B', borderRadius: '12px', fontSize: '12px' }} />
                <Bar dataKey="value" fill="#38BDF8" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Replay Status Distribution */}
        <div className="bg-[#131B2E] border border-slate-800 rounded-2xl p-6 space-y-4">
          <h3 className="text-sm font-bold text-white">Replay Status Distribution</h3>
          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {statusChartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0F172A', borderColor: '#1E293B', borderRadius: '12px', fontSize: '12px' }} />
                <Legend wrapperStyle={{ fontSize: '11px', color: '#94A3B8' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Failure Reasons & Safety Protection Breakdown */}
      <div className="bg-[#131B2E] border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white">Safety Rule Violation & Failure Prevention Breakdown</h3>
          <span className="text-xs text-slate-400">Deterministic Edge Cases</span>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={failureChartData} layout="vertical" margin={{ top: 10, right: 20, left: 40, bottom: 5 }}>
              <XAxis type="number" stroke="#64748B" fontSize={10} />
              <YAxis type="category" dataKey="name" stroke="#64748B" fontSize={10} width={140} />
              <Tooltip contentStyle={{ backgroundColor: '#0F172A', borderColor: '#1E293B', borderRadius: '12px', fontSize: '12px' }} />
              <Bar dataKey="value" fill="#F43F5E" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
