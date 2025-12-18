'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { listByStatus } from '../../Transport/services/usageService';
import type { UsageRequest } from '../../Transport/services/types';
import { Th, Td } from '../../Transport/components/ThTd';
import SearchBar from '../components/SearchBar';
import AssignVehicleModal from '../../Transport/components/AssignVehicleModal';
import { printUsageSlip } from '../../Transport/utils/print';
import { toast } from 'react-toastify';
import { Pencil, Printer } from 'lucide-react';

/* ---------- helpers (matching other pages) ---------- */
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

// keep phone readable but safe
const cleanPhone = (p?: string) =>
  (p ?? '')
    .replace(/[^\d+()\-\s./;]/g, '')
    .replace(/^[;,\s-]+/, '')
    .replace(/\s{2,}/g, ' ')
    .trim();

/** Officer from explicit fields OR parsed from description */
function extractOfficer(r?: Partial<UsageRequest> | null): {
  withOfficer: boolean; name?: string; id?: string; phone?: string;
} {
  if (!r) return { withOfficer: false };
  if ((r as any).travelWithOfficer || (r as any).officerName || (r as any).officerId || (r as any).officerPhone) {
    return {
      withOfficer: true,
      name: (r as any).officerName || undefined,
      id: (r as any).officerId || undefined,
      phone: cleanPhone((r as any).officerPhone) || undefined,
    };
  }
  const text = `${(r as any)?.officialDescription ?? ''}\n${(r as any)?.remarks ?? ''}`;
  const m = /Travelling Officer:\s*([^\(\n,]+)?(?:\s*\((?:Employee\s*ID|Emp\.?\s*ID|ID)\s*:\s*([^)]+)\))?(?:,\s*(?:Phone|Tel)\s*:\s*([^\n]+))?/i.exec(text);
  if (m) return { withOfficer: true, name: m[1]?.trim(), id: m[2]?.trim(), phone: cleanPhone(m[3]) };
  return { withOfficer: false };
}

function purposeWithoutOfficer(r: any): string {
  const raw = String(r?.officialDescription ?? '');
  let cleaned = raw.split(/\r?\n/).filter(l => !/travell?ing\s+officer\s*:/i.test(l)).join('\n');
  cleaned = cleaned.replace(/\b(?:Phone|Tel)\s*:\s*[\+\d()\-\s./;]+/gi, '').trim();
  return cleaned || '—';
}

export default function InchargeScheduledPage() {
  const [rows, setRows] = useState<UsageRequest[]>([]);
  const [q, setQ] = useState('');
  const [editFor, setEditFor] = useState<UsageRequest | null>(null);
  const [open, setOpen] = useState(false);
  const [lockReason, setLockReason] = useState<string | null>(null);
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
    return rows.filter((r: any) => {
      const off = extractOfficer(r);
      return [
        r.requestCode, r.applicantName, r.employeeId, r.department,
        r.fromLocation, r.toLocation, r.assignedVehicleNumber, r.assignedDriverName,
        r.assignedDriverPhone, r.scheduledPickupAt, r.scheduledReturnAt, appliedLabel(r),
        off.name, off.id, off.phone, purposeWithoutOfficer(r), r.goods,
      ].map(x => (x ?? '').toString().toLowerCase()).join(' ').includes(s);
    });
  }, [rows, q]);

  const lockReasonFor = (r: UsageRequest): string | null => {
    const startIso = r.scheduledPickupAt || (r.dateOfTravel && r.timeFrom ? `${r.dateOfTravel}T${r.timeFrom}` : null);
    if (!startIso) return null;

    const start = new Date(startIso);
    if (Number.isNaN(start.getTime())) return null;

    const hoursUntilStart = (start.getTime() - Date.now()) / 36e5;
    if (hoursUntilStart < 24) {
      return 'Trip starts in <24 hours; edits are locked. Please notify the applicant for changes.';
    }
    return null;
  };

  // When opening the edit modal, keep the header search empty to avoid browser autofill noise
  useEffect(() => {
    if (open) {
      setQ('');
    }
  }, [open]);

  return (
    <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <h1 className="text-[14px] md:text-lg font-bold text-orange-900">Scheduled Assignments</h1>
          <SearchBar
            key={open ? 'modal-open' : 'modal-closed'}
            value={q}
            onChange={setQ}
            placeholder="Search code, applicant, vehicle, driver…"
            className="w-full sm:w-72"
            disabled={open}
          />
        </div>

        <div className="bg-white rounded-lg border border-orange-200">
          <div className="overflow-x-auto overflow-y-hidden 
                          [&::-webkit-scrollbar]:h-2 
                          [&::-webkit-scrollbar-thumb]:bg-orange-300 
                          [&::-webkit-scrollbar-track]:bg-transparent 
                          [scrollbar-width:thin]">
            <table className="min-w-full table-fixed text-[10px] leading-[1.15]">
              <colgroup>
                <col className="w-36" />
                <col className="w-36" />
                <col className="w-36" />
                <col className="w-36" />
                <col className="w-36" />
                <col className="w-36" />
                <col className="w-[18rem]" />
                <col className="w-28" />
              </colgroup>

              <thead className="bg-orange-50">
                <tr className="text-[9.5px]">
                  <Th className="px-2 py-1 text-left">RQ ID / Applied</Th>
                  <Th className="px-2 py-1 text-left">Applicant / Dept</Th>
                  <Th className="px-2 py-1 text-left">Vehicle / Driver</Th>
                  <Th className="px-2 py-1 text-left">Schedule</Th>
                  <Th className="px-2 py-1 text-left">Route</Th>
                  <Th className="px-2 py-1 text-left">Officer</Th>
                  <Th className="px-2 py-1 text-left">Purpose / Goods</Th>
                  <Th className="px-2 py-1 text-center">Actions</Th>
                </tr>
              </thead>

              <tbody className="divide-y">
                {loading && (
                  <tr>
                    <Td colSpan={8} className="px-2 py-6 text-center text-gray-500">Loading…</Td>
                  </tr>
                )}

                {!loading && filtered.map((r) => {
                  const off = extractOfficer(r as any);
                  return (
                    <tr key={r.id} className="align-top hover:bg-orange-50/40">
                      {/* RQ / Applied */}
                      <Td className="px-2 py-1">
                        <div className="font-semibold text-orange-900 truncate" title={r.requestCode}>{r.requestCode}</div>
                        <div className="text-[9px] text-gray-600 truncate" title={appliedLabel(r)}>{appliedLabel(r)}</div>
                      </Td>

                      {/* Applicant / Dept */}
                      <Td className="px-2 py-1">
                        <div className="truncate" title={`${r.applicantName} (${r.employeeId})`}>
                          <span className="font-medium text-orange-900">{r.applicantName}</span>
                          <span className="text-[9px] text-gray-600"> ({r.employeeId})</span>
                        </div>
                        <div className="text-[9px] text-gray-700 truncate">{r.department || '-'}</div>
                      </Td>

                      {/* Vehicle / Driver */}
                      <Td className="px-2 py-1">
                        <div className="font-medium truncate">{r.assignedVehicleNumber || '—'}</div>
                        <div className="text-[9px] text-gray-700 truncate">
                          {r.assignedDriverName || '—'} {r.assignedDriverPhone ? <span className="text-[9px] text-gray-600">({r.assignedDriverPhone})</span> : null}
                        </div>
                      </Td>

                      {/* Schedule */}
                      <Td className="px-2 py-1">
                        <div className="truncate">P: {fmtDT(r.scheduledPickupAt)}</div>
                        <div className="text-[9px] text-gray-600 truncate">R: {fmtDT(r.scheduledReturnAt)}</div>
                      </Td>

                      {/* Route */}
                      <Td className="px-2 py-1">
                        <div className="truncate">{r.fromLocation} → {r.toLocation}</div>
                        <div className="text-[9px] text-gray-600">
                          <span className="font-mono">{r.dateOfTravel}</span>{' '}
                          <span className="font-mono">{r.timeFrom}</span>–<span className="font-mono">{r.timeTo}</span>{' '}
                          {r.overnight ? '(overnight)' : ''}
                        </div>
                      </Td>

                      {/* Officer */}
                      <Td className="px-2 py-1">
                        {off.withOfficer ? (
                          <>
                            <div>{off.name || '—'}{off.id ? <span className="text-[9px] text-gray-600"> ({off.id})</span> : null}</div>
                            {off.phone ? <div className="text-[9px] text-gray-700">{off.phone}</div> : null}
                          </>
                        ) : '—'}
                      </Td>

                      {/* Purpose / Goods */}
                      <Td className="px-2 py-1">
                        <div className="text-orange-900 break-words">{purposeWithoutOfficer(r)}</div>
                        <div className="text-[9px] text-orange-700/80">{r.goods || '—'}</div>
                      </Td>

                      {/* Actions */}
                      <Td className="px-2 py-1 text-center">
                        <div className="inline-flex items-center gap-1">
                          <button
                            className="px-2.5 py-[6px] rounded bg-blue-600 text-white hover:bg-blue-700 text-[10px] flex items-center gap-1"
                            onClick={() => {
                              const reason = lockReasonFor(r);
                              if (reason) toast.warn(reason);
                              setLockReason(reason);
                              setEditFor(r);
                              setOpen(true);
                            }}
                            title="Edit assignment"
                          >
                            <Pencil size={12} /> Edit
                          </button>
                          <button
                            className="px-2.5 py-[6px] rounded bg-green-600 text-white hover:bg-green-700 text-[10px] flex items-center gap-1"
                            onClick={() => printUsageSlip(r)}
                            title="Print usage slip"
                          >
                            <Printer size={12} /> Slip
                          </button>
                        </div>
                      </Td>
                    </tr>
                  );
                })}

                {!loading && !filtered.length && (
                  <tr>
                    <Td colSpan={8} className="px-2 py-6 text-center text-gray-500">No scheduled requests</Td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      {editFor && (
        <AssignVehicleModal
          open={open}
          requestId={editFor.id}
          defaultValues={{
            vehicleNumber: editFor.assignedVehicleNumber ?? '',
            driverName: editFor.assignedDriverName ?? '',
            driverPhone: editFor.assignedDriverPhone ?? '',
            pickupAt: toLocalInput(editFor.scheduledPickupAt),
            expectedReturnAt: toLocalInput(editFor.scheduledReturnAt),
            instructions: (editFor as any).instructions || '',
          }}
          lockedReason={lockReason}
          onAssigned={() => {
            toast.success('Assignment updated');
            setEditFor(null);
            setOpen(false);
            load();
          }}
          onClose={() => { setOpen(false); setEditFor(null); setLockReason(null); }}
        />
      )}
    </div>
  );
}
