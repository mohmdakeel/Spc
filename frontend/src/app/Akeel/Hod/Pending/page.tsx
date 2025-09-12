'use client';

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import HODSidebar from '../components/HODSidebar';
import { listByStatus, hodApprove, hodReject } from '../../Transport/services/usageService';
import type { UsageRequest } from '../../Transport/services/types';
import { Th, Td } from '../../Transport/components/ThTd';
import SearchBar from '../../Transport/components/SearchBar';
import ReviewModal from '../components/ReviewModal';
import { toast } from 'react-toastify';
import { Printer } from 'lucide-react';

/* ---------------- helpers ---------------- */
const fmtDT = (s?: string | null) => (s ? new Date(s).toLocaleString() : '-');
const chip = (s: string) => (
  <span className="inline-block text-[10px] px-1.5 py-[2px] rounded bg-orange-100 text-orange-800 leading-none">
    {s}
  </span>
);

/** Applied label: prefers appliedDate + appliedTime; falls back to createdAt */
const appliedLabel = (r: any) => {
  const d = r.appliedDate || r.applied_at || r.appliedOn;
  const t = r.appliedTime || r.applied_time;
  if (d && t) return `${d} ${t}`;
  if (d && r.createdAt) {
    const tt = new Date(r.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return `${d} ${tt}`;
  }
  if (r.createdAt) return fmtDT(r.createdAt);
  return '-';
};

/** Officer from explicit fields OR parsed from "Travelling Officer:" in description/remarks */
function extractOfficer(r: any): { withOfficer: boolean; name?: string; id?: string; phone?: string } {
  if (r?.travelWithOfficer || r?.officerName || r?.officerId || r?.officerPhone) {
    return {
      withOfficer: !!(r.travelWithOfficer || r.officerName || r.officerId || r.officerPhone),
      name: r.officerName || undefined,
      id: r.officerId || undefined,
      phone: r.officerPhone || undefined,
    };
  }
  const text = `${r?.officialDescription || ''}\n${r?.remarks || ''}`;
  const m = /Travelling Officer:\s*([^\(\n,]+)?(?:\s*\(Employee ID:\s*([^)]+)\))?(?:,\s*Phone:\s*([^\s,]+))?/i.exec(text);
  if (m) return { withOfficer: true, name: m[1]?.trim(), id: m[2]?.trim(), phone: m[3]?.trim() };
  return { withOfficer: false };
}

/** Save a local history entry of HOD approvals (per-browser/device) */
function saveMyApproval(req: UsageRequest, remarks?: string) {
  if (typeof window === 'undefined') return;
  try {
    const key = 'hodApprovedHistory';
    const curr = JSON.parse(localStorage.getItem(key) || '[]');
    const now = new Date().toISOString();
    const next = [
      { id: req.id, requestCode: req.requestCode, approvedAt: now, remarks: remarks || '', snapshot: req },
      ...curr.filter((x: any) => x?.id !== req.id),
    ].slice(0, 300);
    localStorage.setItem(key, JSON.stringify(next));
  } catch {}
}

/* ---- iframe-only print ---- */
function printHtmlViaIframe(html: string) {
  const iframe = document.createElement('iframe');
  Object.assign(iframe.style, { position: 'fixed', right: '0', bottom: '0', width: '0', height: '0', border: '0' });
  document.body.appendChild(iframe);
  const doc = iframe.contentWindow?.document;
  if (!doc) { document.body.removeChild(iframe); return; }
  doc.open(); doc.write(html); doc.close();
  iframe.onload = () => {
    try { iframe.contentWindow?.focus(); iframe.contentWindow?.print(); } catch {}
    setTimeout(() => { try { document.body.removeChild(iframe); } catch {} }, 1200);
  };
}

export default function HODPendingPage() {
  const [rows, setRows] = useState<UsageRequest[]>([]);
  const [q, setQ] = useState('');
  const [selected, setSelected] = useState<UsageRequest | null>(null);  // review modal
  const [details, setDetails] = useState<UsageRequest | null>(null);    // details modal
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await listByStatus('PENDING_HOD');
      setRows(list || []);
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
        r.requestCode, r.status, r.applicantName, r.employeeId, r.department,
        r.fromLocation, r.toLocation, r.dateOfTravel, r.timeFrom, r.timeTo,
        r.assignedVehicleNumber, r.assignedDriverName,
        r.scheduledPickupAt, r.scheduledReturnAt,
        r.gateExitAt, r.exitOdometer, r.gateEntryAt, r.entryOdometer,
        r.officialDescription, r.goods, off.name, off.id, off.phone
      ].map(x => (x ?? '').toString().toLowerCase()).join(' ').includes(s);
    });
  }, [rows, q]);

  const actApprove = async (remarks?: string) => {
    if (!selected) return;
    try {
      await hodApprove(selected.id, remarks);
      saveMyApproval(selected, remarks);
      toast?.success?.('Approved & sent to Management');
      setSelected(null);
      load();
    } catch (e: any) {
      toast?.error?.(e?.message || 'Failed to approve');
    }
  };
  const actReject = async (remarks?: string) => {
    if (!selected) return;
    try {
      await hodReject(selected.id, remarks);
      toast?.success?.('Request rejected');
      setSelected(null);
      load();
    } catch (e: any) {
      toast?.error?.(e?.message || 'Failed to reject');
    }
  };

  /* ---------- PRINT: page & row ---------- */
  const printPage = useCallback(() => {
    const rowsHtml = filtered.map((r: any) => {
      const off = extractOfficer(r);
      return `
<tr>
  <td><div class="rq">${r.requestCode || ''}</div><div class="sub">${appliedLabel(r)}</div></td>
  <td>
    <div><b>Applicant:</b> ${r.applicantName || ''} <span class="sub">(${r.employeeId || ''})</span></div>
    <div><b>Officer:</b> ${off.withOfficer ? `${off.name || '-'} <span class="sub">(${off.id || '-'})</span>${off.phone ? `, ${off.phone}` : ''}` : '—'}</div>
  </td>
  <td class="center">${r.status || ''}</td>
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
    }).join('');

    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"/><title>Pending HOD — Print</title>
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
@media print{@page{size:A4 landscape;margin:10mm}body{padding:0}}
</style></head>
<body>
<h3>Pending Approvals — HOD</h3>
<div class="meta">Results: ${filtered.length}</div>
<table>
  <colgroup>
    <col style="width:12%"/><col style="width:18%"/><col style="width:8%"/><col style="width:12%"/>
    <col style="width:16%"/><col style="width:12%"/><col style="width:11%"/><col style="width:11%"/>
  </colgroup>
  <thead>
    <tr>
      <th>RQ ID / Applied</th>
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
</body></html>`;
    printHtmlViaIframe(html);
  }, [filtered]);

  const printOne = useCallback((r: any) => {
    const off = extractOfficer(r);
    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"/><title>${r.requestCode || 'Request'} — Print</title>
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
th{background:var(--head);text-align:left;width:32%}
@media print{@page{size:A4 portrait;margin:10mm}body{padding:0}}
</style></head>
<body>
<h2>Transport Request • ${r.requestCode || ''}</h2>
<div class="grid">
  <div><div class="block">Applicant</div>${r.applicantName || ''} <span class="sub">(${r.employeeId || ''})</span></div>
  <div><div class="block">Status</div>${r.status || ''}</div>
  <div><div class="block">Travelling Officer</div>${off.withOfficer ? `${off.name || '-'} <span class="sub">(${off.id || '-'})</span>${off.phone ? `, ${off.phone}` : ''}` : '—'}</div>
  <div><div class="block">Department</div>${r.department || ''}</div>
  <div><div class="block">Travel</div>${r.dateOfTravel || ''} • ${r.timeFrom || ''} – ${r.timeTo || ''} ${r.overnight ? '(overnight)' : ''}</div>
  <div><div class="block">Applied</div>${appliedLabel(r)}</div>
  <div><div class="block">Route</div>${r.fromLocation || ''} → ${r.toLocation || ''}</div>
</div>
<table>
  <tr><th>Vehicle</th><td>${r.assignedVehicleNumber || '—'}</td></tr>
  <tr><th>Driver</th><td>${r.assignedDriverName || '—'} ${r.assignedDriverPhone ? `(${r.assignedDriverPhone})` : ''}</td></tr>
  <tr><th>Schedule</th><td>P: ${fmtDT(r.scheduledPickupAt)}<br/>R: ${fmtDT(r.scheduledReturnAt)}</td></tr>
  <tr><th>Gate / Odometer</th><td>
    Exit: ${fmtDT(r.gateExitAt)} • O ${r.exitOdometer ?? '-'}<br/>
    Entry: ${fmtDT(r.gateEntryAt)} • O ${r.entryOdometer ?? '-'}
  </td></tr>
  <tr><th>Purpose</th><td>${r.officialDescription || '—'}</td></tr>
  <tr><th>Goods</th><td>${r.goods || '—'}</td></tr>
</table>
<script>addEventListener('load',()=>setTimeout(()=>{focus();print();},150));</script>
</body></html>`;
    printHtmlViaIframe(html);
  }, []);

  return (
    <div className="flex min-h-screen bg-orange-50">
      <HODSidebar />
      <main className="p-3 md:p-4 flex-1">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-[14px] md:text-lg font-bold text-orange-900">Pending Approvals</h1>
          <div className="flex items-center gap-2">
            <SearchBar value={q} onChange={setQ} placeholder="Search code, applicant, dept, route…" className="h-8" />
            <button
              type="button"
              onClick={printPage}
              className="inline-flex items-center gap-1 px-2.5 h-8 rounded bg-orange-600 text-white hover:bg-orange-700 text-[12px]"
              title="Print current list"
            >
              <Printer size={14} /> Print Page
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-orange-200 overflow-auto">
          {/* same column order as My Requests */}
          <table className="w-full table-fixed text-[10px] leading-[1.15]">
            <colgroup>
              <col style={{ width: '12%' }} />
              <col style={{ width: '18%' }} />
              <col style={{ width: '8%' }} />
              <col style={{ width: '12%' }} />
              <col style={{ width: '16%' }} />
              <col style={{ width: '12%' }} />
              <col style={{ width: '11%' }} />
              <col style={{ width: '11%' }} />
              <col style={{ width: '10%' }} />
            </colgroup>
            <thead className="bg-orange-50">
              <tr className="text-[9.5px]">
                <Th className="px-2 py-1 text-left">RQ ID / Applied</Th>
                <Th className="px-2 py-1 text-left">APPLICANT / OFFICER</Th>
                <Th className="px-2 py-1 text-center">Status</Th>
                <Th className="px-2 py-1 text-left">Travel</Th>
                <Th className="px-2 py-1 text-left">Route</Th>
                <Th className="px-2 py-1 text-left">Assigned</Th>
                <Th className="px-2 py-1 text-left">Schedule</Th>
                <Th className="px-2 py-1 text-left">Gate</Th>
                <Th className="px-2 py-1 text-center">Actions</Th>
              </tr>
            </thead>

            <tbody className="divide-y">
              {loading && (
                <tr><Td colSpan={9} className="px-2 py-6 text-center text-gray-500">Loading…</Td></tr>
              )}

              {!loading && filtered.map((r: any) => {
                const off = extractOfficer(r);
                return (
                  <tr
                    key={r.id}
                    className="align-top hover:bg-orange-50/40 cursor-pointer"
                    onClick={() => setDetails(r)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setDetails(r); }}
                    tabIndex={0}
                    role="button"
                    title="Click to view details"
                  >
                    {/* RQ ID / Applied */}
                    <Td className="px-2 py-1 whitespace-nowrap">
                      <div className="font-semibold text-orange-900 truncate" title={r.requestCode}>
                        {r.requestCode}
                      </div>
                      <div className="text-[9px] text-gray-600 truncate" title={appliedLabel(r)}>
                        {appliedLabel(r)}
                      </div>
                    </Td>

                    {/* APPLICANT / OFFICER */}
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

                    {/* Status */}
                    <Td className="px-2 py-1 text-center">{chip(r.status)}</Td>

                    {/* Travel */}
                    <Td className="px-2 py-1 whitespace-nowrap">
                      <div className="truncate" title={r.dateOfTravel}>{r.dateOfTravel}</div>
                      <div className="text-[9px] text-gray-600">
                        <span className="font-mono">{r.timeFrom}</span>–<span className="font-mono">{r.timeTo}</span> {r.overnight ? '(overnight)' : ''}
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

                    {/* Actions */}
                    <Td className="px-2 py-1 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          className="px-2 py-[3px] rounded bg-blue-600 text-white hover:bg-blue-700 text-[10px]"
                          onClick={(e) => { e.stopPropagation(); setSelected(r); }}
                          title="Review / Approve / Reject"
                        >
                          Review
                        </button>
                        <button
                          type="button"
                          className="px-2 py-[3px] rounded bg-orange-600 text-white hover:bg-orange-700 text-[10px]"
                          onClick={(e) => { e.stopPropagation(); printOne(r); }}
                          title="Print details"
                        >
                          <Printer size={12} />
                        </button>
                      </div>
                    </Td>
                  </tr>
                );
              })}

              {!loading && !filtered.length && (
                <tr><Td colSpan={9} className="px-2 py-6 text-center text-gray-500">No pending requests</Td></tr>
              )}
            </tbody>
          </table>
        </div>
      </main>

      {/* Approve/Reject modal */}
      <ReviewModal
        open={!!selected}
        request={selected}
        onClose={() => setSelected(null)}
        onApprove={actApprove}
        onReject={actReject}
      />

      {/* Details modal (unchanged labels) */}
      {details && <DetailsModal request={details} onClose={() => setDetails(null)} />}
    </div>
  );
}

/* ---------- details modal (kept from your version) ---------- */
function DetailsModal({ request, onClose }: { request: UsageRequest; onClose: () => void }) {
  const off = extractOfficer(request as any);
  return (
    <div
      className="fixed inset-0 bg-black/40 grid place-items-center z-50 p-3"
      onClick={onClose}
      onKeyDown={(e)=>{ if(e.key==='Escape') onClose(); }}
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-2 border-b bg-orange-50">
          <h3 className="font-bold text-orange-900 text-[12px]">Request • {(request as any).requestCode}</h3>
          <button className="p-1 rounded hover:bg-orange-100" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className="p-4 text-[10px] leading-[1.25] space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <section>
              <div className="text-orange-800 font-semibold mb-1">People</div>
              <div className="truncate">
                <span className="font-medium text-orange-900">Applicant:</span> {(request as any).applicantName}
                <span className="text-gray-600 text-[9px]"> ({(request as any).employeeId})</span>
              </div>
              <div className="truncate">
                <span className="font-medium">Officer:</span>{' '}
                {off.withOfficer ? (
                  <>
                    {off.name || '-'} <span className="text-gray-600 text-[9px]">({off.id || '-'})</span>
                    {off.phone ? <span className="text-gray-600 text-[9px]">, {off.phone}</span> : null}
                  </>
                ) : '—'}
              </div>
              <div className="truncate"><span className="font-medium">Department:</span> {(request as any).department || '-'}</div>
            </section>

            <section>
              <div className="text-orange-800 font-semibold mb-1">Status & Dates</div>
              <div><b>Status:</b> {(request as any).status}</div>
              <div><b>Applied:</b> {appliedLabel(request as any)}</div>
              <div className="text-[9px] text-gray-600 mt-1">
                Created {fmtDT((request as any).createdAt)}{(request as any).updatedAt ? ` • Updated ${fmtDT((request as any).updatedAt)}` : ''}
              </div>
            </section>

            <section>
              <div className="text-orange-800 font-semibold mb-1">Travel</div>
              <div><b>Date:</b> {(request as any).dateOfTravel}</div>
              <div><b>Time:</b> {(request as any).timeFrom} – {(request as any).timeTo} {(request as any).overnight ? '(overnight)' : ''}</div>
            </section>

            <section>
              <div className="text-orange-800 font-semibold mb-1">Route</div>
              <div className="truncate">{(request as any).fromLocation} → {(request as any).toLocation}</div>
            </section>

            <section>
              <div className="text-orange-800 font-semibold mb-1">Assignment</div>
              <div><b>Vehicle:</b> {(request as any).assignedVehicleNumber || '-'}</div>
              <div><b>Driver:</b> {(request as any).assignedDriverName || '-'} {(request as any).assignedDriverPhone ? `(${(request as any).assignedDriverPhone})` : ''}</div>
            </section>

            <section>
              <div className="text-orange-800 font-semibold mb-1">Schedule</div>
              <div><b>Pickup:</b> {fmtDT((request as any).scheduledPickupAt)}</div>
              <div><b>Return:</b> {fmtDT((request as any).scheduledReturnAt)}</div>
            </section>

            <section className="md:col-span-2">
              <div className="text-orange-800 font-semibold mb-1">Purpose / Goods</div>
              <div className="text-orange-900">{(request as any).officialDescription || '—'}</div>
              <div className="text-orange-700/80">{(request as any).goods || '—'}</div>
            </section>

            <section className="md:col-span-2">
              <div className="text-orange-800 font-semibold mb-1">Gate / Trip</div>
              <div><b>Exit:</b> {fmtDT((request as any).gateExitAt)} • <span className="text-[9px] text-gray-600">O {(request as any).exitOdometer ?? '-'}</span></div>
              <div><b>Entry:</b> {fmtDT((request as any).gateEntryAt)} • <span className="text-[9px] text-gray-600">O {(request as any).entryOdometer ?? '-'}</span></div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
