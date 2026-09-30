import React, { useState, useEffect } from 'react';
import {
  FileCheck, Play, CheckCircle2, AlertTriangle, XCircle, ShieldAlert,
  HelpCircle, Code, RefreshCw, Layers
} from 'lucide-react';
import { fetchTestSuite, runFullPayloadTestSuite, validatePayloadApi } from '../services/api';
import { TestCaseSample, PayloadValidationResult } from '../types';

export const PayloadValidation: React.FC = () => {
  const [testCases, setTestCases] = useState<TestCaseSample[]>([]);
  const [suiteResults, setSuiteResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [selectedTestCase, setSelectedTestCase] = useState<TestCaseSample | null>(null);

  // Custom Payload Testing state
  const [customInput, setCustomInput] = useState<string>('');
  const [customType, setCustomType] = useState<string>('HL7_ADT');
  const [customResult, setCustomResult] = useState<PayloadValidationResult | null>(null);
  const [customValidating, setCustomValidating] = useState(false);

  useEffect(() => {
    loadTestCases();
  }, []);

  const loadTestCases = async () => {
    try {
      const data = await fetchTestSuite();
      setTestCases(data);
      if (data.length > 0) {
        setSelectedTestCase(data[0]);
      }
    } catch (err) {
      console.error('Failed to load test suite cases', err);
    }
  };

  const handleRunFullSuite = async () => {
    setLoading(true);
    try {
      const res = await runFullPayloadTestSuite();
      setSuiteResults(res);
    } catch (err) {
      console.error('Error running test suite', err);
    } finally {
      setLoading(false);
    }
  };

  const handleValidateCustom = async () => {
    if (!customInput.trim()) return;
    setCustomValidating(true);
    try {
      let parsedPayload: any = customInput;
      if (customInput.trim().startsWith('{') || customInput.trim().startsWith('[')) {
        try {
          parsedPayload = JSON.parse(customInput);
        } catch (e) {
          // send raw string if json fails
        }
      }
      const res = await validatePayloadApi(parsedPayload, customType);
      setCustomResult(res);
    } catch (err) {
      console.error('Validation failed', err);
    } finally {
      setCustomValidating(false);
    }
  };

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'VALID':
        return (
          <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>VALID</span>
          </span>
        );
      case 'INVALID':
        return (
          <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20">
            <XCircle className="w-3.5 h-3.5" />
            <span>INVALID (Malformed)</span>
          </span>
        );
      case 'INCOMPLETE':
        return (
          <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>INCOMPLETE (Missing Fields)</span>
          </span>
        );
      case 'SCHEMA_INCOMPATIBLE':
        return (
          <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>SCHEMA INCOMPATIBLE</span>
          </span>
        );
      case 'TRANSFORMATION_INCOMPATIBLE':
        return (
          <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Layers className="w-3.5 h-3.5" />
            <span>TRANSFORMATION INCOMPATIBLE</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-300">
            <span>{status}</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <FileCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight flex items-center space-x-2">
                <span>Healthcare Payload Validation Suite</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  Review 2 Module
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Synthetic validation testing for HL7 ADT, HL7 ORU, and FHIR Bundle resources with strict edge-case blocking.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleRunFullSuite}
          disabled={loading}
          className="flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-semibold text-xs shadow-lg shadow-cyan-500/20 transition disabled:opacity-50"
        >
          {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
          <span>Run 10 Edge-Case Test Suite</span>
        </button>
      </div>

      {/* Test Suite Summary Card (if run) */}
      {suiteResults && (
        <div className="bg-slate-900/90 border border-cyan-500/30 rounded-2xl p-6 shadow-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h3 className="font-bold text-white text-base flex items-center space-x-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span>Test Suite Execution Results</span>
              </h3>
              <p className="text-xs text-slate-400">
                Passed {suiteResults.passed_tests} / {suiteResults.total_test_cases} automated edge-case validation scenarios.
              </p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-extrabold text-emerald-400">
                {Math.round((suiteResults.passed_tests / suiteResults.total_test_cases) * 100)}%
              </span>
              <p className="text-[10px] text-slate-400">Accuracy Rate</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {Object.entries(suiteResults.status_distribution || {}).map(([st, count]) => (
              <div key={st} className="bg-slate-950/60 border border-slate-800 p-3 rounded-xl text-center">
                <p className="text-[10px] text-slate-400 uppercase font-semibold">{st}</p>
                <p className="text-lg font-bold text-white mt-1">{count as number}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Grid: 10 Test Cases List + Detail Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Test Cases Selector List (5 Cols) */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center space-x-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            <span>10 Edge-Case Healthcare Test Cases</span>
          </h3>

          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {testCases.map((tc) => {
              const isSelected = selectedTestCase?.id === tc.id;
              const resultInSuite = suiteResults?.results?.find((r: any) => r.id === tc.id);

              return (
                <div
                  key={tc.id}
                  onClick={() => setSelectedTestCase(tc)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition ${
                    isSelected
                      ? 'bg-cyan-500/10 border-cyan-500/50 text-white shadow-md'
                      : 'bg-slate-950/60 border-slate-800/80 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-cyan-300">{tc.title}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                      {tc.payload_type}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-1">{tc.description}</p>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/50">
                    <span className="text-[10px] text-slate-400">Expected:</span>
                    {renderStatusBadge(tc.expected_status)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Test Case Code Inspector (7 Cols) */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5 flex flex-col justify-between">
          {selectedTestCase ? (
            <div className="space-y-4">
              <div className="border-b border-slate-800 pb-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-white">{selectedTestCase.title}</h3>
                  {renderStatusBadge(selectedTestCase.expected_status)}
                </div>
                <p className="text-xs text-slate-400 mt-1">{selectedTestCase.description}</p>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 mb-2 flex items-center space-x-1.5">
                  <Code className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Synthetic Test Payload</span>
                </label>
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 overflow-x-auto max-h-72">
                  <pre className="text-xs font-mono text-cyan-300 leading-relaxed whitespace-pre-wrap">
                    {typeof selectedTestCase.payload === 'object'
                      ? JSON.stringify(selectedTestCase.payload, null, 2)
                      : selectedTestCase.payload}
                  </pre>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={async () => {
                    const res = await validatePayloadApi(selectedTestCase.payload, selectedTestCase.payload_type);
                    setCustomResult(res);
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition flex items-center space-x-2"
                >
                  <Play className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Run Live Diagnostic Check on Selected Case</span>
                </button>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-500">Select a test case from the left to view payload details.</p>
          )}

          {/* Validation Result Box */}
          {customResult && (
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3 mt-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-white">Diagnostic Output</h4>
                {renderStatusBadge(customResult.status)}
              </div>

              {customResult.issues.length > 0 ? (
                <div className="space-y-1">
                  <p className="text-[11px] font-semibold text-red-400">Issues Identified:</p>
                  <ul className="list-disc list-inside text-xs text-slate-300 space-y-1">
                    {customResult.issues.map((iss, idx) => (
                      <li key={idx}>{iss}</li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="text-xs text-emerald-400 font-medium">
                  ✓ Payload passed structural, schema, and field-level validation rules.
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Interactive Custom Payload Tester */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <h3 className="text-base font-bold text-white flex items-center space-x-2">
          <Code className="w-5 h-5 text-cyan-400" />
          <span>Interactive Healthcare Payload Tester</span>
        </h3>
        <p className="text-xs text-slate-400">
          Paste any synthetic HL7 v2 (ADT/ORU) pipe-delimited string or FHIR JSON Bundle below to test live validation & diagnostics.
        </p>

        <div className="flex items-center space-x-4">
          <select
            value={customType}
            onChange={(e) => setCustomType(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-white text-xs rounded-xl px-3 py-2 font-medium"
          >
            <option value="AUTO">Auto-Detect Format</option>
            <option value="HL7_ADT">HL7 ADT Message</option>
            <option value="HL7_ORU">HL7 ORU Message</option>
            <option value="FHIR_BUNDLE">FHIR Resource / Bundle</option>
          </select>

          <button
            onClick={handleValidateCustom}
            disabled={customValidating || !customInput.trim()}
            className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-md shadow-cyan-500/20 transition disabled:opacity-50"
          >
            {customValidating ? 'Validating...' : 'Validate Payload'}
          </button>
        </div>

        <textarea
          value={customInput}
          onChange={(e) => setCustomInput(e.target.value)}
          placeholder="Paste synthetic HL7 message (MSH|^~\&|...) or FHIR JSON Bundle..."
          rows={6}
          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500"
        />
      </div>
    </div>
  );
};
