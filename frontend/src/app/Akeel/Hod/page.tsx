'use client';

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import HODSidebar from './components/HODSidebar';
import {
  listByStatus,
  hodApprove,
  hodReject,
} from '../Transport/services/usageService';
import type { UsageRequest } from '../Transport/services/types';
import { Th, Td } from '../Transport/components/ThTd';
import { Search, Printer, Check, X as XIcon, Info } from 'lucide-react';

/* ---------- helpers ---------- */
const chip = (s: string) => (
  <span className="inline-block text-[10px] px-1.5 py-[2px] rounded bg-orange-100 text-orange-800 leading-none">
    {s}
  </span>
);
const fmtDT = (s?: string | null) => (s ? new Date(s).toLocaleString() : '-');

export default function HODDashboardPage() {
  const [pendingHOD, setPendingHOD] = useState<UsageRequest[]>([]);
  const [toMgmt, setToMgmt] = useState<UsageRequest[]>([]);
  const [rejected, setRejected] = useState<UsageRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const [tab, setTab] = useState<'PENDING_HOD' | 'PENDING_MANAGEMENT' | 'REJECTED'>('PENDING_HOD');
  const [q, setQ] = useState('');
  const [view, setView] = useState<UsageRequest | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [p, m, r] = await Promise.all([
        listByStatus('PENDING_HOD'),
        listByStatus('PENDING_MANAGEMENT'),
        listByStatus('REJECTED'),
      ]);
      setPendingHOD(p || []);
      setToMgmt(m || []);
      setRejected(r || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const cards = useMemo(
    () => [
      { label: 'Pending HOD', n: pendingHOD.length, hint: 'Awaiting your decision', key: 'PENDING_HOD' as const },
      { label: 'Sent to Management', n: toMgmt.length, hint: 'Approved by HOD', key: 'PENDING_MANAGEMENT' as const },
      { label: 'Rejected', n: rejected.length, hint: 'Rejected at any stage', key: 'REJECTED' as const },
    ],
    [pendingHOD, toMgmt, rejected]
  );

  const rows = tab === 'PENDING_HOD' ? pendingHOD : tab === 'PENDING_MANAGEMENT' ? toMgmt : rejected;

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter((r: any) =>
      [
        r.requestCode,
        r.status,
        r.applicantName,
        r.employeeId,
        r.officerName,
        r.officerId,
        r.fromLocation,
        r.toLocation,
        r.assignedVehicleNumber,
        r.assignedDriverName,
        r.department,
        r.dateOfTravel,
      ]
        .map((x) => (x ?? '').toString().toLowerCase())
        .join(' ')
        .includes(s)
    );
  }, [rows, q]);

  /* ---------- actions ---------- */
  const doApprove = async (r: UsageRequest) => {
    const remarks = prompt(`Approve ${r.requestCode} and forward to Management.\nRemarks:`, 'HOD approved');
    if (!remarks || !remarks.trim()) return;
    setLoading(true);
    try {
      await hodApprove(r.id, remarks.trim());
      await load();
    } finally {
      setLoading(false);
    }
  };

  const doReject = async (r: UsageRequest) => {
    const remarks = prompt(`Reject ${r.requestCode}.\nRemarks:`, '');
    if (!remarks || !remarks.trim()) return;
    setLoading(true);
    try {
      await hodReject(r.id, remarks.trim());
      await load();
    } finally {
      setLoading(false);
    }
  };

  /* ---------- print current list ---------- */
  const printCurrent = () => {
    const rowsHtml = filtered
      .map((r: any) => {
        const withOfficer = !!r.travelWithOfficer;
        return `
<tr>
  <td><div class="rq">${r.requestCode || ''}</div><div class="sub">${r.department || ''}</div></td>
  <td>
    <div><b>Applicant:</b> ${r.applicantName || ''} <span class="sub">(${r.employeeId || ''})</span></div>
    <div><b>Officer:</b> ${withOfficer ? `${r.officerName || '-'} <span class="sub">(${r.officerId || '-'})</span>` : '—'}</div>
  </td>
  <td>${r.fromLocation || ''} → ${r.toLocation || ''}</td>
  <td>${r.dateOfTravel || ''}<div class="sub mono">${r.timeFrom || ''} – ${r.timeTo || ''} ${r.overnight ? '(overnight)' : ''}</div></td>
  <td class="center">${r.status || ''}</td>
</tr>`;
      })
      .join('');
    const html = `<!doctype html><html><head><meta charset="utf-8"/>
<title>HOD Queue</title>
<style>
body{font-family:system-ui,Arial,sans-serif;margin:0;padding:12mm;color:#111}
h3{margin:0 0 8px 0}
.meta{color:#666;font-size:12px;margin-bottom:8px}
table{width:100%;border-collapse:collapse;table-layout:fixed}
thead{display:table-header-group}
tr,td,th{page-break-inside:avoid;break-inside:avoid}
th,td{border:1px solid #ddd;padding:6px 8px;vertical-align:top;font-size:12px}
th{background:#faf5f0;text-align:left}
.center{text-align:center}.sub{color:#666;font-size:11px}.mono{font-family:ui-monospace,Menlo,Consolas,monospace}.rq{font-weight:600;color:#8b4513}
@media print{@page{size:A4 landscape;margin:10mm}body{padding:0}}
</style></head>
<body>
<h3>HOD Queue — ${tab.replace('_', ' ')}</h3>
<div class="meta">Results: ${filtered.length}</div>
<table>
  <colgroup><col style="width:18%"/><col style="width:28%"/><col style="width:24%"/><col style="width:20%"/><col style="width:10%"/></colgroup>
  <thead><tr><th>Code / Dept</th><th>People</th><th>Route</th><th>Travel</th><th class="center">Status</th></tr></thead>
  <tbody>${rowsHtml || '<tr><td colspan="5">No data</td></tr>'}</tbody>
</table>
<script>window.addEventListener('load',()=>setTimeout(()=>{window.focus();window.print();},150));</script>
</body></html>`;
    try {
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const w = window.open(url, '_blank', 'noopener');
      if (w) {
        w.addEventListener?.('load', () => { try { w.focus(); w.print(); } catch {} });
        setTimeout(() => URL.revokeObjectURL(url), 60_000);
        return;
      }
    } catch {}
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed'; iframe.style.right = '0'; iframe.style.bottom = '0';
    iframe.style.width = '0'; iframe.style.height = '0'; iframe.style.border = '0';
    document.body.appendChild(iframe);
    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open(); doc.write(html); doc.close();
      iframe.onload = () => { iframe.contentWindow?.focus(); iframe.contentWindow?.print(); setTimeout(()=>document.body.removeChild(iframe), 1000); };
    }
  };

  return (
    <div className="flex min-h-screen bg-orange-50">
      <HODSidebar />
      <main className="p-3 md:p-4 flex-1">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-[14px] md:text-lg font-bold text-orange-900">HOD Dashboard</h1>
          <div className="flex items-center gap-2">
            {/* search */}
            <label className="relative">
              <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search code, people, route…"
                className="pl-6 pr-2 py-1 rounded border border-orange-200 text-[11px] h-7 w-[220px] focus:outline-none focus:ring-1 focus:ring-orange-300"
              />
            </label>
            {/* print */}
            <button
              type="button"
              onClick={printCurrent}
              className="inline-flex items-center gap-1 px-2.5 h-7 rounded bg-orange-600 text-white hover:bg-orange-700 text-[11px]"
              title="Print current list"
            >
              <Printer size={13} /> Print
            </button>
          </div>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
          {cards.map((c) => (
            <button
              key={c.label}
              onClick={() => setTab(c.key)}
              className={`rounded-lg border ${tab === c.key ? 'border-orange-300 ring-1 ring-orange-300' : 'border-orange-200'} bg-white p-4 text-left`}
            >
              <div className="text-sm text-orange-700">{c.label}</div>
              <div className="text-3xl font-bold text-orange-900">{loading ? '—' : c.n}</div>
              <div className="text-xs text-orange-600 mt-1">{c.hint}</div>
            </button>
          ))}
        </div>

        {/* Queue table */}
        <div className="bg-white rounded-lg border border-orange-200 overflow-auto">
          {/* compact, fixed layout */}
          <table className="w-full table-fixed text-[10px] leading-[1.15]">
            {/* keep colgroup in one line to avoid hydration whitespace warning */}
            <colgroup><col className="w-28"/><col className="w-56"/><col className="w-44"/><col className="w-36"/><col className="w-28"/></colgroup>
            <thead className="bg-orange-50">
              <tr className="text-[9.5px]">
                <Th className="px-2 py-1 text-left">Code / Dept</Th>
                <Th className="px-2 py-1 text-left">APPLICANT / OFFICER</Th>
                <Th className="px-2 py-1 text-left">Route</Th>
                <Th className="px-2 py-1 text-left">Travel</Th>
                <Th className="px-2 py-1 text-center">Status / Actions</Th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading && (
                <tr><Td colSpan={5} className="px-2 py-6 text-center text-gray-500">Loading…</Td></tr>
              )}

              {!loading && filtered.map((r: any) => {
                const withOfficer = !!r.travelWithOfficer;
                return (
                  <tr key={r.id} className="align-top hover:bg-orange-50/40">
                    <Td className="px-2 py-1">
                      <div className="font-semibold text-orange-900 truncate" title={r.requestCode}>{r.requestCode}</div>
                      <div className="text-[9px] text-gray-600 truncate" title={r.department || '-'}>{r.department || '-'}</div>
                    </Td>

                    <Td className="px-2 py-1">
                      <div className="truncate" title={`${r.applicantName} (${r.employeeId})`}>
                        <span className="font-medium text-orange-900">Applicant:</span> {r.applicantName}
                        <span className="text-gray-600 text-[9px]"> ({r.employeeId})</span>
                      </div>
                      <div className="text-[9.5px] text-gray-700 truncate"
                           title={withOfficer ? `${r.officerName || '-'} (${r.officerId || '-'})` : '—'}>
                        <span className="font-medium">Officer:</span>{' '}
                        {withOfficer ? (<>{r.officerName || '-'}<span className="text-gray-600 text-[9px]"> ({r.officerId || '-'})</span></>) : '—'}
                      </div>
                    </Td>

                    <Td className="px-2 py-1">
                      <div className="truncate" title={`${r.fromLocation} → ${r.toLocation}`}>
                        {r.fromLocation} → {r.toLocation}
                      </div>
                      <div className="text-[9px] text-gray-600 truncate" title={r.assignedVehicleNumber || '—'}>
                        {r.assignedVehicleNumber || '—'}
                      </div>
                    </Td>

                    <Td className="px-2 py-1">
                      <div className="truncate">{r.dateOfTravel}</div>
                      <div className="text-[9px] text-gray-600">
                        <span className="font-mono">{r.timeFrom}</span>–<span className="font-mono">{r.timeTo}</span>{' '}
                        {r.overnight ? '(overnight)' : ''}
                      </div>
                    </Td>

                    <Td className="px-2 py-1 text-center">
                      <div className="mb-1">{chip(r.status)}</div>
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          className="px-2 py-[3px] rounded bg-gray-200 text-gray-800 hover:bg-gray-300 text-[10px] inline-flex items-center gap-1"
                          onClick={() => setView(r)}
                          title="Details"
                        >
                          <Info size={12} /> View
                        </button>

                        {tab === 'PENDING_HOD' && (
                          <>
                            <button
                              type="button"
                              className="px-2 py-[3px] rounded bg-green-600 text-white hover:bg-green-700 text-[10px] inline-flex items-center gap-1"
                              onClick={() => doApprove(r)}
                              title="Approve & send to Management"
                            >
                              <Check size={12} /> Approve
                            </button>
                            <button
                              type="button"
                              className="px-2 py-[3px] rounded bg-red-600 text-white hover:bg-red-700 text-[10px] inline-flex items-center gap-1"
                              onClick={() => doReject(r)}
                              title="Reject"
                            >
                              <XIcon size={12} /> Reject
                            </button>
                          </>
                        )}
                      </div>
                    </Td>
                  </tr>
                );
              })}

              {!loading && !filtered.length && (
                <tr><Td colSpan={5} className="px-2 py-6 text-center text-gray-500">No results</Td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* details modal */}
        {view && <DetailsModal request={view} onClose={() => setView(null)} />}
      </main>
    </div>
  );
}

/* ---------- compact details modal ---------- */
function DetailsModal({ request, onClose }: { request: UsageRequest; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/40 grid place-items-center z-50 p-3" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-3 py-2 border-b bg-orange-50">
          <h3 className="font-bold text-orange-900 text-[12px]">Request • {request.requestCode}</h3>
          <button className="p-1 rounded hover:bg-orange-100" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className="p-4 text-[11px] leading-tight space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <section>
              <div className="text-orange-800 font-semibold mb-1">People</div>
              <div className="truncate">
                <span className="font-medium text-orange-900">Applicant:</span> {request.applicantName}
                <span className="text-gray-600 text-[10px]"> ({request.employeeId})</span>
              </div>
              <div className="truncate">
                <span className="font-medium">Officer:</span>{' '}
                {(request as any).travelWithOfficer
                  ? <>{(request as any).officerName || '-'} <span className="text-gray-600 text-[10px]">({(request as any).officerId || '-'})</span></>
                  : '—'}
              </div>
              <div className="text-gray-700"><span className="font-medium">Department:</span> {request.department}</div>
            </section>

            <section>
              <div className="text-orange-800 font-semibold mb-1">Status & Dates</div>
              <div><b>Status:</b> {request.status}</div>
              <div className="text-[10px] text-gray-600 mt-1">
                Created {fmtDT(request.createdAt)}{request.updatedAt ? ` • Updated ${fmtDT(request.updatedAt)}` : ''}
              </div>
            </section>

            <section>
              <div className="text-orange-800 font-semibold mb-1">Travel</div>
              <div><b>Date:</b> {request.dateOfTravel}</div>
              <div><b>Time:</b> {request.timeFrom} – {request.timeTo} {request.overnight ? '(overnight)' : ''}</div>
              <div className="mt-1"><b>Route:</b> {request.fromLocation} → {request.toLocation}</div>
            </section>

            <section>
              <div className="text-orange-800 font-semibold mb-1">Assignment</div>
              <div><b>Vehicle:</b> {request.assignedVehicleNumber || '-'}</div>
              <div><b>Driver:</b> {request.assignedDriverName || '-'}</div>
              <div><b>Pickup:</b> {fmtDT(request.scheduledPickupAt)}</div>
              <div><b>Return:</b> {fmtDT(request.scheduledReturnAt)}</div>
            </section>

            <section className="md:col-span-2">
              <div className="text-orange-800 font-semibold mb-1">Purpose / Goods</div>
              <div>{request.officialDescription || '—'}</div>
              <div className="text-gray-700">{request.goods || '—'}</div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
