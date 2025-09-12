'use client';

import * as React from 'react';
import ApplicantSidebar from './components/ApplicantSidebar';
import { listMyRequests } from '../Transport/services/usageService';
import type { UsageRequest } from '../Transport/services/types';
import { Th, Td } from '../Transport/components/ThTd';

/* ---------- helpers ---------- */
const chip = (s: string) => (
  <span className="inline-block text-[10px] px-1.5 py-[2px] rounded bg-orange-100 text-orange-800 leading-none">
    {s}
  </span>
);
const fmtDT = (s?: string | null) => (s ? new Date(s).toLocaleString() : '-');

/** Prefer appliedDate+appliedTime, fallback to createdAt */
const appliedLabel = (r: any) => {
  const d = r?.appliedDate || r?.applied_on || r?.appliedOn;
  const t = r?.appliedTime || r?.applied_time;
  if (d && t) return `${d} ${t}`;
  if (d && r?.createdAt) {
    const tt = new Date(r.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return `${d} ${tt}`;
  }
  if (r?.createdAt) return fmtDT(r.createdAt);
  return '-';
};

/** Extract officer info from explicit fields OR parse "Travelling Officer:" from description/remarks */
function extractOfficer(r?: Partial<UsageRequest> | null): {
  withOfficer: boolean;
  name?: string;
  id?: string;
  phone?: string;
} {
  if (!r) return { withOfficer: false };

  if ((r as any).travelWithOfficer || (r as any).officerName || (r as any).officerId || (r as any).officerPhone) {
    return {
      withOfficer: !!((r as any).travelWithOfficer || (r as any).officerName || (r as any).officerId || (r as any).officerPhone),
      name: (r as any).officerName || undefined,
      id: (r as any).officerId || undefined,
      phone: (r as any).officerPhone || undefined,
    };
  }

  const text = `${(r as any)?.officialDescription ?? ''}\n${(r as any)?.remarks ?? ''}`;
  const m = /Travelling Officer:\s*([^\(\n,]+)?(?:\s*\(Employee ID:\s*([^)]+)\))?(?:,\s*Phone:\s*([^\s,]+))?/i.exec(text);
  if (m) return { withOfficer: true, name: m[1]?.trim(), id: m[2]?.trim(), phone: m[3]?.trim() };

  return { withOfficer: false };
}

/** Stable key even if id is missing */
const rowKey = (r: Partial<UsageRequest> | undefined, i: number) =>
  String(
    (r as any)?.id ??
      (r as any)?.requestCode ??
      `${(r as any)?.employeeId ?? 'row'}|${(r as any)?.dateOfTravel ?? ''}|${(r as any)?.createdAt ?? ''}|${i}`
  );

export default function ClientDashboard() {
  const [items, setItems] = React.useState<UsageRequest[]>([]);
  const [employeeId, setEmployeeId] = React.useState('');
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const id = localStorage.getItem('employeeId') || localStorage.getItem('actor') || '';
    setEmployeeId(id);

    if (!id) {
      setItems([]);
      setLoading(false);
      return;
    }

    // Load ALL pages so counts & recent table cover full history
    (async () => {
      setLoading(true);
      let all: UsageRequest[] = [];
      let page = 0;
      let totalPages = 1;
      try {
        while (page < totalPages) {
          const p = await listMyRequests(id, page, 100);
          all = all.concat(p?.content || []);
          totalPages = (p?.totalPages as number) ?? 1;
          page = ((p?.number as number) ?? page) + 1;
        }
        // newest first
        all.sort((a: any, b: any) => {
          const ta = a?.createdAt ? Date.parse(a.createdAt) : 0;
          const tb = b?.createdAt ? Date.parse(b.createdAt) : 0;
          return tb - ta;
        });
      } finally {
        setItems(all);
        setLoading(false);
      }
    })();
  }, []);

  const count = React.useCallback((s: string) => items.filter((r) => r.status === s).length, [items]);

  const recent = React.useMemo(() => items.slice(0, 10), [items]);

  return (
    <div className="flex min-h-screen bg-orange-50">
      <ApplicantSidebar />
      <main className="p-3 md:p-4 flex-1">
        <h1 className="text-[14px] md:text-lg font-bold text-orange-900 mb-3 md:mb-4">Dashboard</h1>

        {!employeeId ? (
          <div className="text-[12px] text-yellow-800 bg-yellow-50 border border-yellow-200 rounded px-3 py-2 mb-3">
            Submit a request first — your Employee ID will be remembered and your dashboard will populate.
          </div>
        ) : loading ? (
          <div className="text-sm text-gray-500 mb-3">Loading…</div>
        ) : null}

        {/* compact KPI cards */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-2 md:gap-3 mb-3">
          {([
            ['Pending HOD', 'PENDING_HOD'],
            ['Pending Mgmt', 'PENDING_MANAGEMENT'],
            ['Approved', 'APPROVED'],
            ['Scheduled', 'SCHEDULED'],
            ['Dispatched', 'DISPATCHED'],
            ['Returned', 'RETURNED'],
          ] as const).map(([label, key]) => (
            <div key={key} className="bg-white border border-orange-200 rounded-lg px-3 py-2">
              <div className="text-[11px] text-orange-700 truncate">{label}</div>
              <div className="text-2xl md:text-3xl font-bold text-orange-900">{count(key)}</div>
            </div>
          ))}
        </div>

        {/* recent table (ultra-compact) */}
        <div className="bg-white rounded-lg border border-orange-200 overflow-auto">
          <table className="w-full table-fixed text-[10px] leading-[1.15]">
            {/* keep on one line to avoid whitespace text nodes in colgroup */}
            <colgroup><col className="w-28"/><col className="w-52"/><col className="w-40"/><col className="w-36"/><col className="w-20"/></colgroup>
            <thead className="bg-orange-50">
              <tr className="text-[9.5px]">
                <Th className="px-2 py-1 text-left">Code</Th>
                <Th className="px-2 py-1 text-left">APPLICANT / OFFICER</Th>
                <Th className="px-2 py-1 text-left">Route</Th>
                <Th className="px-2 py-1 text-left">Travel</Th>
                <Th className="px-2 py-1 text-center">Status</Th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading && (
                <tr>
                  <Td colSpan={5} className="px-2 py-6 text-center text-gray-500">Loading…</Td>
                </tr>
              )}

              {!loading && recent.map((r: any, i: number) => {
                const off = extractOfficer(r);
                return (
                  <tr key={rowKey(r, i)} className="align-top hover:bg-orange-50/40">
                    <Td className="px-2 py-1">
                      <div className="font-semibold text-orange-900 truncate" title={r?.requestCode || ''}>
                        {r?.requestCode || '—'}
                      </div>
                      <div className="text-[9px] text-gray-600 truncate" title={appliedLabel(r)}>
                        {appliedLabel(r)}
                      </div>
                    </Td>

                    <Td className="px-2 py-1">
                      <div className="truncate" title={`${r?.applicantName || ''} (${r?.employeeId || ''})`}>
                        <span className="font-medium text-orange-900">Applicant:</span> {r?.applicantName || '—'}
                        <span className="text-gray-600 text-[9px]"> ({r?.employeeId || '—'})</span>
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
                        ) : (
                          '—'
                        )}
                      </div>
                    </Td>

                    <Td className="px-2 py-1">
                      <div className="truncate" title={`${r?.fromLocation || ''} → ${r?.toLocation || ''}`}>
                        {(r?.fromLocation || '—')} → {(r?.toLocation || '—')}
                      </div>
                      <div className="text-[9px] text-gray-600 truncate" title={r?.assignedVehicleNumber || '—'}>
                        {r?.assignedVehicleNumber || '—'}
                      </div>
                    </Td>

                    <Td className="px-2 py-1">
                      <div className="truncate">{r?.dateOfTravel || '—'}</div>
                      <div className="text-[9px] text-gray-600">
                        <span className="font-mono">{r?.timeFrom || '—'}</span>–<span className="font-mono">{r?.timeTo || '—'}</span>{' '}
                        {r?.overnight ? '(overnight)' : ''}
                      </div>
                    </Td>

                    <Td className="px-2 py-1 text-center">{chip(r?.status || '—')}</Td>
                  </tr>
                );
              })}

              {!loading && !recent.length && (
                <tr>
                  <Td colSpan={5} className="px-2 py-6 text-center text-gray-500">No recent requests</Td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
