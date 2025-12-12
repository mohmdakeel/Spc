'use client';

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { listByStatus } from '../../Transport/services/usageService';
import type { UsageRequest } from '../../Transport/services/types';
import { Th, Td } from '../../Transport/components/ThTd';
import SearchBar from '../components/SearchBar';
import AssignVehicleModal from '../components/AssignVehicleModal';
import { X } from 'lucide-react';
import { toast } from 'react-toastify';

/* ---------------- helpers ---------------- */
const fmtDT = (s?: string | null) => (s ? new Date(s).toLocaleString() : '—');

const appliedLabel = (r: Partial<UsageRequest> | any) => {
  const d = r.appliedDate ?? r.applied_at ?? r.appliedOn;
  const t = r.appliedTime ?? r.applied_time;
  if (d && t) return `${d} ${t}`;
  if (d && r.createdAt) {
    const tt = new Date(r.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return `${d} ${tt}`;
  }
  if (r.createdAt) return fmtDT(r.createdAt);
  return '—';
};

const cleanPhone = (p?: string) =>
  (p ?? '')
    .replace(/[^\d+()\-\s./;]/g, '')
    .replace(/^[;,\s-]+/, '')
    .replace(/\s{2,}/g, ' ')
    .trim();

/** Extract Travelling Officer from explicit fields OR inside description/remarks */
function extractOfficer(r?: Partial<UsageRequest> | null): {
  withOfficer: boolean; name?: string; id?: string; phone?: string;
} {
  if (!r) return { withOfficer: false };

  // explicit fields present
  if ((r as any).travelWithOfficer || (r as any).officerName || (r as any).officerId || (r as any).officerPhone) {
    return {
      withOfficer: true,
      name: (r as any).officerName || undefined,
      id: (r as any).officerId || undefined,
      phone: cleanPhone((r as any).officerPhone) || undefined,
    };
  }

  // parse from free text (officialDescription / remarks)
  const text = `${(r as any)?.officialDescription ?? ''}\n${(r as any)?.remarks ?? ''}`;
  const m = /Travelling\s+Officer:\s*([^\(\n,]+)?(?:\s*\((?:Employee\s*ID|Emp\.?\s*ID|ID)\s*:\s*([^)]+)\))?(?:,\s*(?:Phone|Tel)\s*:\s*([^\n]+))?/i
    .exec(text);

  if (m) {
    return {
      withOfficer: true,
      name: m[1]?.trim() || undefined,
      id: m[2]?.trim() || undefined,
      phone: cleanPhone(m[3]) || undefined,
    };
  }

  return { withOfficer: false };
}

/** Purpose with any "Travelling Officer:" lines removed */
function purposeWithoutOfficer(r: any): string {
  const raw = `${String(r?.officialDescription ?? '')}\n${String(r?.remarks ?? '')}`.trim();
  if (!raw) return '—';
  let cleaned = raw
    .split(/\r?\n/)
    .filter(l => !/travell?ing\s+officer\s*:/i.test(l))
    .join('\n');
  cleaned = cleaned.replace(/\b(?:Phone|Tel)\s*:\s*[\+\d()\-\s./;]+/gi, '');
  return cleaned.trim() || '—';
}

const chipApproved = () => (
  <span className="inline-block text-[10px] px-1.5 py-[2px] rounded bg-green-100 text-green-800 leading-none">
    APPROVED
  </span>
);

const COLS = ['12%', '17%', '8%', '12%', '15%', '13%', '13%', '10%'] as const;

/* ---------------- Page ---------------- */
export default function InchargeApprovedPage() {
  const [rows, setRows] = useState<UsageRequest[]>([]);
  const [q, setQ] = useState('');
  const [assignFor, setAssignFor] = useState<UsageRequest | null>(null);
  const [openAssign, setOpenAssign] = useState(false);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<UsageRequest | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRows((await listByStatus('APPROVED')) || []);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter((r: any) => {
      const off = extractOfficer(r);
      return [
        r.requestCode, r.applicantName, r.employeeId, r.department,
        r.fromLocation, r.toLocation, r.dateOfTravel, r.timeFrom, r.timeTo,
        r.officialDescription, r.goods, off.name, off.id, off.phone, appliedLabel(r),
      ].map(x => (x ?? '').toString().toLowerCase()).join(' ').includes(s);
    });
  }, [rows, q]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-[14px] md:text-lg font-bold text-orange-900">Approved (Awaiting Assignment)</h1>
        <SearchBar
          value={q}
          onChange={setQ}
          placeholder="Search code, applicant, dept, route…"
          className="w-full sm:w-72"
        />
      </div>

      <div className="bg-white rounded-lg border border-orange-200 overflow-auto">
        <table className="w-full table-fixed text-[10.5px] leading-[1.15]">
          <colgroup>{COLS.map((w, i) => <col key={i} style={{ width: w }} />)}</colgroup>
          <thead className="bg-orange-50">
            <tr className="text-[9.5px]">
              <Th className="px-2 py-1 text-left">RQ ID / Applied</Th>
              <Th className="px-2 py-1 text-left">Applicant / Dept</Th>
              <Th className="px-2 py-1 text-center">Status</Th>
              <Th className="px-2 py-1 text-left">Travel</Th>
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

            {!loading && filtered.map((r: any) => {
              const off = extractOfficer(r);
              return (
                <tr
                  key={r.id}
                  className="align-top hover:bg-orange-50/40 cursor-pointer"
                  onClick={() => setView(r)}
                >
                  <Td className="px-2 py-1">
                    <div className="font-semibold text-orange-900 truncate">{r.requestCode}</div>
                    <div className="text-[9px] text-gray-600 truncate">{appliedLabel(r)}</div>
                  </Td>
                  <Td className="px-2 py-1">
                    <div className="truncate">
                      <span className="font-medium text-orange-900">{r.applicantName}</span>
                      <span className="text-gray-600 text-[9px]"> ({r.employeeId})</span>
                    </div>
                    <div className="text-[9px] text-gray-700 truncate">{r.department || '—'}</div>
                  </Td>
                  <Td className="px-2 py-1 text-center">{chipApproved()}</Td>
                  <Td className="px-2 py-1">
                    <div>{r.dateOfTravel}</div>
                    <div className="text-[9px] text-gray-600">{r.timeFrom} – {r.timeTo}</div>
                  </Td>
                  <Td className="px-2 py-1">{r.fromLocation} → {r.toLocation}</Td>
                  <Td className="px-2 py-1">
                    {off.withOfficer ? (
                      <>
                        <div>{off.name || '—'}{off.id ? <span className="text-[9px] text-gray-600"> ({off.id})</span> : null}</div>
                        {off.phone ? <div className="text-[9px] text-gray-700">{off.phone}</div> : null}
                      </>
                    ) : '—'}
                  </Td>
                  <Td className="px-2 py-1">
                    <div className="text-orange-900 whitespace-pre-wrap break-words">{purposeWithoutOfficer(r)}</div>
                    <div className="text-[9px] text-orange-700/80">{r.goods || '—'}</div>
                  </Td>
                  <Td className="px-2 py-1 text-center" onClick={e => e.stopPropagation()}>
                    <button
                      className="px-2.5 py-[6px] rounded bg-orange-600 text-white text-[10px]"
                      onClick={() => { setAssignFor(r); setOpenAssign(true); }}
                    >
                      Assign
                    </button>
                  </Td>
                </tr>
              );
            })}

            {!loading && !filtered.length && (
              <tr>
                <Td colSpan={8} className="px-2 py-6 text-center text-gray-500">No approved requests</Td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Details modal → just view */}
      {view && (
        <DetailsModal request={view} onClose={() => setView(null)} />
      )}

      {/* Assign modal */}
      {assignFor && (
        <AssignVehicleModal
          open={openAssign}
          onClose={() => { setOpenAssign(false); setAssignFor(null); }}
          requestId={assignFor.id}
          request={assignFor}
          defaultValues={{ vehicleNumber: '', driverName: '', driverPhone: '' }}
          onAssigned={() => {
            toast.success('Assignment saved');
            setAssignFor(null);
            setOpenAssign(false);
            load();
          }}
        />
      )}
    </div>
  );
}

/* ---------------- Details Modal ---------------- */
function DetailsModal({ request, onClose }: { request: UsageRequest; onClose: () => void }) {
  const off = extractOfficer(request as any);
  return (
    <div className="fixed inset-0 bg-black/40 grid place-items-center z-50 p-3" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-2 border-b bg-orange-50">
          <h3 className="font-bold text-orange-900 text-[13px]">Request • {request.requestCode}</h3>
          <button className="p-1 rounded hover:bg-orange-100" onClick={onClose}><X size={16} /></button>
        </div>

        <div className="p-4 text-[12px] leading-tight space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <section>
              <div className="font-semibold text-orange-800 mb-1">Applicant / Dept</div>
              <div>{request.applicantName} ({request.employeeId})</div>
              <div>{request.department || '—'}</div>
            </section>
            <section>
              <div className="font-semibold text-orange-800 mb-1">Status & Applied</div>
              <div><b>Status:</b> APPROVED</div>
              <div><b>Applied:</b> {appliedLabel(request)}</div>
            </section>
            <section>
              <div className="font-semibold text-orange-800 mb-1">Travel / Route</div>
              <div>{request.dateOfTravel}</div>
              <div>{request.timeFrom} – {request.timeTo}</div>
              <div>{request.fromLocation} → {request.toLocation}</div>
            </section>
            <section>
              <div className="font-semibold text-orange-800 mb-1">Officer</div>
              {off.withOfficer ? (
                <div>{off.name || '—'}{off.id ? ` (${off.id})` : ''}{off.phone ? `, ${off.phone}` : ''}</div>
              ) : '—'}
            </section>
            <section className="md:col-span-2">
              <div className="font-semibold text-orange-800 mb-1">Purpose / Goods</div>
              <div className="whitespace-pre-wrap break-words">{purposeWithoutOfficer(request)}</div>
              <div>{request.goods || '—'}</div>
            </section>
          </div>
        </div>

        <div className="px-4 py-2 border-t bg-orange-50 flex justify-end">
          <button className="px-4 py-2 rounded border" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
