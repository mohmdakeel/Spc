'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { toast } from 'react-toastify';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Printer,
  History as HistoryIcon,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Sidebar from '../../components/SideBar';

// ---- Types ----
type CandidateSource = 'DRIVER_REQUEST' | 'SYSTEM_RULE' | 'INSPECTION' | string;
type CandidateStatus = 'ACTIVE' | 'IN_PROGRESS' | 'RESOLVED' | 'ARCHIVED' | string;

type ServiceCandidate = {
  id: number;
  vehicleId: number;
  vehicleNumber: string;
  source: CandidateSource;
  status: CandidateStatus;
  reason?: string;
  notes?: string;
  createdBy?: string;
  createdAt?: string; // ISO
};

type FilterMode = 'vehicleNumber' | 'source' | 'createdDate';

const ITEMS_PER_PAGE = 10;

// ---- Highlight helper (same look as your DSR page) ----
function HL({ str, q }: { str?: string | number; q: string }) {
  const s = (str ?? '').toString();
  const query = q.trim();
  if (!query) return <>{s || '-'}</>;
  const lower = s.toLowerCase();
  const ql = query.toLowerCase();

  const parts: React.ReactNode[] = [];
  let i = 0;
  while (true) {
    const idx = lower.indexOf(ql, i);
    if (idx === -1) {
      parts.push(s.slice(i));
      break;
    }
    if (idx > i) parts.push(s.slice(i, idx));
    parts.push(
      <span key={idx} className="bg-orange-100 text-orange-700 rounded px-1">
        {s.slice(idx, idx + query.length)}
      </span>
    );
    i = idx + query.length;
  }
  return <>{parts.length ? parts : '-'}</>;
}

export default function ServiceCandidatesPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [candidates, setCandidates] = useState<ServiceCandidate[]>([]);

  // ---- Filter toolbar state (same pattern) ----
  const [filterMode, setFilterMode] = useState<FilterMode>('vehicleNumber');
  const [filterQuery, setFilterQuery] = useState<string>(''); // text or date value
  const [activeFilter, setActiveFilter] = useState<{ mode: FilterMode; query: string } | null>(null);

  const [page, setPage] = useState(1);

  // ---- Fetch ----
  const loadCandidates = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:8081/api/service-candidates', { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to fetch service candidates');
      const json = await res.json();

      // Expect: { ok, data: { content: [...] } }
      const list: ServiceCandidate[] = (json?.data?.content ?? []) as ServiceCandidate[];
      setCandidates(Array.isArray(list) ? list : []);
    } catch (e: any) {
      toast.error(e?.message ?? 'Failed to load service candidates');
      setCandidates([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCandidates();
  }, []);

  // ---- Apply/Clear filter ----
  const handleApplyFilter = () => {
    const q = filterQuery.trim();
    if (!q) {
      setActiveFilter(null);
      return;
    }
    setActiveFilter({ mode: filterMode, query: q });
    setPage(1);
  };

  const handleClearFilter = () => {
    setFilterQuery('');
    setActiveFilter(null);
    setPage(1);
  };

  // ---- Filtered data ----
  const filtered = useMemo(() => {
    if (!activeFilter) return candidates;
    const q = activeFilter.query.toLowerCase();

    switch (activeFilter.mode) {
      case 'vehicleNumber':
        return candidates.filter((c) => (c.vehicleNumber ?? '').toLowerCase().includes(q));
      case 'source':
        return candidates.filter((c) => (c.source ?? '').toLowerCase().includes(q));
      case 'createdDate': {
        // Match exact day or startsWith for month-wide queries (e.g., "2025-09")
        return candidates.filter((c) => {
          const v = (c.createdAt ?? '').slice(0, 10); // yyyy-MM-dd from ISO
          return v === activeFilter.query || v.startsWith(activeFilter.query);
        });
      }
      default:
        return candidates;
    }
  }, [candidates, activeFilter]);

  useEffect(() => {
    setPage(1);
  }, [filterMode]);

  // ---- Pagination ----
  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const start = (page - 1) * ITEMS_PER_PAGE;
  const rows = filtered.slice(start, start + ITEMS_PER_PAGE);
  const goTo = (p: number) => setPage(Math.min(totalPages, Math.max(1, p)));

  // ---- Formatters ----
  const fmt = (v: unknown) => (v == null || v === '' ? '-' : String(v));
  const fmtDate = (iso?: string) => {
    if (!iso) return '-';
    try {
      // Show local date & time for clarity
      const d = new Date(iso);
      return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } catch {
      return iso;
    }
  };

  return (
    <Sidebar>
      <div className="w-full min-h-screen p-3 sm:p-4 bg-gray-50">
        <div className="bg-white rounded-xl shadow-md p-3 sm:p-4">
          {/* Back */}
          <div className="flex items-center mb-3 sm:mb-4">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-orange-600 hover:text-orange-800 p-2 rounded-lg hover:bg-orange-50 mr-3 sm:mr-4"
            >
              <ArrowLeft size={20} />
              Back
            </button>
          </div>

          {/* Header actions */}
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-lg sm:text-xl font-bold text-gray-800">Service Candidates</h1>

            <div className="flex items-center gap-2">
              <button
                className="flex items-center gap-2 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 shadow-sm transition-colors text-xs sm:text-sm"
                onClick={() => window.print()}
              >
                <Printer size={16} />
                Print
              </button>
            </div>
          </div>

          {/* ===== Filter Toolbar (3 options) ===== */}
          <div className="border border-orange-100 rounded-lg p-3 bg-orange-50/40 mb-4">
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex rounded-lg overflow-hidden border border-orange-200">
                {([
                  { k: 'vehicleNumber', label: 'Vehicle No' },
                  { k: 'source', label: 'Source' },
                  { k: 'createdDate', label: 'Created Date' },
                ] as { k: FilterMode; label: string }[]).map(({ k, label }) => {
                  const active = filterMode === k;
                  return (
                    <button
                      key={k}
                      type="button"
                      onClick={() => setFilterMode(k)}
                      className={`px-3 py-1.5 text-sm ${
                        active ? 'bg-orange-600 text-white' : 'bg-white text-orange-700 hover:bg-orange-100'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>

              {filterMode === 'createdDate' ? (
                <input
                  type="date"
                  value={filterQuery}
                  onChange={(e) => setFilterQuery(e.target.value)}
                  className="border border-orange-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-200"
                />
              ) : (
                <input
                  type="text"
                  value={filterQuery}
                  onChange={(e) => setFilterQuery(e.target.value)}
                  placeholder={
                    filterMode === 'vehicleNumber'
                      ? 'Search vehicle e.g., SPC-2025'
                      : 'Search source e.g., DRIVER_REQUEST'
                  }
                  className="border border-orange-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-200 flex-1 min-w-[12rem]"
                />
              )}

              <button
                type="button"
                onClick={handleApplyFilter}
                className="px-3 py-2 text-sm rounded-lg bg-orange-600 text-white hover:bg-orange-700"
              >
                Search
              </button>
              <button
                type="button"
                onClick={handleClearFilter}
                className="px-3 py-2 text-sm rounded-lg bg-white text-orange-700 border border-orange-200 hover:bg-orange-100"
              >
                Clear
              </button>

              {activeFilter && (
                <span className="text-xs text-orange-700 ml-1">
                  Filtering by <b>{activeFilter.mode}</b>: “{activeFilter.query}”
                </span>
              )}
            </div>
          </div>

          {/* ===== Table ===== */}
          {loading ? (
            <div className="text-center py-16 text-gray-900">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mb-3"></div>
              Loading service candidates…
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-orange-100 shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead className="bg-orange-50">
                  <tr>
                    <th className="border px-2 py-1 text-center text-xs font-semibold text-orange-800">#</th>
                    <th className="border px-2 py-1 text-xs font-semibold text-orange-800">Vehicle</th>
                    <th className="border px-2 py-1 text-xs font-semibold text-orange-800">Source</th>
                    <th className="border px-2 py-1 text-xs font-semibold text-orange-800">Status</th>
                    <th className="border px-2 py-1 text-xs font-semibold text-orange-800">Reason</th>
                    <th className="border px-2 py-1 text-xs font-semibold text-orange-800">Notes</th>
                    <th className="border px-2 py-1 text-xs font-semibold text-orange-800">Created By</th>
                    <th className="border px-2 py-1 text-xs font-semibold text-orange-800">Created At</th>
                    <th className="border px-2 py-1 text-xs font-semibold text-orange-800">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length > 0 ? (
                    rows.map((c, i) => (
                      <tr
                        key={c.id}
                        className={`text-gray-900 transition-colors ${
                          activeFilter ? 'bg-orange-50 hover:bg-orange-100' : 'bg-gray-50 hover:bg-orange-100'
                        }`}
                      >
                        <td className="border px-2 py-1 text-center text-xs">{start + i + 1}</td>

                        {/* Vehicle (highlight in vehicleNumber mode) */}
                        <td className="border px-2 py-1 text-xs font-medium">
                          {activeFilter?.mode === 'vehicleNumber' ? (
                            <HL str={c.vehicleNumber} q={activeFilter.query} />
                          ) : (
                            fmt(c.vehicleNumber)
                          )}
                        </td>

                        {/* Source (highlight in source mode) */}
                        <td className="border px-2 py-1 text-xs">
                          {activeFilter?.mode === 'source' ? (
                            <HL str={c.source} q={activeFilter.query} />
                          ) : (
                            fmt(c.source)
                          )}
                        </td>

                        {/* Status (badge like your HR approval) */}
                        <td className="border px-2 py-1 text-xs">
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] ${
                              c.status === 'ACTIVE'
                                ? 'bg-green-100 text-green-700'
                                : c.status === 'RESOLVED'
                                ? 'bg-blue-100 text-blue-700'
                                : c.status === 'ARCHIVED'
                                ? 'bg-gray-200 text-gray-700'
                                : 'bg-yellow-100 text-yellow-700'
                            }`}
                          >
                            {c.status}
                          </span>
                        </td>

                        <td className="border px-2 py-1 text-xs">{fmt(c.reason)}</td>
                        <td className="border px-2 py-1 text-xs">{fmt(c.notes)}</td>
                        <td className="border px-2 py-1 text-xs">{fmt(c.createdBy)}</td>

                        {/* Created At (highlight in createdDate mode; show ISO date string for exact match) */}
                        <td className="border px-2 py-1 text-xs">
                          {activeFilter?.mode === 'createdDate' ? (
                            <HL str={(c.createdAt ?? '').slice(0, 10)} q={activeFilter.query} />
                          ) : (
                            fmtDate(c.createdAt)
                          )}
                        </td>

                        <td className="border px-2 py-1 text-xs text-center">
                          <button
                            onClick={() => toast.info('Hook to candidate history')}
                            className="px-1 text-orange-600 hover:text-orange-800"
                            title="History"
                          >
                            <HistoryIcon size={14} />
                          </button>
                          {/* Add more actions (View, Convert to Work Order, etc.) as needed */}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={9} className="text-center py-6 text-gray-700 text-xs bg-gray-50">
                        No service candidates found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          <div className="flex justify-center items-center gap-2 mt-3">
            <button
              onClick={() => goTo(page - 1)}
              disabled={page === 1}
              className={`px-2 py-1 rounded ${
                page === 1 ? 'text-gray-500 cursor-not-allowed bg-gray-100' : 'bg-orange-100 text-orange-600 hover:bg-orange-200'
              }`}
            >
              <ChevronLeft size={16} />
            </button>
            <span className="px-2 py-1 text-xs text-gray-800">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => goTo(page + 1)}
              disabled={page === totalPages}
              className={`px-2 py-1 rounded ${
                page === totalPages ? 'text-gray-500 cursor-not-allowed bg-gray-100' : 'bg-orange-100 text-orange-600 hover:bg-orange-200'
              }`}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </Sidebar>
  );
}
