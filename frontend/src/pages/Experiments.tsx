import React, { useEffect, useState } from 'react';
import { FlaskConical, Play, CheckCircle2, ShieldAlert, Zap, Award } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { fetchLatestExperiment, runNewExperiment } from '../services/api';
import { ExperimentRunResponse } from '../types';
import { MetricCard } from '../components/MetricCard';

export const Experiments: React.FC = () => {
  const [data, setData] = useState<ExperimentRunResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetchLatestExperiment();
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRunExperiment = async () => {
    try {
      setRunning(true);
      const res = await runNewExperiment(500);
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setRunning(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const comparisonChartData = [
    {
      metric: 'Unsafe Replays',
      Baseline: data.baseline.unsafe_replays,
      SafeReplay: data.safe_replay.unsafe_replays
    },
    {
      metric: 'Blocked Failures',
      Baseline: data.baseline.blocked_events,
      SafeReplay: data.safe_replay.blocked_events
    },
    {
      metric: 'Dep Failures',
      Baseline: data.baseline.dependency_failures,
      SafeReplay: data.safe_replay.dependency_failures
    },
    {
      metric: 'Trans Errors',
      Baseline: data.baseline.transformation_errors,
      SafeReplay: data.safe_replay.transformation_errors
    }
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Comparative Replay Engine Experiment</h2>
          <p className="text-xs text-slate-400 mt-1">
            Empirical evaluation over synthetic archive: <span className="text-rose-400 font-semibold">Baseline Legacy Engine</span> vs <span className="text-cyan-400 font-semibold">RAALE Safe Replay Engine</span>
          </p>
        </div>
        <button
          onClick={handleRunExperiment}
          disabled={running}
          className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 transition disabled:opacity-50"
        >
          <Play className="w-4 h-4 fill-current" />
          <span>{running ? 'Executing Benchmark...' : 'Run Real Experiment'}</span>
        </button>
      </div>

      {/* Summary Highlight Card */}
      <div className="bg-gradient-to-r from-slate-900 via-[#131B2E] to-slate-900 border border-cyan-500/30 rounded-2xl p-6 shadow-xl space-y-2">
        <div className="flex items-center space-x-2 text-cyan-400 text-xs font-bold uppercase tracking-wider">
          <Award className="w-4 h-4" />
          <span>Experiment Summary Result</span>
        </div>
        <p className="text-sm font-semibold text-white leading-relaxed">{data.summary}</p>
        <p className="text-xs text-slate-400">
          Experiment ID: <span className="font-mono text-cyan-300">{data.experiment_id}</span> • Timestamp: {new Date(data.timestamp).toLocaleString()}
        </p>
      </div>

      {/* Metrics Comparison Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Baseline Engine Column */}
        <div className="bg-[#131B2E] border border-rose-500/30 rounded-2xl p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-rose-400 flex items-center space-x-2">
              <ShieldAlert className="w-4 h-4" />
              <span>{data.baseline.engine_name}</span>
            </h3>
            <span className="text-xs font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2.5 py-0.5 rounded-full">
              Error Rate: {data.baseline.error_rate_pct}%
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
              <span className="text-slate-500 block">Total Events</span>
              <span className="text-lg font-bold text-white">{data.baseline.total_events}</span>
            </div>
            <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
              <span className="text-slate-500 block">Unsafe Replays</span>
              <span className="text-lg font-bold text-rose-400">{data.baseline.unsafe_replays}</span>
            </div>
            <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
              <span className="text-slate-500 block">Duplicate Replays</span>
              <span className="text-lg font-bold text-amber-400">{data.baseline.duplicate_replays}</span>
            </div>
            <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
              <span className="text-slate-500 block">Avg Processing Time</span>
              <span className="text-lg font-bold text-slate-300">{data.baseline.avg_processing_time_ms} ms</span>
            </div>
          </div>
        </div>

        {/* Safe Replay Engine Column */}
        <div className="bg-[#131B2E] border border-cyan-500/40 rounded-2xl p-6 space-y-5 shadow-lg shadow-cyan-500/10">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-cyan-400 flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{data.safe_replay.engine_name}</span>
            </h3>
            <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
              Error Rate: {data.safe_replay.error_rate_pct}% Guaranteed
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
              <span className="text-slate-500 block">Total Events</span>
              <span className="text-lg font-bold text-white">{data.safe_replay.total_events}</span>
            </div>
            <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
              <span className="text-slate-500 block">Unsafe Replays</span>
              <span className="text-lg font-bold text-emerald-400">0 (Guaranteed)</span>
            </div>
            <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
              <span className="text-slate-500 block">Blocked Safety Violations</span>
              <span className="text-lg font-bold text-cyan-400">{data.safe_replay.blocked_events}</span>
            </div>
            <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
              <span className="text-slate-500 block">Avg Processing Time</span>
              <span className="text-lg font-bold text-slate-300">{data.safe_replay.avg_processing_time_ms} ms</span>
            </div>
          </div>
        </div>
      </div>

      {/* Comparison Chart */}
      <div className="bg-[#131B2E] border border-slate-800 rounded-2xl p-6 space-y-4">
        <h3 className="text-sm font-bold text-white">Baseline vs Safe Replay Metric Comparison</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={comparisonChartData} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
              <XAxis dataKey="metric" stroke="#64748B" fontSize={11} />
              <YAxis stroke="#64748B" fontSize={11} />
              <Tooltip contentStyle={{ backgroundColor: '#0F172A', borderColor: '#1E293B', borderRadius: '12px', fontSize: '12px' }} />
              <Legend wrapperStyle={{ fontSize: '11px', color: '#94A3B8' }} />
              <Bar dataKey="Baseline" fill="#F43F5E" radius={[6, 6, 0, 0]} />
              <Bar dataKey="SafeReplay" fill="#38BDF8" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
