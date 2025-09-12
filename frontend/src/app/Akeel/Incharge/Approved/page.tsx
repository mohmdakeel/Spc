'use client';

import React, { useEffect, useMemo, useState } from 'react';
import InchargeSidebar from '../components/InchargeSidebar';
import { listByStatus } from '../../Transport/services/usageService';
import type { UsageRequest } from '../../Transport/services/types';
import { Th, Td } from '../../Transport/components/ThTd';
import SearchBar from '../../Transport/components/SearchBar';
import AssignVehicleModal from '../../Transport/components/AssignVehicleModal';
import { toast } from 'react-toastify';

/* ---------------- helpers (same style as other pages) ---------------- */
const fmtDT = (s?: string | null) => (s ? new Date(s).toLocaleString() : '-');

/** Applied label: prefers appliedDate + appliedTime; falls back to createdAt time */
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

/** Officer from explicit fields OR parsed from "Travelling Officer:" text */
function extractOfficer(
  r?: Partial<UsageRequest> | null
): { withOfficer: boolean; name?: string; id?: string; phone?: string } {
  if (!r) return { withOfficer: false };
  if ((r as any).travelWithOfficer || (r as any).officerName || (r as any).officerId || (r as any).officerPhone) {
    return {
      withOfficer: true,
      name: (r as any).officerName || undefined,
      id: (r as any).officerId || undefined,
      phone: (r as any).officerPhone || undefined,
    };
  }
  const text = `${(r as any)?.officialDescription ?? ''}\n${(r as any)?.remarks ?? ''}`;
  const m =
    /Travelling Officer:\s*([^\(\n,]+)?(?:\s*\((?:Employee\s*ID|Emp\.?\s*ID|ID)\s*:\s*([^)]+)\))?(?:,\s*(?:Phone|Tel)\s*:\s*([^\s,]+))?/i.exec(
      text
    );
  if (m) return { withOfficer: true, name: m[1]?.trim(), id: m[2]?.trim(), phone: m[3]?.trim() };
  return { withOfficer: false };
}

/* ---------------- page ---------------- */
export default function InchargeApprovedPage() {
  const [rows, setRows] = useState<UsageRequest[]>([]);
  const [q, setQ] = useState('');
  const [assignFor, setAssignFor] = useState<UsageRequest | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      setRows((await listByStatus('APPROVED')) || []);
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
        r.fromLocation, r.toLocation, r.dateOfTravel, r.timeFrom, r.timeTo,
        r.officialDescription, r.goods, off.name, off.id, off.phone, appliedLabel(r),
      ]
        .map(x => (x ?? '').toString().toLowerCase())
        .join(' ')
        .includes(s);
    });
  }, [rows, q]);

  return (
    <div className="flex min-h-screen bg-orange-50">
      <InchargeSidebar />
      <main className="p-3 md:p-4 flex-1">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-[14px] md:text-lg font-bold text-orange-900">Approved (Awaiting Assignment)</h1>
          <SearchBar value={q} onChange={setQ} placeholder="Search code, applicant, dept, route…" className="h-8" />
        </div>

        <div className="bg-white rounded-lg border border-orange-200 overflow-auto">
          {/* Keep colgroup in one line to avoid hydration whitespace warnings */}
          <table className="w-full table-fixed text-[10px] leading-[1.15]">
            <colgroup><col className="w-40"/><col className="w-[22rem]"/><col className="w-40"/><col className="w-48"/><col className="w-[26rem]"/><col className="w-28"/></colgroup>
            <thead className="bg-orange-50">
              <tr className="text-[9.5px]">
                <Th className="px-2 py-1 text-left">RQ ID / Applied</Th>
                <Th className="px-2 py-1 text-left">APPLICANT / OFFICER</Th>
                <Th className="px-2 py-1 text-left">Travel</Th>
                <Th className="px-2 py-1 text-left">Route</Th>
                <Th className="px-2 py-1 text-left">Purpose</Th>
                <Th className="px-2 py-1 text-center">Assign</Th>
              </tr>
            </thead>

            <tbody className="divide-y">
              {loading && (
                <tr>
                  <Td colSpan={6} className="px-2 py-6 text-center text-gray-500">Loading…</Td>
                </tr>
              )}

              {!loading && filtered.map((r: any) => {
                const off = extractOfficer(r);
                return (
                  <tr key={r.id} className="align-top hover:bg-orange-50/40">
                    {/* RQ / Applied */}
                    <Td className="px-2 py-1">
                      <div className="font-semibold text-orange-900 truncate" title={r.requestCode}>{r.requestCode}</div>
                      <div className="text-[9px] text-gray-600 truncate" title={appliedLabel(r)}>{appliedLabel(r)}</div>
                    </Td>

                    {/* Applicant / Officer */}
                    <Td className="px-2 py-1">
                      <div className="truncate" title={`${r.applicantName} (${r.employeeId})`}>
                        <span className="font-medium text-orange-900">Applicant:</span> {r.applicantName}
                        <span className="text-gray-600 text-[9px]"> ({r.employeeId})</span>
                      </div>
                      <div
                        className="text-[9.5px] text-gray-700 truncate"
                        title={off.withOfficer ? `${off.name || '-'} (${off.id || '-'})${off.phone ? `, ${off.phone}` : ''}` : '—'}
                      >
                        <span className="font-medium">Officer:</span>{' '}
                        {off.withOfficer ? (
                          <>
                            {off.name || '-'}
                            <span className="text-gray-600 text-[9px]"> ({off.id || '-'})</span>
                            {off.phone ? <span className="text-gray-600 text-[9px]">, {off.phone}</span> : null}
                          </>
                        ) : '—'}
                      </div>
                    </Td>

                    {/* Travel */}
                    <Td className="px-2 py-1">
                      <div className="truncate" title={r.dateOfTravel}>{r.dateOfTravel}</div>
                      <div className="text-[9px] text-gray-600">
                        <span className="font-mono">{r.timeFrom}</span>–<span className="font-mono">{r.timeTo}</span>{' '}
                        {r.overnight ? '(overnight)' : ''}
                      </div>
                    </Td>

                    {/* Route */}
                    <Td className="px-2 py-1">
                      <div className="truncate" title={`${r.fromLocation} → ${r.toLocation}`}>{r.fromLocation} → {r.toLocation}</div>
                    </Td>

                    {/* Purpose */}
                    <Td className="px-2 py-1">
                      <div className="text-orange-900 truncate" title={r.officialDescription || '—'}>
                        {r.officialDescription || '—'}
                      </div>
                      {r.goods ? (
                        <div className="text-[9px] text-orange-700/80 truncate" title={r.goods}>{r.goods}</div>
                      ) : null}
                    </Td>

                    {/* Assign */}
                    <Td className="px-2 py-1 text-center">
                      <button
                        className="inline-flex items-center justify-center px-2.5 py-[6px] rounded bg-orange-600 text-white hover:bg-orange-700 text-[10px]"
                        onClick={() => { setAssignFor(r); setOpen(true); }}
                        title="Assign vehicle & driver"
                      >
                        Assign
                      </button>
                    </Td>
                  </tr>
                );
              })}

              {!loading && !filtered.length && (
                <tr>
                  <Td colSpan={6} className="px-2 py-6 text-center text-gray-500">No approved requests</Td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>

      {/* Assign modal */}
      {assignFor && (
        <AssignVehicleModal
          open={open}
          onClose={() => { setOpen(false); setAssignFor(null); }}
          requestId={assignFor.id}
          defaultValues={{
            vehicleNumber: '',
            driverName: '',
            driverPhone: '',
            // pickupAt / expectedReturnAt are selected in the modal
          }}
          onAssigned={() => {
            toast.success('Assignment saved');
            setAssignFor(null);
            setOpen(false);
            load();
          }}
        />
      )}
    </div>
  );
}
