'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type { UsageRequest } from '../../Transport/services/types';
import { Th, Td } from '../../Transport/components/ThTd';
import HODSearchBar from '../components/HODSearchBar';
import { Printer, X } from 'lucide-react';

/* ---------- helpers (kept consistent across pages) ---------- */
const fmtDT = (s?: string | null) => (s ? new Date(s).toLocaleString() : '-');

const appliedLabel = (r?: Partial<UsageRequest> | null) => {
  if (!r) return '-';
  const d: any = (r as any).appliedDate ?? (r as any).applied_on ?? (r as any).appliedOn;
  const t: any = (r as any).appliedTime ?? (r as any).applied_time;
  if (d && t) return `${d} ${t}`;
  if (d && r.createdAt) {
    const tt = new Date(r.createdAt as any).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return `${d} ${tt}`;
  }
  if (r.createdAt) return fmtDT(r.createdAt);
  return '-';
};

/** Officer from explicit fields OR parsed from "Travelling Officer:" in description/remarks */
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

/** Remove embedded "Travelling Officer: ..." clause from Official Trip Description */
function purposeWithoutOfficer(r: any): string {
  const raw = (r?.officialDescription ?? '').toString();
  const cleaned = raw
    .replace(
      /\b(?:,\s*)?[-–—\s]*Travelling Officer:\s*([^\(\n,]+)?(?:\s*\((?:Employee\s*ID|Emp\.?\s*ID|ID)\s*:\s*[^)]+\))?(?:,\s*(?:Phone|Tel)\s*:\s*[^\s,]+)?/gi,
      ''
    )
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+,/g, ',')
    .replace(/^[\s\-–,:]+/, '')
    .trim();
  return cleaned || '—';
}

const chip = (s: string) => (
  <span className="inline-block text-[10px] px-1.5 py-[2px] rounded bg-green-100 text-green-800 leading-none">
    {s}
  </span>
);

/* ---- iframe-only print ---- */
function printHtmlViaIframe(html: string) {
  const iframe = document.createElement('iframe');
  Object.assign(iframe.style, { position: 'fixed', right: '0', bottom: '0', width: '0', height: '0', border: '0' });
  document.body.appendChild(iframe);
  const doc = iframe.contentWindow?.document;
  if (!doc) {
    document.body.removeChild(iframe);
    return;
  }
  doc.open();
  doc.write(html);
  doc.close();
  iframe.onload = () => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch {}
    setTimeout(() => {
      try {
        document.body.removeChild(iframe);
      } catch {}
    }, 1200);
  };
}

/* ---------- types ---------- */
type HistEntry = {
  id: number;
  requestCode: string;
  approvedAt: string;
  remarks?: string;
  snapshot: UsageRequest;
};

/* ======================= Page ======================= */
export default function HODMyApprovedPage() {
  const [items, setItems] = useState<HistEntry[]>([]);
  const [q, setQ] = useState('');
  const [view, setView] = useState<UsageRequest | null>(null);

  const load = useCallback(() => {
    if (typeof window === 'undefined') return;
    try {
      const arr = JSON.parse(localStorage.getItem('hodApprovedHistory') || '[]');
      setItems(Array.isArray(arr) ? arr : []);
    } catch {
      setItems([]);
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return items;
    return items.filter((e) => {
      const r: any = e.snapshot || {};
      const off = extractOfficer(r);
      return [
        e.requestCode,
        e.approvedAt,
        e.remarks,
        r.applicantName,
        r.employeeId,
        r.department,
        r.fromLocation,
        r.toLocation,
        r.dateOfTravel,
        r.timeFrom,
        r.timeTo,
        r.assignedVehicleNumber,
        r.assignedDriverName,
        r.scheduledPickupAt,
        r.scheduledReturnAt,
        r.gateExitAt,
        r.exitOdometer,
        r.gateEntryAt,
        r.entryOdometer,
        r.officialDescription,
        r.goods,
        off.name,
        off.id,
        off.phone,
        appliedLabel(r),
      ]
        .map((x) => (x ?? '').toString().toLowerCase())
        .join(' ')
        .includes(s);
    });
  }, [items, q]);

  /* ---------- print current list (same column set as other pages) ---------- */
  const printPage = useCallback(() => {
    const rowsHtml = filtered
      .map(({ snapshot: r, approvedAt }) => {
        const off = extractOfficer(r);
        return `
<tr>
  <td><div class="rq">${r.requestCode || ''}</div><div class="sub">${appliedLabel(r)}</div><div class="sub">Approved: ${fmtDT(
          approvedAt
        )}</div></td>
  <td>
    <div><b>Applicant:</b> ${r.applicantName || ''} <span class="sub">(${r.employeeId || ''})</span></div>
    <div><b>Officer:</b> ${
      off.withOfficer
        ? `${off.name || '-'} <span class="sub">(${off.id || '-'})</span>${off.phone ? `, ${off.phone}` : ''}`
        : '—'
    }</div>
  </td>
  <td class="center">Sent to Management</td>
  <td>
    <div>${r.dateOfTravel || ''}</div>
    <div class="sub mono">${r.timeFrom || ''} – ${r.timeTo || ''} ${r.overnight ? '(overnight)' : ''}</div>
  </td>
  <td>${r.fromLocation || ''} → ${r.toLocation || ''}</td>
  <td>
    <div>${r.assignedVehicleNumber || '—'}</div>
    <div class="sub">${r.assignedDriverName || '—'}</div>
  </td>
  <td>
    <div>P: ${fmtDT(r.scheduledPickupAt)}</div>
    <div class="sub">R: ${fmtDT(r.scheduledReturnAt)}</div>
  </td>
  <td>
    <div>Ex ${fmtDT(r.gateExitAt)} <span class="sub">O ${r.exitOdometer ?? '-'}</span></div>
    <div>En ${fmtDT(r.gateEntryAt)} <span class="sub">O ${r.entryOdometer ?? '-'}</span></div>
  </td>
</tr>`;
      })
      .join('');

    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/><title>My Approved (HOD) — Print</title>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<style>
:root{--fg:#111;--muted:#666;--head:#faf5f0}
*{box-sizing:border-box}html,body{width:100%;height:100%}
body{margin:0;padding:10mm;font-family:system-ui,Arial,sans-serif;color:var(--fg)}
h3{margin:0 0 8px 0}.meta{margin:4px 0 8px 0;font-size:11px;color:var(--muted)}
table{width:100%;border-collapse:collapse;table-layout:fixed}
thead{display:table-header-group}tr,td,th{page-break-inside:avoid;break-inside:avoid}
th,td{border:1px solid #ddd;padding:6px 8px;vertical-align:top;font-size:11px}
th{background:var(--head);text-align:left}.center{text-align:center}
.sub{color:var(--muted);font-size:10px}.mono{font-family:ui-monospace,Menlo,Consolas,monospace}
.rq{font-weight:600;color:#8b4513}
@media print{@page{size:A4 landscape;margin:8mm}body{padding:0}}
</style>
</head>
<body>
<h3>My Approved (HOD)</h3>
<div class="meta">Results: ${filtered.length}</div>
<table>
  <colgroup>
    <col style="width:12%"/><col style="width:18%"/><col style="width:8%"/><col style="width:12%"/>
    <col style="width:16%"/><col style="width:12%"/><col style="width:11%"/><col style="width:11%"/>
  </colgroup>
  <thead>
    <tr>
      <th>RQ ID / Applied / Approved</th>
      <th>Applicant / Officer</th>
      <th class="center">Status</th>
      <th>Date / Time</th>
      <th>Route</th>
      <th>Assigned</th>
      <th>Schedule</th>
      <th>Gate</th>
    </tr>
  </thead>
  <tbody>${rowsHtml || '<tr><td colspan="8">No data</td></tr>'}</tbody>
</table>
<script>addEventListener('load',()=>setTimeout(()=>{focus();print();},150));</script>
</body>
</html>`;
    printHtmlViaIframe(html);
  }, [filtered]);

  /* ---------- print one (same labels as other pages) ---------- */
  const printOne = useCallback((r: UsageRequest, approvedAt?: string) => {
    const off = extractOfficer(r);
    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/><title>${r.requestCode || 'Request'} — Print</title>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<style>
:root{--fg:#111;--muted:#666;--head:#faf5f0}
*{box-sizing:border-box}html,body{width:100%;height:100%}
body{margin:0;padding:12mm;font-family:system-ui,Arial,sans-serif;color:var(--fg)}
h2{margin:0 0 12px 0}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:8px 16px;font-size:12px}
.block{margin:8px 0 2px;font-weight:600;color:#8b4513}
.sub{color:var(--muted);font-size:11px}
table{width:100%;border-collapse:collapse;margin-top:10px}
th,td{border:1px solid #ddd;padding:6px 8px;font-size:12px;vertical-align:top}
th{background:#faf5f0;text-align:left;width:34%}
@media print{@page{size:A4 portrait;margin:10mm}body{padding:0}}
</style>
</head>
<body>
<h2>Transport Request • ${r.requestCode || ''}</h2>
<div class="grid">
  <div><div class="block">Applicant Name</div>${r.applicantName || ''} <span class="sub">(${r.employeeId || ''})</span></div>
  <div><div class="block">Status</div>Sent to Management</div>

  <div><div class="block">Department</div>${r.department || ''}</div>
  <div><div class="block">Applied</div>${appliedLabel(r)}</div>

  <div><div class="block">Approved</div>${fmtDT(approvedAt)}</div>
  <div><div class="block">Date of Travel</div>${r.dateOfTravel || ''}</div>

  <div><div class="block">From Location</div>${r.fromLocation || ''}</div>
  <div><div class="block">Time From</div>${r.timeFrom || ''}</div>

  <div><div class="block">To Location</div>${r.toLocation || ''}</div>
  <div><div class="block">Time To</div>${r.timeTo || ''} ${r.overnight ? '(overnight)' : ''}</div>

  <div><div class="block">Travelling with Officer</div>${off.withOfficer ? 'Yes' : 'No'}</div>
  <div><div class="block">Assigned Vehicle</div>${r.assignedVehicleNumber || '—'}</div>
</div>

<table>
  <tr><th>Official Trip Description</th><td>${purposeWithoutOfficer(r)}</td></tr>
  <tr><th>Goods being transported (if any)</th><td>${r.goods || '—'}</td></tr>
  <tr><th>Name of Travelling Officer</th><td>${off.withOfficer ? (off.name || '—') : '—'}</td></tr>
  <tr><th>Travelling Officer Employee ID</th><td>${off.withOfficer ? (off.id || '—') : '—'}</td></tr>
  <tr><th>Travelling Officer Phone</th><td>${off.withOfficer ? (off.phone || '—') : '—'}</td></tr>
  <tr><th>Driver</th><td>${r.assignedDriverName || '—'} ${r.assignedDriverPhone ? `(${r.assignedDriverPhone})` : ''}</td></tr>
  <tr><th>Pickup</th><td>${fmtDT(r.scheduledPickupAt)}</td></tr>
  <tr><th>Return</th><td>${fmtDT(r.scheduledReturnAt)}</td></tr>
  <tr><th>Gate Exit • Odometer</th><td>${fmtDT(r.gateExitAt)} • O ${r.exitOdometer ?? '-'}</td></tr>
  <tr><th>Gate Entry • Odometer</th><td>${fmtDT(r.gateEntryAt)} • O ${r.entryOdometer ?? '-'}</td></tr>
</table>

<script>addEventListener('load',()=>setTimeout(()=>{focus();print();},150));</script>
</body>
</html>`;
    printHtmlViaIframe(html);
  }, []);

  return (
    <>
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-[14px] md:text-lg font-bold text-orange-900">My Approved (History)</h1>
        <div className="flex items-center gap-2">
          <HODSearchBar value={q} onChange={setQ} placeholder="Search code, applicant, dept, route…" className="w-full md:w-72" />
          <button
            type="button"
            onClick={printPage}
            className="inline-flex items-center gap-1 px-2.5 h-8 rounded bg-orange-600 text-white hover:bg-orange-700 text-[12px]"
            title="Print current list"
          >
            <Printer size={14} /> Print Page
          </button>
          <button
            type="button"
            onClick={() => {
              if (!confirm('Clear local approval history for this browser?')) return;
              localStorage.removeItem('hodApprovedHistory');
              setItems([]);
            }}
            className="px-2.5 h-8 rounded border border-orange-300 text-[12px]"
            title="Clear local history"
          >
            Clear
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-orange-200 overflow-auto">
        {/* Column order mirrors other pages (9 columns) */}
        <table className="w-full table-fixed text-[10px] leading-[1.15]">
          <colgroup>
            <col className="w-28" />
            <col className="w-56" />
            <col className="w-20" />
            <col className="w-28" />
            <col className="w-40" />
            <col className="w-36" />
            <col className="w-36" />
            <col className="w-40" />
            <col className="w-16" />
          </colgroup>
          <thead className="bg-orange-50">
            <tr className="text-[9.5px]">
              <Th className="px-2 py-1 text-left">RQ ID / Applied / Approved</Th>
              <Th className="px-2 py-1 text-left">APPLICANT / OFFICER</Th>
              <Th className="px-2 py-1 text-center">Status</Th>
              <Th className="px-2 py-1 text-left">Travel</Th>
              <Th className="px-2 py-1 text-left">Route</Th>
              <Th className="px-2 py-1 text-left">Assigned</Th>
              <Th className="px-2 py-1 text-left">Schedule</Th>
              <Th className="px-2 py-1 text-left">Gate</Th>
              <Th className="px-2 py-1 text-center">Print</Th>
            </tr>
          </thead>

          <tbody className="divide-y">
            {!filtered.length && (
              <tr>
                <Td colSpan={9} className="px-2 py-6 text-center text-gray-500">
                  No local approval history yet.
                </Td>
              </tr>
            )}

            {filtered.map((e) => {
              const r = (e.snapshot as any) as UsageRequest;
              const off = extractOfficer(r);
              return (
                <tr
                  key={`${e.id}-${e.approvedAt}`}
                  className="align-top hover:bg-orange-50/40 cursor-pointer"
                  onClick={() => setView(r)}
                  title="Click to view details"
                >
                  {/* RQ / Applied / Approved */}
                  <Td className="px-2 py-1 whitespace-nowrap">
                    <div className="font-semibold text-orange-900 truncate" title={r.requestCode}>
                      {r.requestCode}
                    </div>
                    <div className="text-[9px] text-gray-600 truncate" title={appliedLabel(r)}>
                      {appliedLabel(r)}
                    </div>
                    <div className="text-[9px] text-gray-600 truncate" title={fmtDT(e.approvedAt)}>
                      Approved: {fmtDT(e.approvedAt)}
                    </div>
                  </Td>

                  {/* People */}
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
                      ) : (
                        '—'
                      )}
                    </div>
                  </Td>

                  {/* Status */}
                  <Td className="px-2 py-1 text-center">{chip('Sent to Management')}</Td>

                  {/* Travel */}
                  <Td className="px-2 py-1">
                    <div className="truncate">{r.dateOfTravel}</div>
                    <div className="text-[9px] text-gray-600">
                      <span className="font-mono">{r.timeFrom}</span>–<span className="font-mono">{r.timeTo}</span>{' '}
                      {r.overnight ? '(overnight)' : ''}
                    </div>
                  </Td>

                  {/* Route */}
                  <Td className="px-2 py-1">
                    <div className="truncate" title={`${r.fromLocation} → ${r.toLocation}`}>
                      {r.fromLocation} → {r.toLocation}
                    </div>
                  </Td>

                  {/* Assigned */}
                  <Td className="px-2 py-1 whitespace-nowrap">
                    <div className="font-medium truncate" title={r.assignedVehicleNumber || '—'}>
                      {r.assignedVehicleNumber || '—'}
                    </div>
                    <div className="text-[9px] text-gray-600 truncate" title={r.assignedDriverName || '—'}>
                      {r.assignedDriverName || '—'}
                    </div>
                  </Td>

                  {/* Schedule */}
                  <Td className="px-2 py-1 whitespace-nowrap">
                    <div className="truncate" title={fmtDT(r.scheduledPickupAt)}>
                      P: {fmtDT(r.scheduledPickupAt)}
                    </div>
                    <div className="text-[9px] text-gray-600 truncate" title={fmtDT(r.scheduledReturnAt)}>
                      R: {fmtDT(r.scheduledReturnAt)}
                    </div>
                  </Td>

                  {/* Gate */}
                  <Td className="px-2 py-1 whitespace-nowrap">
                    <div className="truncate" title={`Exit ${fmtDT(r.gateExitAt)} Odo ${r.exitOdometer ?? '-'}`}>
                      Ex {fmtDT(r.gateExitAt)} <span className="text-[9px] text-gray-600">O {r.exitOdometer ?? '-'}</span>
                    </div>
                    <div className="truncate" title={`Entry ${fmtDT(r.gateEntryAt)} Odo ${r.entryOdometer ?? '-'}`}>
                      En {fmtDT(r.gateEntryAt)} <span className="text-[9px] text-gray-600">O {r.entryOdometer ?? '-'}</span>
                    </div>
                  </Td>

                  {/* Print */}
                  <Td className="px-2 py-1 text-center">
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 px-2 py-[3px] rounded bg-orange-600 text-white hover:bg-orange-700 text-[10px]"
                      onClick={(ev) => {
                        ev.stopPropagation();
                        printOne(r, e.approvedAt);
                      }}
                      title="Print details"
                    >
                      <Printer size={12} /> Print
                    </button>
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* -------- row-click details modal -------- */}
      {view && <DetailsModal request={view} onClose={() => setView(null)} />}
    </>
  );
}

/* ================= Details Modal ================= */
function DetailsModal({ request, onClose }: { request: UsageRequest; onClose: () => void }) {
  const off = extractOfficer(request);
  const yn = (b?: boolean) => (b ? 'Yes' : 'No');

  return (
    <div className="fixed inset-0 bg-black/40 grid place-items-center z-50 p-4" onClick={onClose} role="dialog" aria-modal="true">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-2.5 border-b bg-orange-50">
          <h3 className="font-bold text-orange-900 text-[12px] md:text-[13px]">Request • {request.requestCode}</h3>
          <button className="p-1.5 rounded hover:bg-orange-100" onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>
        </div>

        <div className="p-4 text-[10.5px] leading-tight space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Applicant & Department */}
            <section>
              <div className="text-orange-800 font-semibold mb-1">Applicant & Department</div>
              <div className="truncate">
                <span className="font-medium text-orange-900">Applicant Name:</span> {request.applicantName}
                <span className="text-gray-600 text-[9px]"> ({request.employeeId})</span>
              </div>
              <div className="truncate">
                <span className="font-medium">Department:</span> {request.department || '—'}
              </div>
            </section>

            {/* Status & Dates */}
            <section>
              <div className="text-orange-800 font-semibold mb-1">Status & Dates</div>
              <div>
                <b>Status:</b> Sent to Management
              </div>
              <div>
                <b>Applied:</b> {appliedLabel(request)}
              </div>
              <div className="text-[9px] text-gray-600 mt-1">
                Created {fmtDT(request.createdAt)}
                {request.updatedAt ? ` • Updated ${fmtDT(request.updatedAt)}` : ''}
              </div>
            </section>

            {/* Date & Time */}
            <section>
              <div className="text-orange-800 font-semibold mb-1">Date & Time</div>
              <div>
                <b>Date of Travel:</b> {request.dateOfTravel}
              </div>
              <div>
                <b>Time From:</b> {request.timeFrom || '—'}
              </div>
              <div>
                <b>Time To:</b> {request.timeTo || '—'} {request.overnight ? '(overnight)' : ''}
              </div>
            </section>

            {/* Route */}
            <section>
              <div className="text-orange-800 font-semibold mb-1">Route</div>
              <div>
                <b>From Location:</b> {request.fromLocation}
              </div>
              <div>
                <b>To Location:</b> {request.toLocation}
              </div>
            </section>

            {/* Assignment */}
            <section>
              <div className="text-orange-800 font-semibold mb-1">Assignment</div>
              <div>
                <b>Vehicle:</b> {request.assignedVehicleNumber || '-'}
              </div>
              <div>
                <b>Driver:</b> {request.assignedDriverName || '-'} {request.assignedDriverPhone ? `(${request.assignedDriverPhone})` : ''}
              </div>
            </section>

            {/* Schedule */}
            <section>
              <div className="text-orange-800 font-semibold mb-1">Schedule</div>
              <div>
                <b>Pickup:</b> {fmtDT(request.scheduledPickupAt)}
              </div>
              <div>
                <b>Return:</b> {fmtDT(request.scheduledReturnAt)}
              </div>
            </section>

            {/* Official Trip Description / Officer / Goods */}
            <section className="md:col-span-2 border border-orange-100 rounded-lg p-3">
              <div className="text-orange-800 font-semibold mb-2">Official Trip Description / Goods</div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* LEFT: Description + Goods */}
                <div className="space-y-2">
                  <div>
                    <div className="text-gray-600">Official Trip Description</div>
                    <div className="text-orange-900 break-words">{purposeWithoutOfficer(request)}</div>
                  </div>
                  <div>
                    <div className="text-gray-600">Goods being transported (if any)</div>
                    <div className="text-orange-800/90 break-words">{request.goods || '—'}</div>
                  </div>
                </div>

                {/* RIGHT: Officer details */}
                <div className="space-y-2">
                  <div>
                    <div className="text-gray-600">Travelling with Officer</div>
                    <div>{yn((request as any).travelWithOfficer || off.withOfficer)}</div>
                  </div>
                  <div>
                    <div className="text-gray-600">Name of Travelling Officer</div>
                    <div className="break-words">{off.withOfficer ? off.name || '—' : '—'}</div>
                  </div>
                  <div>
                    <div className="text-gray-600">Travelling Officer Employee ID</div>
                    <div>{off.withOfficer ? off.id || '—' : '—'}</div>
                  </div>
                  <div>
                    <div className="text-gray-600">Travelling Officer Phone</div>
                    <div>{off.withOfficer ? off.phone || '—' : '—'}</div>
                  </div>
                </div>
              </div>
            </section>

            {/* Gate / Trip */}
            <section className="md:col-span-2">
              <div className="text-orange-800 font-semibold mb-1">Gate / Trip</div>
              <div>
                <b>Exit:</b> {fmtDT(request.gateExitAt)} • <span className="text-[9px] text-gray-600">O {request.exitOdometer ?? '-'}</span>
              </div>
              <div>
                <b>Entry:</b> {fmtDT(request.gateEntryAt)} • <span className="text-[9px] text-gray-600">O {request.entryOdometer ?? '-'}</span>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
