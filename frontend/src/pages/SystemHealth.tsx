import React, { useEffect, useState } from 'react';
import { Activity, Server, Database, CheckCircle2, RefreshCw, Cpu, Layers } from 'lucide-react';
import { fetchHealth } from '../services/api';
import { HealthStatus } from '../types';

export const SystemHealth: React.FC = () => {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const loadHealth = async () => {
    try {
      setLoading(true);
      const data = await fetchHealth();
      setHealth(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHealth();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">System Diagnostic & Health Telemetry</h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time infrastructure diagnostic status for RAALE local backend & mock target services
          </p>
        </div>
        <button
          onClick={loadHealth}
          className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-medium transition"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Ping Services</span>
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : health ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-[#131B2E] border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <Server className="w-4 h-4 text-cyan-400" />
              <span>Backend Core Service</span>
            </h3>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-2 border-b border-slate-800">
                <span className="text-slate-400">Service Title</span>
                <span className="font-semibold text-white">{health.service}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-800">
                <span className="text-slate-400">Platform Version</span>
                <span className="font-mono text-cyan-400">v{health.version}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-800">
                <span className="text-slate-400">API Health Status</span>
                <span className="font-bold text-emerald-400 flex items-center space-x-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{health.status}</span>
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-800">
                <span className="text-slate-400">Swagger API Docs</span>
                <a href="http://127.0.0.1:8000/docs" target="_blank" rel="noreferrer" className="text-cyan-400 hover:underline font-mono">
                  http://127.0.0.1:8000/docs
                </a>
              </div>
            </div>
          </div>

          <div className="bg-[#131B2E] border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <Database className="w-4 h-4 text-indigo-400" />
              <span>SQLite Database & Mock Target</span>
            </h3>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-2 border-b border-slate-800">
                <span className="text-slate-400">Database Engine</span>
                <span className="font-semibold text-white">SQLite 3 (raale.db)</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-800">
                <span className="text-slate-400">Database Connection</span>
                <span className="font-bold text-emerald-400">{health.database}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-800">
                <span className="text-slate-400">Synthetic Historical Archive</span>
                <span className="font-bold text-cyan-400 font-mono">{health.synthetic_event_count.toLocaleString()} Events</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-800">
                <span className="text-slate-400">Mock Target Engine</span>
                <span className="font-semibold text-emerald-400">Isolated & Traceable</span>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
