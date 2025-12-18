'use client';

/** PENDING APPROVALS
 * - Shows applicant + applied details
 * - Review modal for Approve/Reject
 * - After approve: server moves to "Sent to Management" and local history is saved
 * - Print table / single
 */

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { listByStatus, hodApprove, hodReject } from '../../Transport/services/usageService';
import type { UsageRequest } from '../../Transport/services/types';
import { Th, Td } from '../../Transport/components/ThTd';
import ReviewModal from '../components/ReviewModal';
import HODSearchBar from '../components/HODSearchBar';
import { toast } from 'react-toastify';
import { Printer } from 'lucide-react';

/* ---------------- helpers ---------------- */
const fmtDT = (s?: string | null) => (s ? new Date(s).toLocaleString() : '-');
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
function extractOfficer(r: any) {
  if (r?.travelWithOfficer || r?.officerName || r?.officerId || r?.officerPhone) {
    return { withOfficer: true, name: r.officerName, id: r.officerId, phone: r.officerPhone };
  }
  const text = `${r?.officialDescription || ''}\n${r?.remarks || ''}`;
  const m = /Travelling Officer:\s*([^\(\n,]+)?(?:\s*\((?:Employee\s*ID|Emp\.?\s*ID|ID)\s*:\s*([^)]+)\))?(?:,\s*(?:Phone|Tel)\s*:\s*([^\s,]+))?/i.exec(text);
  if (m) return { withOfficer: true, name: m[1]?.trim(), id: m[2]?.trim(), phone: m[3]?.trim() };
  return { withOfficer: false };
}
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
const chip = (s: string) => (
  <span className="inline-block text-[10px] px-1.5 py-[2px] rounded bg-orange-100 text-orange-800 leading-none">
    {s}
  </span>
);
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
  const [selected, setSelected] = useState<UsageRequest | null>(null);
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
        r.requestCode, r.status, r.applicantName, r.employeeId, r.department, r.fromLocation, r.toLocation,
        r.dateOfTravel, r.timeFrom, r.timeTo, r.assignedVehicleNumber, r.assignedDriverName, r.officialDescription,
        r.goods, off.name, off.id, off.phone, appliedLabel(r)
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

  /* ---------- PRINT: page ---------- */
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
  <td><div>${r.dateOfTravel || ''}</div><div class="sub mono">${r.timeFrom || ''} – ${r.timeTo || ''} ${r.overnight ? '(overnight)' : ''}</div></td>
  <td>${r.fromLocation || ''} → ${r.toLocation || ''}</td>
  <td><div>${r.assignedVehicleNumber || '—'}</div><div class="sub">${r.assignedDriverName || '—'}</div></td>
</tr>`;
    }).join('');

    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"/><title>Pending HOD — Print</title><meta name="viewport" content="width=device-width, initial-scale=1"/>
<style>
:root{--fg:#111;--muted:#666;--head:#faf5f0}*{box-sizing:border-box}
body{margin:0;padding:10mm;font-family:system-ui,Arial,sans-serif;color:var(--fg)}
h3{margin:0 0 8px 0}.meta{margin:4px 0 8px 0;font-size:11px;color:var(--muted)}
table{width:100%;border-collapse:collapse;table-layout:fixed}thead{display:table-header-group}
th,td{border:1px solid #ddd;padding:6px 8px;vertical-align:top;font-size:11px}th{background:var(--head);text-align:left}
.center{text-align:center}.sub{color:var(--muted);font-size:10px}.mono{font-family:ui-monospace,Menlo,Consolas,monospace}
.rq{font-weight:600;color:#8b4513}
@media print{@page{size:A4 landscape;margin:10mm}body{padding:0}}
</style></head>
<body>
<h3>Pending Approvals — HOD</h3>
<div class="meta">Results: ${filtered.length}</div>
<table>
  <colgroup><col style="width:16%"/><col style="width:24%"/><col style="width:10%"/><col style="width:15%"/><col style="width:20%"/><col style="width:15%"/></colgroup>
  <thead><tr><th>RQ ID / Applied</th><th>Applicant / Officer</th><th class="center">Status</th><th>Date / Time</th><th>Route</th><th>Assigned</th></tr></thead>
  <tbody>${rowsHtml || '<tr><td colspan="6">No data</td></tr>'}</tbody>
</table>
<script>addEventListener('load',()=>setTimeout(()=>{focus();print();},150));</script>
</body></html>`;
    printHtmlViaIframe(html);
  }, [filtered]);

  return (
    <>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-2">
          <h1 className="text-[14px] md:text-lg font-bold text-orange-900">Pending Approvals</h1>
          <div className="flex flex-col gap-2 w-full md:w-auto md:flex-row md:items-center">
            <HODSearchBar value={q} onChange={setQ} placeholder="Search code, applicant, dept, route…" className="w-full md:w-72" />
            <button
              type="button"
              onClick={printPage}
              className="inline-flex items-center justify-center gap-1 px-3 h-11 md:h-10 rounded-lg bg-orange-600 text-white hover:bg-orange-700 text-xs font-semibold"
            >
              <Printer size={14} /> Print
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-orange-200 overflow-auto">
          <table className="w-full table-fixed text-[10px] leading-[1.15]">
            <colgroup>
              <col style={{ width: '16%' }} />
              <col style={{ width: '24%' }} />
              <col style={{ width: '10%' }} />
              <col style={{ width: '15%' }} />
              <col style={{ width: '20%' }} />
              <col style={{ width: '15%' }} />
              <col style={{ width: '10%' }} />
            </colgroup>
            <thead className="bg-orange-50">
              <tr className="text-[9.5px]">
                <Th className="px-2 py-1 text-left">RQ ID / Applied</Th>
                <Th className="px-2 py-1 text-left">APPLICANT / OFFICER</Th>
                <Th className="px-2 py-1 text-center">Status</Th>
                <Th className="px-2 py-1 text-left">Date / Time</Th>
                <Th className="px-2 py-1 text-left">Route</Th>
                <Th className="px-2 py-1 text-left">Assigned</Th>
                <Th className="px-2 py-1 text-center">Review</Th>
              </tr>
            </thead>

            <tbody className="divide-y">
              {loading && (
                <tr><Td colSpan={7} className="px-2 py-6 text-center text-gray-500">Loading…</Td></tr>
              )}

              {!loading && filtered.map((r: any) => {
                const off = extractOfficer(r);
                return (
                  <tr key={r.id} className="align-top">
                    <Td className="px-2 py-1 whitespace-nowrap">
                      <div className="font-semibold text-orange-900 truncate" title={r.requestCode}>
                        {r.requestCode}
                      </div>
                      <div className="text-[9px] text-gray-600 truncate" title={appliedLabel(r)}>
                        {appliedLabel(r)}
                      </div>
                    </Td>
                    <Td className="px-2 py-1">
                      <div className="truncate">
                        <span className="font-medium text-orange-900">Applicant:</span> {r.applicantName}
                        <span className="text-gray-600 text-[9px]"> ({r.employeeId})</span>
                      </div>
                      <div className="text-[9.5px] text-gray-700 truncate">
                        <span className="font-medium">Officer:</span>{' '}
                        {off.withOfficer ? (<>
                          {off.name || '-'}<span className="text-gray-600 text-[9px]"> ({off.id || '-'})</span>
                          {off.phone ? <span className="text-gray-600 text-[9px]">, {off.phone}</span> : null}
                        </>) : '—'}
                      </div>
                    </Td>
                    <Td className="px-2 py-1 text-center">{chip(r.status)}</Td>
                    <Td className="px-2 py-1 whitespace-nowrap">
                      <div className="truncate" title={r.dateOfTravel}>{r.dateOfTravel}</div>
                      <div className="text-[9px] text-gray-600">
                        <span className="font-mono">{r.timeFrom}</span>–<span className="font-mono">{r.timeTo}</span> {r.overnight ? '(overnight)' : ''}
                      </div>
                    </Td>
                    <Td className="px-2 py-1">
                      <div className="truncate" title={`${r.fromLocation} → ${r.toLocation}`}>
                        {r.fromLocation} → {r.toLocation}
                      </div>
                    </Td>
                    <Td className="px-2 py-1 whitespace-nowrap">
                      <div className="font-medium truncate">{r.assignedVehicleNumber || '—'}</div>
                      <div className="text-[9px] text-gray-600 truncate">{r.assignedDriverName || '—'}</div>
                    </Td>
                    <Td className="px-2 py-1 text-center">
                      <button
                        type="button"
                        className="px-2 py-[4px] rounded bg-blue-600 text-white hover:bg-blue-700 text-[10px]"
                        onClick={() => setSelected(r)}
                      >
                        Review
                      </button>
                    </Td>
                  </tr>
                );
              })}

              {!loading && !filtered.length && (
                <tr><Td colSpan={7} className="px-2 py-6 text-center text-gray-500">No pending requests</Td></tr>
              )}
            </tbody>
          </table>
        </div>

      <ReviewModal
        open={!!selected}
        request={selected}
        onClose={() => setSelected(null)}
        onApprove={actApprove}
        onReject={actReject}
      />
    </>
  );
}
