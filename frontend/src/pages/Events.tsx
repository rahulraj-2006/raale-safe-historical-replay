import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Eye, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { fetchEvents } from '../services/api';
import { EventBase, EventListResponse } from '../types';
import { StatusBadge } from '../components/StatusBadge';

export const Events: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<EventListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const loadEvents = async () => {
    try {
      setLoading(true);
      const res = await fetchEvents({
        page,
        size: 15,
        source_system: sourceFilter || undefined,
        status: statusFilter || undefined,
        search: search || undefined
      });
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, [page, sourceFilter, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadEvents();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Historical Event Archive</h2>
          <p className="text-xs text-slate-400 mt-1">
            Search, filter, and inspect {data?.total.toLocaleString() || '10,000+'} synthetic historical events
          </p>
        </div>
        <button
          onClick={loadEvents}
          className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-medium transition"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-[#131B2E] border border-slate-800 rounded-2xl p-4 flex flex-wrap gap-4 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="flex items-center space-x-2 flex-1 min-w-[260px]">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search Event ID, Entity Ref, or Source..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
            />
          </div>
          <button type="submit" className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition">
            Search
          </button>
        </form>

        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={sourceFilter}
              onChange={(e) => { setSourceFilter(e.target.value); setPage(1); }}
              className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-cyan-500 transition"
            >
              <option value="">All Source Systems</option>
              <option value="LAB_V1">LAB_V1</option>
              <option value="LAB_V2">LAB_V2</option>
              <option value="RADIOLOGY_LEGACY">RADIOLOGY_LEGACY</option>
              <option value="RADIOLOGY_V2">RADIOLOGY_V2</option>
              <option value="PHARMACY_LEGACY">PHARMACY_LEGACY</option>
              <option value="ADMISSION_V1">ADMISSION_V1</option>
              <option value="BILLING_V1">BILLING_V1</option>
            </select>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-cyan-500 transition"
          >
            <option value="">All Statuses</option>
            <option value="ARCHIVED">ARCHIVED</option>
            <option value="PENDING_REPLAY">PENDING_REPLAY</option>
            <option value="REPLAYED">REPLAYED</option>
            <option value="BLOCKED">BLOCKED</option>
          </select>
        </div>
      </div>

      {/* Events Table */}
      <div className="bg-[#131B2E] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px] font-semibold border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">Event ID</th>
                <th className="px-4 py-3">Source System</th>
                <th className="px-4 py-3">Event Type</th>
                <th className="px-4 py-3">Entity Reference</th>
                <th className="px-4 py-3">Schema / Trf</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500 italic">
                    Loading historical events...
                  </td>
                </tr>
              ) : data && data.items.length > 0 ? (
                data.items.map((event) => (
                  <tr key={event.id} className="hover:bg-slate-800/40 transition">
                    <td className="px-4 py-3.5 font-bold text-cyan-400">{event.id}</td>
                    <td className="px-4 py-3.5 text-slate-300">{event.source_system}</td>
                    <td className="px-4 py-3.5 text-slate-300">{event.event_type}</td>
                    <td className="px-4 py-3.5 text-indigo-300">{event.entity_reference}</td>
                    <td className="px-4 py-3.5 text-slate-400">
                      <span className="text-slate-300">{event.schema_version}</span> → <span className="text-cyan-400">{event.transformation_version}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusBadge status={event.status} />
                    </td>
                    <td className="px-4 py-3.5 text-right font-sans">
                      <button
                        onClick={() => navigate(`/events/${event.id}`)}
                        className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-medium text-cyan-400 transition"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect</span>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500 italic">
                    No matching events found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {data && (
          <div className="px-6 py-4 bg-slate-900/60 border-t border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-400">
              Showing page <span className="text-white font-bold">{data.page}</span> of{' '}
              <span className="text-white font-bold">{data.pages}</span> ({data.total.toLocaleString()} total)
            </span>
            <div className="flex items-center space-x-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white disabled:opacity-40 transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={page >= data.pages}
                onClick={() => setPage(page + 1)}
                className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white disabled:opacity-40 transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
