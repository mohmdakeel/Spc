'use client';

import React, { useEffect, useMemo, useState } from 'react';
import InchargeSidebar from '../components/InchargeSidebar';
import { listByStatus } from '../../Transport/services/usageService';
import type { UsageRequest } from '../../Transport/services/types';
import { Th, Td } from '../../Transport/components/ThTd';
import SearchBar from '../../Transport/components/SearchBar';
import AssignVehicleModal from '../../Transport/components/AssignVehicleModal';
import { printUsageSlip } from '../../Transport/utils/print';
import { toast } from 'react-toastify';

/* ---------- helpers (kept consistent with other pages) ---------- */
const fmtDT = (s?: string | null) => (s ? new Date(s).toLocaleString() : '-');

const appliedLabel = (r: Partial<UsageRequest> | any) => {
  const d = r.appliedDate ?? r.applied_at ?? r.appliedOn;
  const t = r.appliedTime ?? r.applied_time;
  if (d && t) return `${d} ${t}`;
  if (d && r.createdAt) {
    const tt = new Date(r.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return `${d} ${tt}`;
  }
  if (r.createdAt) return fmtDT(r.createdAt);
  return '-';
};

const toLocalInput = (iso?: string | null) => {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export default function InchargeScheduledPage() {
  const [rows, setRows] = useState<UsageRequest[]>([]);
  const [q, setQ] = useState('');
  const [editFor, setEditFor] = useState<UsageRequest | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      setRows((await listByStatus('SCHEDULED')) || []);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter(r =>
      [
        r.requestCode, r.applicantName, r.employeeId, r.department,
        r.fromLocation, r.toLocation, r.assignedVehicleNumber, r.assignedDriverName,
        r.assignedDriverPhone, r.scheduledPickupAt, r.scheduledReturnAt, appliedLabel(r),
      ].map(x => (x ?? '').toString().toLowerCase()).join(' ').includes(s)
    );
  }, [rows, q]);

  return (
    <div className="flex min-h-screen bg-orange-50">
      <InchargeSidebar />
      <main className="p-3 md:p-4 flex-1">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-[14px] md:text-lg font-bold text-orange-900">Scheduled Assignments</h1>
          <SearchBar value={q} onChange={setQ} placeholder="Search code, applicant, vehicle, driver…" className="h-8" />
        </div>

        <div className="bg-white rounded-lg border border-orange-200 overflow-auto">
          {/* Keep colgroup in one line to avoid hydration whitespace warnings */}
          <table className="w-full table-fixed text-[10px] leading-[1.15]">
            <colgroup>
              <col className="w-40" />
              <col className="w-44" />
              <col className="w-48" />
              <col className="w-48" />
              <col className="w-[22rem]" />
              <col className="w-28" />
            </colgroup>

            <thead className="bg-orange-50">
              <tr className="text-[9.5px]">
                <Th className="px-2 py-1 text-left">RQ ID / Applied</Th>
                <Th className="px-2 py-1 text-left">Vehicle / Driver</Th>
                <Th className="px-2 py-1 text-left">Schedule</Th>
                <Th className="px-2 py-1 text-left">Route</Th>
                <Th className="px-2 py-1 text-left">Applicant / Dept</Th>
                <Th className="px-2 py-1 text-center">Actions</Th>
              </tr>
            </thead>

            <tbody className="divide-y">
              {loading && (
                <tr>
                  <Td colSpan={6} className="px-2 py-6 text-center text-gray-500">Loading…</Td>
                </tr>
              )}

              {!loading && filtered.map((r) => (
                <tr key={r.id} className="align-top hover:bg-orange-50/40">
                  {/* RQ / Applied */}
                  <Td className="px-2 py-1">
                    <div className="font-semibold text-orange-900 truncate" title={r.requestCode}>{r.requestCode}</div>
                    <div className="text-[9px] text-gray-600 truncate" title={appliedLabel(r)}>{appliedLabel(r)}</div>
                  </Td>

                  {/* Vehicle / Driver */}
                  <Td className="px-2 py-1">
                    <div className="font-medium truncate" title={r.assignedVehicleNumber || '—'}>
                      {r.assignedVehicleNumber || '—'}
                    </div>
                    <div className="text-[9px] text-gray-700 truncate" title={`${r.assignedDriverName || '—'} ${r.assignedDriverPhone ? `(${r.assignedDriverPhone})` : ''}`}>
                      {r.assignedDriverName || '—'} {r.assignedDriverPhone ? <span className="text-[9px] text-gray-600">({r.assignedDriverPhone})</span> : null}
                    </div>
                  </Td>

                  {/* Schedule */}
                  <Td className="px-2 py-1">
                    <div className="truncate" title={fmtDT(r.scheduledPickupAt)}>P: {fmtDT(r.scheduledPickupAt)}</div>
                    <div className="text-[9px] text-gray-600 truncate" title={fmtDT(r.scheduledReturnAt)}>R: {fmtDT(r.scheduledReturnAt)}</div>
                  </Td>

                  {/* Route */}
                  <Td className="px-2 py-1">
                    <div className="truncate" title={`${r.fromLocation} → ${r.toLocation}`}>
                      {r.fromLocation} → {r.toLocation}
                    </div>
                    <div className="text-[9px] text-gray-600">
                      <span className="font-mono">{r.dateOfTravel}</span>{' '}
                      <span className="font-mono">{r.timeFrom}</span>–<span className="font-mono">{r.timeTo}</span>{' '}
                      {r.overnight ? '(overnight)' : ''}
                    </div>
                  </Td>

                  {/* Applicant / Dept */}
                  <Td className="px-2 py-1">
                    <div className="truncate" title={`${r.applicantName} (${r.employeeId})`}>
                      <span className="font-medium text-orange-900">Applicant:</span> {r.applicantName}
                      <span className="text-[9px] text-gray-600"> ({r.employeeId})</span>
                    </div>
                    <div className="text-[9px] text-gray-700 truncate" title={r.department || '-'}>
                      <span className="font-medium">Dept:</span> {r.department || '-'}
                    </div>
                  </Td>

                  {/* Actions */}
                  <Td className="px-2 py-1 text-center">
                    <div className="inline-flex items-center gap-1">
                      <button
                        className="px-2.5 py-[6px] rounded bg-blue-600 text-white hover:bg-blue-700 text-[10px]"
                        onClick={() => { setEditFor(r); setOpen(true); }}
                        title="Edit assignment"
                      >
                        Edit
                      </button>
                      <button
                        className="px-2.5 py-[6px] rounded bg-green-600 text-white hover:bg-green-700 text-[10px]"
                        onClick={() => printUsageSlip(r)}
                        title="Print usage slip"
                      >
                        Print Slip
                      </button>
                    </div>
                  </Td>
                </tr>
              ))}

              {!loading && !filtered.length && (
                <tr>
                  <Td colSpan={6} className="px-2 py-6 text-center text-gray-500">No scheduled requests</Td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>

      {editFor && (
        <AssignVehicleModal
          open={open}
          onClose={() => { setOpen(false); setEditFor(null); }}
          requestId={editFor.id}
          defaultValues={{
            vehicleNumber: editFor.assignedVehicleNumber ?? '',
            driverName: editFor.assignedDriverName ?? '',
            driverPhone: editFor.assignedDriverPhone ?? '',
            pickupAt: toLocalInput(editFor.scheduledPickupAt),
            expectedReturnAt: toLocalInput(editFor.scheduledReturnAt),
          }}
          onAssigned={() => {
            toast.success('Assignment updated');
            setEditFor(null);
            setOpen(false);
            load();
          }}
        />
      )}
    </div>
  );
}
