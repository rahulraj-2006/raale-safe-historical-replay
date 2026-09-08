import React, { useEffect, useState } from 'react';
import { Settings as SettingsIcon, Shield, Lock, Save, RefreshCw, AlertTriangle } from 'lucide-react';
import { fetchRules, updateRule } from '../services/api';
import { ReplayRule, UserRole } from '../types';

interface SettingsProps {
  currentRole: UserRole;
}

export const Settings: React.FC<SettingsProps> = ({ currentRole }) => {
  const [rules, setRules] = useState<ReplayRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const loadRules = async () => {
    try {
      setLoading(true);
      const res = await fetchRules();
      setRules(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRules();
  }, []);

  const handleToggle = async (ruleId: number, currentVal: boolean) => {
    if (currentRole !== 'Auditor / Operations Manager') {
      setMessage('Access Denied: Only Auditor / Operations Manager role can modify replay safety rules.');
      return;
    }

    try {
      setUpdatingId(ruleId);
      const updated = await updateRule(ruleId, !currentVal);
      setRules((prev) => prev.map((r) => (r.id === ruleId ? updated : r)));
      setMessage(`Rule '${updated.name}' set to ${updated.is_enabled ? 'ENABLED' : 'DISABLED'}`);
    } catch (err: any) {
      setMessage(`Failed to update rule: ${err.message}`);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Replay Safety Rules & Configuration</h2>
          <p className="text-xs text-slate-400 mt-1">
            Configure active safety constraints and validation policies. All changes persist directly to SQLite.
          </p>
        </div>
        <button
          onClick={loadRules}
          className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-medium transition"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Reload Config</span>
        </button>
      </div>

      {message && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-cyan-300 flex items-center justify-between">
          <span>{message}</span>
          <button onClick={() => setMessage(null)} className="text-slate-500 hover:text-white">Clear</button>
        </div>
      )}

      {currentRole !== 'Auditor / Operations Manager' && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex items-center space-x-3 text-xs text-amber-300">
          <Lock className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            You are currently viewing in <strong className="text-white">Integration Engineer</strong> role. Switch to <strong className="text-white">Auditor / Operations Manager</strong> in the top header to edit safety policies.
          </span>
        </div>
      )}

      {/* Rules Grid */}
      <div className="bg-[#131B2E] border border-slate-800 rounded-2xl p-6 space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
          <Shield className="w-4 h-4 text-cyan-400" />
          <span>Active Replay Enforcement Rules</span>
        </h3>

        {loading ? (
          <p className="text-xs text-slate-500 italic py-4">Loading safety rules...</p>
        ) : (
          <div className="space-y-4">
            {rules.map((rule) => (
              <div
                key={rule.id}
                className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex items-center justify-between transition hover:border-slate-700"
              >
                <div className="space-y-1 max-w-xl">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-bold text-white">{rule.name}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-cyan-400">
                      {rule.rule_key}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">{rule.description}</p>
                </div>

                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => handleToggle(rule.id, rule.is_enabled)}
                    disabled={updatingId === rule.id || currentRole !== 'Auditor / Operations Manager'}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50 ${
                      rule.is_enabled ? 'bg-cyan-500' : 'bg-slate-800'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        rule.is_enabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                  <span className={`text-xs font-bold w-12 ${rule.is_enabled ? 'text-cyan-400' : 'text-slate-500'}`}>
                    {rule.is_enabled ? 'ON' : 'OFF'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
