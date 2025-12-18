'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { toast } from 'react-toastify';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Edit,
  Printer,
  History as HistoryIcon,
  Plus,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Sidebar from '../../components/SideBar';

type HrApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
type DSR = {
  id: number;
  vehicleId: number;
  vehicleNumber: string;
  driverName?: string;
  epf: string;
  requestDate: string; // yyyy-MM-dd
  servicesNeeded?: string[];
  lastServiceReadingKm?: number;
  nextServiceReadingKm?: number;
  currentReadingKm?: number;
  adviceByVehicleOfficer?: string;
  adviceByMechanic?: string;
  hrApproval: HrApprovalStatus;
  createdAt?: string;
  updatedAt?: string;
};

const ITEMS_PER_PAGE = 10;
const CREATE_URL = '/Dewmini/Transport/Admin/DriverServiceRequestForm';
const EDIT_URL = '/Dewmini/Transport/Admin/DriverServiceRequestEditForm';

type FilterMode = 'vehicleNumber' | 'driverName' | 'requestDate';

/** Highlight helper: wraps q matches inside str with orange pills */
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

export default function DriverServiceRequestsPage() {
  const router = useRouter();
  const rawBase =
    (process.env.NEXT_PUBLIC_TRANSPORT_BASE || process.env.NEXT_PUBLIC_API_BASE_URL || '').replace(
      /\/+$/,
      ''
    );
  const API_BASE = rawBase ? `${rawBase}/api` : '/tapi';

  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<DSR[]>([]);

  // ===== FILTER TOOLBAR STATE =====
  const [filterMode, setFilterMode] = useState<FilterMode>('vehicleNumber');
  const [filterQuery, setFilterQuery] = useState<string>(''); // for text or date value
  const [activeFilter, setActiveFilter] = useState<{ mode: FilterMode; query: string } | null>(null);

  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<DSR | null>(null);

  const loadRequests = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/driver-service-requests`, { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to fetch driver service requests');
      const json = await res.json();
      const data: DSR[] = (json?.data?.content ?? []) as DSR[];
      setRequests(Array.isArray(data) ? data : []);
    } catch (e: any) {
      toast.error(e?.message ?? 'Failed to load requests');
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, [API_BASE]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  // ===== APPLY/CLEAR FILTER =====
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

  // ===== FILTERED DATA =====
  const filtered = useMemo(() => {
    if (!activeFilter) return requests;

    const q = activeFilter.query.toLowerCase();
    switch (activeFilter.mode) {
      case 'vehicleNumber':
        return requests.filter((r) => (r.vehicleNumber ?? '').toLowerCase().includes(q));
      case 'driverName':
        return requests.filter((r) => (r.driverName ?? '').toLowerCase().includes(q));
      case 'requestDate': {
        // Exact day or startsWith to allow month filtering (e.g., "2025-10")
        return requests.filter((r) => {
          const v = (r.requestDate ?? '').trim();
          return v === activeFilter.query || v.startsWith(activeFilter.query);
        });
      }
      default:
        return requests;
    }
  }, [requests, activeFilter]);

  useEffect(() => {
    setPage(1);
  }, [filterMode]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const start = (page - 1) * ITEMS_PER_PAGE;
  const rows = filtered.slice(start, start + ITEMS_PER_PAGE);
  const goTo = (p: number) => setPage(Math.min(totalPages, Math.max(1, p)));

  const onDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`${API_BASE}/driver-service-requests/${deleteTarget.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error((await res.json())?.message ?? 'Failed to delete');
      toast.success('Request deleted');
      setDeleteTarget(null);
      await loadRequests();
    } catch (e: any) {
      toast.error(e?.message ?? 'Failed to delete');
    }
  };

  const fmt = (v: unknown) => (v == null || v === '' ? '-' : String(v));
  const fmtDate = (s?: string) => (s ? new Date(s).toLocaleDateString() : '-');

  return (
    <Sidebar>
      <div className="w-full min-h-screen p-3 sm:p-4 bg-gray-50">
        <div className="bg-white rounded-xl shadow-md p-3 sm:p-4">
          <div className="flex items-center mb-3 sm:mb-4">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-orange-600 hover:text-orange-800 p-2 rounded-lg hover:bg-orange-50 mr-3 sm:mr-4"
            >
              <ArrowLeft size={20} />
              Back
            </button>
          </div>

          <div className="flex items-center justify-between mb-3">
            <h1 className="text-lg sm:text-xl font-bold text-gray-800">Driver Service Requests</h1>

            <div className="flex items-center gap-2">
              <Link
                href={CREATE_URL}
                className="flex items-center gap-2 bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 shadow-sm transition-colors text-xs sm:text-sm"
              >
                <Plus size={16} />
                Add
              </Link>

              <button
                className="flex items-center gap-2 bg-orange-100 text-orange-700 border border-orange-200 px-3 py-2 rounded-lg hover:bg-orange-200 shadow-sm transition-colors text-xs sm:text-sm"
                onClick={() => window.print()}
              >
                <Printer size={16} />
                Print
              </button>
            </div>
          </div>

          {/* ===== FILTER TOOLBAR ===== */}
          <div className="border border-orange-100 rounded-lg p-3 bg-orange-50/40 mb-4">
            <div className="flex flex-wrap items-center gap-2">
              {/* Mode selector */}
              <div className="inline-flex rounded-lg overflow-hidden border border-orange-200">
                {([
                  { k: 'vehicleNumber', label: 'Vehicle No' },
                  { k: 'driverName', label: 'Driver' },
                  { k: 'requestDate', label: 'Request Date' },
                ] as { k: FilterMode; label: string }[]).map(({ k, label }) => {
                  const active = filterMode === k;
                  return (
                    <button
                      key={k}
                      type="button"
                      onClick={() => setFilterMode(k)}
                      className={`px-3 py-1.5 text-sm ${
                        active
                          ? 'bg-orange-600 text-white'
                          : 'bg-white text-orange-700 hover:bg-orange-100'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>

              {/* Query control */}
              {filterMode === 'requestDate' ? (
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
                      : 'Search driver name'
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

          {/* Table */}
          {loading ? (
            <div className="text-center py-16 text-gray-900">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mb-3"></div>
              Loading requests…
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-orange-100 shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead className="bg-orange-50">
                  <tr>
                    <th className="border px-2 py-1 text-center text-xs font-semibold text-orange-800">#</th>
                    <th className="border px-2 py-1 text-xs font-semibold text-orange-800">Vehicle</th>
                    <th className="border px-2 py-1 text-xs font-semibold text-orange-800">Driver</th>
                    <th className="border px-2 py-1 text-xs font-semibold text-orange-800">EPF</th>
                    <th className="border px-2 py-1 text-xs font-semibold text-orange-800">Request Date</th>
                    <th className="border px-2 py-1 text-xs font-semibold text-orange-800">Services</th>
                    <th className="border px-2 py-1 text-xs font-semibold text-orange-800">KM (Last/Next/Current)</th>
                    <th className="border px-2 py-1 text-xs font-semibold text-orange-800">Officer Advice</th>
                    <th className="border px-2 py-1 text-xs font-semibold text-orange-800">Mechanic Advice</th>
                    <th className="border px-2 py-1 text-xs font-semibold text-orange-800">HR Approval</th>
                    <th className="border px-2 py-1 text-xs font-semibold text-orange-800">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length > 0 ? (
                    rows.map((r, i) => {
                      const isFiltered = !!activeFilter;
                      return (
                        <tr
                          key={r.id}
                          className={`bg-gray-50 text-gray-900 hover:bg-orange-100 transition-colors ${
                            isFiltered ? '' : ''
                          }`}
                        >
                          <td className="border px-2 py-1 text-center text-xs">{start + i + 1}</td>

                          {/* Vehicle cell with highlight when filtering by vehicleNumber */}
                          <td className="border px-2 py-1 text-xs font-medium">
                            {activeFilter?.mode === 'vehicleNumber' ? (
                              <HL str={r.vehicleNumber} q={activeFilter.query} />
                            ) : (
                              fmt(r.vehicleNumber)
                            )}
                          </td>

                          {/* Driver cell with highlight when filtering by driverName */}
                          <td className="border px-2 py-1 text-xs">
                            {activeFilter?.mode === 'driverName' ? (
                              <HL str={r.driverName} q={activeFilter.query} />
                            ) : (
                              fmt(r.driverName)
                            )}
                          </td>

                          <td className="border px-2 py-1 text-xs">{fmt(r.epf)}</td>

                          {/* Request date cell with highlight when filtering by requestDate */}
                          <td className="border px-2 py-1 text-xs">
                            {activeFilter?.mode === 'requestDate' ? (
                              <HL str={r.requestDate} q={activeFilter.query} />
                            ) : (
                              fmtDate(r.requestDate)
                            )}
                          </td>

                          <td className="border px-2 py-1 text-xs">
                            {r.servicesNeeded?.length ? r.servicesNeeded.join(', ') : '-'}
                          </td>

                          <td className="border px-2 py-1 text-xs">
                            {fmt(r.lastServiceReadingKm)} / {fmt(r.nextServiceReadingKm)} / {fmt(r.currentReadingKm)}
                          </td>

                          <td className="border px-2 py-1 text-xs">{fmt(r.adviceByVehicleOfficer)}</td>
                          <td className="border px-2 py-1 text-xs">{fmt(r.adviceByMechanic)}</td>

                          <td className="border px-2 py-1 text-xs">
                            <span
                              className={`px-2 py-0.5 rounded text-[11px] ${
                                r.hrApproval === 'APPROVED'
                                  ? 'bg-green-100 text-green-700'
                                  : r.hrApproval === 'REJECTED'
                                  ? 'bg-red-100 text-red-700'
                                  : 'bg-yellow-100 text-yellow-700'
                              }`}
                            >
                              {r.hrApproval}
                            </span>
                          </td>

                          <td className="border px-2 py-1 text-xs text-center">
                            <button
                              onClick={() => toast.info('Hook to history')}
                              className="px-1 text-orange-600 hover:text-orange-800"
                              title="History"
                            >
                              <HistoryIcon size={14} />
                            </button>

                            <Link
                              href={`${EDIT_URL}?id=${r.id}`}
                              className="px-1 text-green-600 hover:text-green-800 inline-flex"
                              title="Edit"
                            >
                              <Edit size={14} />
                            </Link>

                            <button
                              onClick={() => setDeleteTarget(r)}
                              className="px-1 text-red-600 hover:text-red-800"
                              title="Delete"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={11} className="text-center py-6 text-gray-700 text-xs bg-gray-50">
                        No driver service requests found.
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

        {/* Delete Confirmation */}
        {deleteTarget && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white p-4 rounded shadow-md w-80 text-gray-900">
              <h2 className="font-bold mb-2">Delete Request</h2>
              <p className="mb-4">Are you sure you want to delete request #{deleteTarget.id}?</p>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setDeleteTarget(null)}
                  className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 text-gray-800"
                >
                  Cancel
                </button>
                <button onClick={onDelete} className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700">
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Sidebar>
  );
}
