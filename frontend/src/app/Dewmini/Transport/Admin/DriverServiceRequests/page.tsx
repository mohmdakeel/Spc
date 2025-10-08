'use client';
import React, { useEffect, useMemo, useState } from 'react';
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
// 1. ADDED IMPORT FOR SIDEBAR
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

// Routes you asked for
const CREATE_URL = '/Dewmini/Transport/Admin/DriverServiceRequestForm';
const EDIT_URL = '/Dewmini/Transport/Admin/DriverServiceRequestEditForm';

export default function DriverServiceRequestsPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<DSR[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const [deleteTarget, setDeleteTarget] = useState<DSR | null>(null);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:8081/api/driver-service-requests', { cache: 'no-store' });
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
  };

  useEffect(() => {
    loadRequests();
  }, []);

  // Filtered by search
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return requests;
    return requests.filter(r =>
      [
        r.id,
        r.vehicleNumber,
        r.driverName,
        r.epf,
        r.requestDate,
        r.lastServiceReadingKm,
        r.nextServiceReadingKm,
        r.currentReadingKm,
        r.adviceByVehicleOfficer,
        r.adviceByMechanic,
        r.hrApproval,
        ...(r.servicesNeeded ?? []),
      ]
        .join(' ')
        .toLowerCase()
        .includes(q)
    );
  }, [requests, search]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const start = (page - 1) * ITEMS_PER_PAGE;
  const rows = filtered.slice(start, start + ITEMS_PER_PAGE);
  const goTo = (p: number) => setPage(Math.min(totalPages, Math.max(1, p)));

  const onDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`http://localhost:8081/api/driver-service-requests/${deleteTarget.id}`, {
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
    // REMOVED THE UNNECESSARY OUTER DIV AND KEPT ONLY THE SIDEBAR WRAPPER
    <Sidebar> 
      {/* This div is the content that goes into the <main> tag of the Sidebar component.
        It needs to ensure it takes up the minimum height of the screen to push the
        page footer (if any) down, but the overall screen-filling is handled by Sidebar.
      */}
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
                className="flex items-center gap-2 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 shadow-sm transition-colors text-xs sm:text-sm"
                onClick={() => window.print()}
              >
                <Printer size={16} />
                Print
              </button>
            </div>
          </div>

          {/* Search */}
          <input
            type="text"
            className="border border-gray-300 rounded px-2 py-1 w-full mb-4 text-gray-900"
            placeholder="Search by vehicle, driver, EPF, services…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />

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
                    rows.map((r, i) => (
                      <tr key={r.id} className="bg-gray-50 text-gray-900 hover:bg-orange-100 transition-colors">
                        <td className="border px-2 py-1 text-center text-xs">{start + i + 1}</td>
                        <td className="border px-2 py-1 text-xs font-medium">{fmt(r.vehicleNumber)}</td>
                        <td className="border px-2 py-1 text-xs">{fmt(r.driverName)}</td>
                        <td className="border px-2 py-1 text-xs">{fmt(r.epf)}</td>
                        <td className="border px-2 py-1 text-xs">{fmtDate(r.requestDate)}</td>
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
                    ))
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