'use client';

import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { X, Check, ThumbsDown, Loader2 } from 'lucide-react';

type Dsr = {
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
  hrApproval: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt?: string;
};

type ApiPage<T> = {
  content: T[];
  page: { size: number; number: number; totalElements: number; totalPages: number };
};

type ApiResponse<T> = { ok: boolean; message?: string; data?: T };

const rawBase =
  (process.env.NEXT_PUBLIC_TRANSPORT_BASE || process.env.NEXT_PUBLIC_API_BASE_URL || '').replace(
    /\/+$/,
    ''
  );
const API_BASE = rawBase ? `${rawBase}/api` : '/tapi';

export default function HRDriverServiceRequests() {
  const [items, setItems] = useState<Dsr[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(15);
  const [totalPages, setTotalPages] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);

  // Approve modal state
  const [showApprove, setShowApprove] = useState(false);
  const [approveTarget, setApproveTarget] = useState<Dsr | null>(null);
  const [urgency, setUrgency] = useState<'IMMEDIATE' | 'NORMAL' | ''>('');
  const [dept, setDept] = useState<'WORK_MANAGER' | 'MAINSTORES' | 'NONE' | ''>('');
  const [requiredBy, setRequiredBy] = useState<string>(''); // yyyy-MM-dd
  const [extra, setExtra] = useState<string>(''); // comma separated
  const [submitting, setSubmitting] = useState(false);

  const fetchList = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/driver-service-requests?page=${page}&size=${size}`);
      const json: ApiResponse<ApiPage<Dsr>> = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.message || `HTTP ${res.status}`);
      setItems(json.data?.content || []);
      setTotalPages(json.data?.page.totalPages || 0);
    } catch (e: any) {
      toast.error(`Failed to load DSRs: ${e.message || e}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, size, refreshKey]);

  const onApproveClick = (dsr: Dsr) => {
    setApproveTarget(dsr);
    setUrgency('');
    setDept('');
    setRequiredBy('');
    setExtra('');
    setShowApprove(true);
  };

  const approveCall = async (payload?: {
    extraServices?: string[];
    urgency?: 'IMMEDIATE' | 'NORMAL';
    approvalByDepartment?: 'WORK_MANAGER' | 'MAINSTORES' | 'NONE';
    requiredByDate?: string; // yyyy-MM-dd
  }) => {
    if (!approveTarget) return;
    setSubmitting(true);
    try {
      const res = await fetch(
        `${API_BASE}/driver-service-requests/${approveTarget.id}/hr-approve`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload ?? {}),
        }
      );
      const json = (await res.json()) as ApiResponse<any>;
      if (!res.ok || !json.ok) throw new Error(json.message || `HTTP ${res.status}`);
      toast.success(`Approved DSR #${approveTarget.id}`);
      setShowApprove(false);
      setApproveTarget(null);
      setRefreshKey((k) => k + 1);
    } catch (e: any) {
      toast.error(`Approve failed: ${e.message || e}`);
    } finally {
      setSubmitting(false);
    }
  };

  const onApproveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Build optional body; omit empty fields so HR can skip
    const body: any = {};
    if (extra.trim()) {
      body.extraServices = extra
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    }
    if (urgency) body.urgency = urgency;
    if (dept) body.approvalByDepartment = dept;
    if (requiredBy) body.requiredByDate = requiredBy; // yyyy-MM-dd
    await approveCall(body);
  };

  const onApproveSkip = async () => {
    await approveCall({}); // send empty body – server will fill defaults
  };

  const onDecline = async (id: number) => {
    if (!confirm(`Decline DSR #${id}?`)) return;
    try {
      const res = await fetch(`${API_BASE}/driver-service-requests/${id}/hr-decline`, {
        method: 'PATCH',
      });
      const json = (await res.json()) as ApiResponse<any>;
      if (!res.ok || !json.ok) throw new Error(json.message || `HTTP ${res.status}`);
      toast.success(`Declined DSR #${id}`);
      setRefreshKey((k) => k + 1);
    } catch (e: any) {
      toast.error(`Decline failed: ${e.message || e}`);
    }
  };

  const statusBadge = (s: Dsr['hrApproval']) => {
    const map = {
      PENDING: 'bg-amber-100 text-amber-800',
      APPROVED: 'bg-emerald-100 text-emerald-800',
      REJECTED: 'bg-rose-100 text-rose-800',
    } as const;
    return (
      <span className={`px-2 py-1 rounded text-xs font-semibold ${map[s] || ''}`}>{s}</span>
    );
  };

  const canAct = (s: Dsr['hrApproval']) => s === 'PENDING';

  return (
    <div className="p-4 sm:p-6">
      <h1 className="text-xl font-bold mb-4 text-orange-900">Driver Service Requests — HR</h1>

      <div className="flex items-center justify-between mb-3">
        <div className="text-sm text-gray-600">
          Page {page + 1} / {Math.max(totalPages, 1)}
        </div>
        <div className="flex gap-2">
          <select
            className="border rounded px-2 py-1 text-sm"
            value={size}
            onChange={(e) => {
              setSize(parseInt(e.target.value, 10));
              setPage(0);
            }}
          >
            {[10, 15, 25, 50].map((n) => (
              <option key={n} value={n}>
                {n} / page
              </option>
            ))}
          </select>
          <button
            className="border rounded px-2 py-1 text-sm"
            disabled={page === 0}
            onClick={() => setPage((p) => Math.max(p - 1, 0))}
          >
            Prev
          </button>
          <button
            className="border rounded px-2 py-1 text-sm"
            disabled={page + 1 >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </button>
        </div>
      </div>

      <div className="overflow-x-auto border rounded-lg">
        <table className="min-w-full text-sm">
          <thead className="bg-orange-50 text-orange-900">
            <tr>
              <th className="text-left px-3 py-2">ID</th>
              <th className="text-left px-3 py-2">Vehicle</th>
              <th className="text-left px-3 py-2">Driver / EPF</th>
              <th className="text-left px-3 py-2">Request Date</th>
              <th className="text-left px-3 py-2">Services</th>
              <th className="text-left px-3 py-2">HR Status</th>
              <th className="text-left px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="px-3 py-6 text-center text-gray-500">
                  <Loader2 className="inline-block animate-spin mr-2" /> Loading…
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-3 py-6 text-center text-gray-500">
                  No driver service requests.
                </td>
              </tr>
            ) : (
              items.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="px-3 py-2">{r.id}</td>
                  <td className="px-3 py-2">
                    <div className="font-medium">{r.vehicleNumber}</div>
                    <div className="text-xs text-gray-500">Vehicle ID: {r.vehicleId}</div>
                  </td>
                  <td className="px-3 py-2">
                    <div className="font-medium">{r.driverName || '-'}</div>
                    <div className="text-xs text-gray-500">{r.epf}</div>
                  </td>
                  <td className="px-3 py-2">{r.requestDate}</td>
                  <td className="px-3 py-2">
                    {r.servicesNeeded && r.servicesNeeded.length > 0 ? (
                      <ul className="list-disc list-inside space-y-0.5">
                        {r.servicesNeeded.slice(0, 3).map((s, i) => (
                          <li key={i}>{s}</li>
                        ))}
                        {r.servicesNeeded.length > 3 && (
                          <li className="text-gray-500">+{r.servicesNeeded.length - 3} more</li>
                        )}
                      </ul>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2">{statusBadge(r.hrApproval)}</td>
                  <td className="px-3 py-2">
                    <div className="flex gap-2">
                      <button
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded bg-emerald-600 text-white text-xs hover:bg-emerald-700 disabled:opacity-50"
                        disabled={!canAct(r.hrApproval)}
                        onClick={() => onApproveClick(r)}
                        title="Approve"
                      >
                        <Check size={14} /> Approve
                      </button>
                      <button
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded bg-rose-600 text-white text-xs hover:bg-rose-700 disabled:opacity-50"
                        disabled={!canAct(r.hrApproval)}
                        onClick={() => onDecline(r.id)}
                        title="Decline"
                      >
                        <ThumbsDown size={14} /> Decline
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Approve Modal */}
      {showApprove && approveTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-2 sm:p-4">
          <div className="bg-white w-full max-w-2xl rounded-xl shadow-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b bg-orange-50">
              <div className="font-semibold text-orange-900">
                Approve DSR #{approveTarget.id} — {approveTarget.vehicleNumber}
              </div>
              <button
                onClick={() => setShowApprove(false)}
                className="p-2 rounded hover:bg-orange-100 text-orange-700"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={onApproveSubmit} className="p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Urgency */}
                <div>
                  <label className="block text-sm font-medium text-orange-800 mb-1">
                    Urgency (optional)
                  </label>
                  <select
                    className="w-full border rounded-lg px-3 py-2 text-sm text-black"
                    value={urgency}
                    onChange={(e) => setUrgency(e.target.value as any)}
                  >
                    <option value="">— Select —</option>
                    <option value="IMMEDIATE">Immediate</option>
                    <option value="NORMAL">Normal</option>
                  </select>
                </div>

                {/* Department */}
                <div>
                  <label className="block text-sm font-medium text-orange-800 mb-1">
                    Approval by Department (optional)
                  </label>
                  <select
                    className="w-full border rounded-lg px-3 py-2 text-sm text-black"
                    value={dept}
                    onChange={(e) => setDept(e.target.value as any)}
                  >
                    <option value="">— Select —</option>
                    <option value="WORK_MANAGER">Work Manager</option>
                    <option value="MAINSTORES">Mainstores</option>
                    <option value="NONE">None</option>
                  </select>
                </div>

                {/* Required By */}
                <div>
                  <label className="block text-sm font-medium text-orange-800 mb-1">
                    Required by date (optional)
                  </label>
                  <input
                    type="date"
                    className="w-full border rounded-lg px-3 py-2 text-sm text-black"
                    value={requiredBy}
                    onChange={(e) => setRequiredBy(e.target.value)}
                  />
                </div>

                {/* Extra services */}
                <div className="md:col-span-1">
                  <label className="block text-sm font-medium text-orange-800 mb-1">
                    Extra services (optional, comma-separated)
                  </label>
                  <input
                    className="w-full border rounded-lg px-3 py-2 text-sm text-black placeholder:text-gray-400"
                    placeholder="e.g., Wheel alignment, Battery check"
                    value={extra}
                    onChange={(e) => setExtra(e.target.value)}
                  />
                </div>
              </div>

              {/* Hint */}
              <p className="text-xs text-gray-500">
                You can leave everything blank and click &ldquo;Skip &amp; Approve&rdquo; to approve now and fill in details later.
              </p>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowApprove(false)}
                  className="px-3 py-2 text-sm rounded bg-gray-100 hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={onApproveSkip}
                  disabled={submitting}
                  className="px-3 py-2 text-sm rounded bg-emerald-100 text-emerald-800 hover:bg-emerald-200 disabled:opacity-60"
                  title="Approve with empty body {}"
                >
                  {submitting ? 'Approving…' : 'Skip & Approve'}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-3 py-2 text-sm rounded bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60"
                >
                  {submitting ? 'Saving…' : 'Approve with details'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
