'use client';

/** MANAGEMENT — PENDING APPROVALS (HOD-style + HOD Approver column)
 * Columns/order/names:
 *  RQ ID / Applied • Applicant / Dept • Status • HOD Approved By • Travel • Route • Officer • Purpose / Goods • Actions
 * - Row click opens Details modal
 * - Purpose / Goods in table + print
 * - Officer: "Name (ID), Phone" (sanitized)
 * - Hydration-safe <colgroup> via map()
 * - FIX: Status/Travel overlapping -> widened Status & Travel and tuned others
 */

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { listByStatus, mgmtApprove, mgmtReject } from '../../Transport/services/usageService';
import type { UsageRequest } from '../../Transport/services/types';
import { Th, Td } from '../../Transport/components/ThTd';
import SearchBar from '../../Transport/components/SearchBar';
import ManagementReviewModal from '../components/ManagementReviewModal';
import { toast } from 'react-toastify';
import { Printer, X, ClipboardCheck } from 'lucide-react';
import { login } from '../../../../../lib/auth';

/* ---------------- helpers ---------------- */
const fmtDT = (s?: string | null) => (s ? new Date(s).toLocaleString() : '—');

const appliedLabel = (r: any) => {
  const d = r?.appliedDate || r?.applied_at || r?.appliedOn;
  const t = r?.appliedTime || r?.applied_time;
  if (d && t) return `${d} ${t}`;
  if (d && r?.createdAt) {
    const tt = new Date(r.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return `${d} ${tt}`;
  }
  if (r?.createdAt) return fmtDT(r.createdAt);
  return '—';
};

/* phone sanitizer */
const cleanPhone = (p?: string) =>
  (p ?? '')
    .replace(/[^\d+()\-\s./;]/g, '')
    .replace(/^[;,\s-]+/, '')
    .replace(/\s{2,}/g, ' ')
    .trim();

/** Official Trip Description without embedded "Travelling Officer" lines/phones */
function purposeWithoutOfficer(r: any): string {
  const raw = String(r?.officialDescription ?? '');
  let cleaned = raw
    .split(/\r?\n/)
    .filter(line => !/travell?ing\s+officer\s*:/i.test(line))
    .join('\n');
  cleaned = cleaned.replace(/\b(?:Phone|Tel)\s*:\s*[\+\d()\-\s./;]+/gi, '');
  cleaned = cleaned
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+(,|\.)/g, '$1')
    .replace(/^[\s\-–,:]+/, '')
    .trim();
  return cleaned || '—';
}

/** Officer extractor (explicit fields or from description text) */
function extractOfficer(r: any): { withOfficer: boolean; name?: string; id?: string; phone?: string } {
  if (r?.travelWithOfficer || r?.officerName || r?.officerId || r?.officerPhone) {
    return {
      withOfficer: true,
      name: r.officerName || undefined,
      id: r.officerId || undefined,
      phone: cleanPhone(r.officerPhone) || undefined,
    };
  }
  const text = `${r?.officialDescription || ''}\n${r?.remarks || ''}`;
  const m =
    /Travelling Officer:\s*([^\(\n,]+)?(?:\s*\((?:Employee\s*ID|Emp\.?\s*ID|ID)\s*:\s*([^)]+)\))?(?:,\s*(?:Phone|Tel)\s*:\s*([^\n]+))?/i.exec(text);
  if (m) return { withOfficer: true, name: m[1]?.trim() || undefined, id: m[2]?.trim() || undefined, phone: cleanPhone(m[3]) || undefined };
  return { withOfficer: false };
}

/** HOD approver (accept several common field shapes) */
function extractHODApprover(r: any): { name?: string; id?: string; at?: string } {
  const name = r?.hodApprovedByName || r?.hodApprovedName || r?.hodApproverName || r?.approvedByHodName || r?.hodByName || r?.hodApprovedBy?.name;
  const id   = r?.hodApprovedById   || r?.hodApprovedId   || r?.hodApproverId   || r?.approvedByHodId   || r?.hodById   || r?.hodApprovedBy?.id;
  const at   = r?.hodApprovedAt     || r?.approvedByHodAt || r?.hodApprovalAt;

  if (!name && typeof r?.hodApprovedBy === 'string') {
    const m = /^(.*?)\s*\(([^)]+)\)/.exec(r.hodApprovedBy);
    return { name: m?.[1]?.trim(), id: m?.[2]?.trim(), at };
  }
  return { name: name?.toString(), id: id?.toString(), at };
}

const chip = (s: string) => (
  <span className="inline-block px-1 py-[1px] rounded bg-blue-100 text-blue-800 leading-none text-[8px] whitespace-nowrap">
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

/* ---------- column widths (sum = 100%) ----------
 * Wider Status & Travel to prevent overlap; add HOD col.
 */
const COLS = [
  '10%', // RQ ID / Applied
  '8%', // Applicant / Dept
  '9%',  // Status
  '8%', // HOD Approved By
  '8%', // Travel
  '8%', // Route
  '8%', // Officer
  '8%',  // Purpose / Goods
  '8%',  // Actions
] as const;

/* ======================= Page ======================= */
export default function ManagementPendingPage() {
  const [rows, setRows] = useState<UsageRequest[]>([]);
  const [q, setQ] = useState('');
  const [selected, setSelected] = useState<UsageRequest | null>(null); // Review modal
  const [view, setView] = useState<UsageRequest | null>(null);         // Details modal
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await listByStatus('PENDING_MANAGEMENT');
      setRows(list || []);
    } catch (err: any) {
      console.warn('Failed to load pending management list', err);
      setRows([]);
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
      const hod = extractHODApprover(r);
      return [
        r?.requestCode, r?.status, r?.applicantName, r?.employeeId, r?.department,
        r?.fromLocation, r?.toLocation, r?.dateOfTravel, r?.timeFrom, r?.timeTo,
        r?.officialDescription, r?.goods, off.name, off.id, off.phone,
        hod.name, hod.id, appliedLabel(r),
      ].map(x => (x ?? '').toString().toLowerCase()).join(' ').includes(s);
    });
  }, [rows, q]);

  const resolveUsername = () => {
    if (typeof window === 'undefined') return '';
    return (
      localStorage.getItem('username') ||
      localStorage.getItem('actor') ||
      localStorage.getItem('employeeId') ||
      ''
    );
  };

  const actApprove = async (remarks: string, password: string) => {
    if (!selected) return;
    try {
      const username = resolveUsername();
      if (!username || !password.trim()) throw new Error('Missing credentials; please re-enter password.');
      await login({ username, password });
      await mgmtApprove(selected.id, remarks);
      toast?.success?.('Approved');
      setSelected(null);
      load();
    } catch (e: any) {
      toast?.error?.(e?.message || 'Failed to approve');
    }
  };

  const actReject = async (remarks: string, password: string) => {
    if (!selected) return;
    try {
      const username = resolveUsername();
      if (!username || !password.trim()) throw new Error('Missing credentials; please re-enter password.');
      await login({ username, password });
      await mgmtReject(selected.id, remarks);
      toast?.success?.('Request rejected');
      setSelected(null);
      load();
    } catch (e: any) {
      toast?.error?.(e?.message || 'Failed to reject');
    }
  };

  /* ---------- PRINT: page (with HOD column) ---------- */
  const printPage = useCallback(() => {
    const rowsHtml = filtered.map((r: any) => {
      const off = extractOfficer(r);
      const hod = extractHODApprover(r);
      return `
<tr>
  <td><div class="rq">${r.requestCode || ''}</div><div class="sub">${appliedLabel(r)}</div></td>
  <td>${r.applicantName || ''} <span class="sub">(${r.employeeId || ''})</span><div class="sub">${r.department || ''}</div></td>
  <td class="center">${r.status || 'PENDING MANAGEMENT'}</td>
  <td>${(hod.name || hod.id) ? `${hod.name ?? '—'}${hod.id ? ` <span class="sub">(${hod.id})</span>` : ''}` : '—'}</td>
  <td><div>${r.dateOfTravel || ''}</div><div class="sub mono">${r.timeFrom || ''} – ${r.timeTo || ''} ${r.overnight ? '(overnight)' : ''}</div></td>
  <td>${r.fromLocation || ''} → ${r.toLocation || ''}</td>
  <td>${off.withOfficer ? `${off.name || '-'}${off.id ? ` <span class="sub">(${off.id})</span>` : ''}${off.phone ? `, ${off.phone}` : ''}` : '—'}</td>
  <td><div>${purposeWithoutOfficer(r)}</div><div class="sub">${r.goods || '—'}</div></td>
</tr>`;
    }).join('');

    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"/><title>Pending Management — Print</title><meta name="viewport" content="width=device-width, initial-scale=1"/>
<style>
:root{--fg:#111;--muted:#666;--head:#faf5f0}*{box-sizing:border-box}
body{margin:0;padding:10mm;font-family:system-ui,Arial,sans-serif;color:var(--fg)}
h3{margin:0 0 8px 0}.meta{margin:4px 0 8px 0;font-size:11px;color:var(--muted)}
table{width:100%;border-collapse:collapse;table-layout:fixed}thead{display:table-header-group}
th,td{border:1px solid #ddd;padding:6px 8px;vertical-align:top;font-size:11px}th{background:var(--head);text-align:left}
.center{text-align:center}.sub{color:var(--muted);font-size:10.5px}.mono{font-family:ui-monospace,Menlo,Consolas,monospace}
.rq{font-weight:600;color:#1e3a8a}
col.c1{width:12%}col.c2{width:16%}col.c3{width:9%}col.c4{width:12%}col.c5{width:12%}col.c6{width:13%}col.c7{width:11%}col.c8{width:9%}
@media print{@page{size:A4 landscape;margin:10mm}body{padding:0}}
</style></head>
<body>
<h3>Pending Approvals — Management</h3>
<div class="meta">Results: ${filtered.length}</div>
<table>
  <colgroup><col class="c1"/><col class="c2"/><col class="c3"/><col class="c4"/><col class="c5"/><col class="c6"/><col class="c7"/><col class="c8"/></colgroup>
  <thead><tr>
    <th>RQ ID / Applied</th>
    <th>Applicant / Dept</th>
    <th class="center">Status</th>
    <th>HOD Approved By</th>
    <th>Travel</th>
    <th>Route</th>
    <th>Officer</th>
    <th>Purpose / Goods</th>
  </tr></thead>
  <tbody>${rowsHtml || '<tr><td colspan="8">No data</td></tr>'}</tbody>
</table>
<script>addEventListener('load',()=>setTimeout(()=>{focus();print();},150));</script>
</body></html>`;
    printHtmlViaIframe(html);
  }, [filtered]);

  /* ---------- PRINT: single row (unchanged from earlier enhancement) ---------- */
  const printOne = useCallback((r: any) => {
    const off = extractOfficer(r);
    const hod = extractHODApprover(r);
    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"/><title>${r.requestCode || 'Request'} — Print</title><meta name="viewport" content="width=device-width, initial-scale=1"/>
<style>*{box-sizing:border-box}body{margin:0;padding:12mm;font-family:system-ui,Arial,sans-serif;color:#111}
h2{margin:0 0 12px 0}.grid{display:grid;grid-template-columns:1fr 1fr;gap:8px 16px;font-size:12px}
.block{margin:8px 0 2px;font-weight:600;color:#1e3a8a}.sub{color:#666;font-size:11px}
table{width:100%;border-collapse:collapse;margin-top:10px}th,td{border:1px solid #ddd;padding:6px 8px;font-size:12px;vertical-align:top}
th{background:#faf5f0;text-align:left;width:34%}@media print{@page{size:A4 portrait;margin:10mm}body{padding:0}}</style></head>
<body>
  <h2>Transport Request • ${r.requestCode || ''}</h2>
  <div class="grid">
    <div><div class="block">Applicant</div>${r.applicantName || ''} <span class="sub">(${r.employeeId || ''})</span></div>
    <div><div class="block">Status</div>${r.status || 'PENDING MANAGEMENT'}</div>
    <div><div class="block">Department</div>${r.department || ''}</div>
    <div><div class="block">Applied</div>${appliedLabel(r)}</div>
    <div><div class="block">Travel</div>${r.dateOfTravel || ''} • ${r.timeFrom || ''} – ${r.timeTo || ''} ${r.overnight ? '(overnight)' : ''}</div>
    <div><div class="block">Route</div>${r.fromLocation || ''} → ${r.toLocation || ''}</div>
  </div>
  <table>
    <tr><th>Official Trip Description</th><td>${purposeWithoutOfficer(r)}</td></tr>
    <tr><th>Goods being transported (if any)</th><td>${r.goods || '—'}</td></tr>
    <tr><th>Officer</th><td>${off.withOfficer ? `${off.name || '—'}${off.id ? ` (${off.id})` : ''}${off.phone ? `, ${off.phone}` : ''}` : '—'}</td></tr>
    <tr><th>Pickup</th><td>${fmtDT(r.scheduledPickupAt)}</td></tr>
    <tr><th>Return</th><td>${fmtDT(r.scheduledReturnAt)}</td></tr>
    <tr><th>Gate Exit • Odometer</th><td>${fmtDT(r.gateExitAt)} • O ${r.exitOdometer ?? '—'}${r.gateExitByName ? ` • By ${r.gateExitByName}${r.gateExitById ? ` (${r.gateExitById})` : ''}` : ''}</td></tr>
    <tr><th>Gate Entry • Odometer</th><td>${fmtDT(r.gateEntryAt)} • O ${r.entryOdometer ?? '—'}${r.gateEntryByName ? ` • By ${r.gateEntryByName}${r.gateEntryById ? ` (${r.gateEntryById})` : ''}` : ''}</td></tr>
    <tr><th>HOD Approval</th><td>${(hod.name || hod.id || hod.at)
      ? `${hod.name ?? '—'}${hod.id ? ` (${hod.id})` : ''}${hod.at ? ` • ${fmtDT(hod.at)}` : ''}`
      : '—'}</td></tr>
  </table>
  <script>addEventListener('load',()=>setTimeout(()=>{focus();print();},150));</script>
</body></html>`;
    printHtmlViaIframe(html);
  }, []);

  /* ---------- UI ---------- */
  return (
    <div className="space-y-4 p-3 md:p-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <h1 className="text-[14px] md:text-lg font-bold text-orange-900">Pending Approvals</h1>
        <div className="flex flex-wrap items-center gap-2">
          <SearchBar
            value={q}
            onChange={setQ}
            placeholder="Search code, applicant, dept, HOD, route, officer, purpose…"
            className="h-10 min-w-[240px]"
          />
          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 h-10 rounded-lg border border-orange-200 text-orange-800 hover:bg-orange-50 text-sm font-semibold disabled:opacity-60"
            title="Refresh from server"
          >
            <ClipboardCheck size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button
            type="button"
            onClick={printPage}
            className="inline-flex items-center gap-2 px-4 h-10 rounded-lg bg-orange-600 text-white hover:bg-orange-700 text-sm font-semibold shadow-sm"
            title="Print current list"
          >
            <Printer size={16} />
            Print Page
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-orange-200 overflow-auto">
        {/* Hydration-safe colgroup */}
        <table className="w-full table-fixed text-[8px] leading-tight">
          <colgroup>{COLS.map((w, i) => <col key={i} style={{ width: w }} />)}</colgroup>

          <thead className="bg-orange-50 text-[9px] uppercase tracking-wide">
            <tr>
              <Th className="px-2 py-1 text-left">RQ ID / Applied</Th>
              <Th className="px-2 py-1 text-left">Applicant / Dept</Th>
              <Th className="px-2 py-1 text-center">Status</Th>
              <Th className="px-2 py-1 text-left">HOD Approved By</Th>
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
                  <Td colSpan={9} className="px-2 py-6 text-center text-gray-500">
                    Loading…
                  </Td>
                </tr>
              )}

              {!loading && filtered.map((r: any) => {
                const off = extractOfficer(r);
                const hod = extractHODApprover(r);
                const rowKey = String(r?.id ?? r?.requestCode ?? `${r?.employeeId}-${r?.dateOfTravel}-${r?.timeFrom}`);

                return (
                  <tr
                    key={rowKey}
                    className="align-top hover:bg-orange-50/40 cursor-pointer"
                    onClick={() => setView(r)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setView(r); } }}
                    role="button"
                    tabIndex={0}
                    title="Click for full details"
                  >
                    {/* RQ / Applied */}
                    <Td className="px-2 py-1">
                      <div className="font-semibold text-orange-900 truncate">{r.requestCode || '—'}</div>
                      <div className="text-xs text-gray-600 truncate">{appliedLabel(r)}</div>
                    </Td>

                    {/* Applicant / Dept */}
                    <Td className="px-2 py-1">
                      <div className="truncate">
                        <span className="font-medium text-orange-900">{r.applicantName || '—'}</span>{' '}
                        <span className="text-gray-600 text-xs">({r.employeeId || '—'})</span>
                      </div>
                      <div className="text-xs text-gray-700 truncate">{r.department || '—'}</div>
                    </Td>

                    {/* Status (no wrap to avoid overlap) */}
                    <Td className="px-2 py-1 text-center">
                      <div className="inline-block max-w-full">{chip(r.status || 'PENDING MANAGEMENT')}</div>
                    </Td>

                    {/* HOD Approved By */}
                    <Td className="px-2 py-1">
                      {(hod.name || hod.id) ? (
                        <div className="truncate">
                          {hod.name ?? '—'}{hod.id ? <span className="text-xs text-gray-600"> ({hod.id})</span> : null}
                        </div>
                      ) : '—'}
                    </Td>

                    {/* Travel (split lines; prevent overflow) */}
                    <Td className="px-2 py-1">
                      <div className="truncate">{r.dateOfTravel || '—'}</div>
                      <div className="text-xs text-gray-600">
                        <span className="font-mono">{r.timeFrom || '—'}</span>–<span className="font-mono">{r.timeTo || '—'}</span> {r.overnight ? '(overnight)' : ''}
                      </div>
                    </Td>

                    {/* Route */}
                    <Td className="px-2 py-1">
                      <div className="truncate">{r.fromLocation || '—'} → {r.toLocation || '—'}</div>
                    </Td>

                    {/* Officer */}
                    <Td className="px-2 py-1">
                      {off.withOfficer ? (
                        <>
                          <div className="truncate">
                            {off.name ?? '—'}{off.id ? <span className="text-xs text-gray-600"> ({off.id})</span> : null}
                          </div>
                          {off.phone ? <div className="text-xs text-gray-700 break-all">{off.phone}</div> : null}
                        </>
                      ) : '—'}
                    </Td>

                    {/* Purpose / Goods */}
                    <Td className="px-2 py-1">
                      <div className="break-words break-all">{purposeWithoutOfficer(r)}</div>
                      <div className="text-xs text-gray-700">{r.goods || '—'}</div>
                    </Td>

                    {/* Actions */}
                    <Td className="px-2 py-1 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 px-2 py-[4px] rounded bg-blue-600 text-white hover:bg-blue-700 text-xs"
                          onClick={() => setSelected(r)}
                          title="Review / Approve / Reject"
                        >
                          <ClipboardCheck size={12} /> Review
                        </button>
                        <button
                          type="button"
                          className="inline-flex items-center justify-center px-2 py-[4px] rounded bg-orange-600 text-white hover:bg-orange-700 text-xs"
                          onClick={() => printOne(r)}
                          title="Print this request"
                        >
                          <Printer size={12} />
                        </button>
                      </div>
                    </Td>
                  </tr>
                );
              })}

              {!loading && !filtered.length && (
                <tr>
                  <Td colSpan={9} className="px-2 py-6 text-center text-gray-500">
                    No pending requests
                  </Td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      {/* Review modal */}
      <ManagementReviewModal
        open={!!selected}
        request={selected}
        onClose={() => setSelected(null)}
        onApprove={actApprove}
        onReject={actReject}
      />

      {/* Row-click Details modal */}
      {view
        ? createPortal(<DetailsModal request={view} onClose={() => setView(null)} />, document.body)
        : null}
    </div>
  );
}

/* ========== Details Modal ========== */
function DetailsModal({ request, onClose }: { request: UsageRequest; onClose: () => void }) {
  const off = extractOfficer(request as any);
  const hod = extractHODApprover(request as any);
  const yn = (b?: boolean) => (b ? 'Yes' : 'No');

  return (
    <div className="fixed inset-0 bg-black/40 grid place-items-center z-50 p-3" onClick={onClose} aria-modal role="dialog">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-2 border-b bg-orange-50">
          <h3 className="font-bold text-orange-900 text-[13px]">Request • {(request as any).requestCode}</h3>
          <button className="p-1 rounded hover:bg-orange-100" onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>
        </div>

        <div className="p-4 text-[12px] leading-tight space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <section>
              <div className="text-orange-800 font-semibold mb-1">Applicant & Department</div>
              <div className="truncate">
                <span className="font-medium text-orange-900">Applicant Name:</span> {(request as any).applicantName}
                <span className="text-gray-600 text-xs"> ({(request as any).employeeId})</span>
              </div>
              <div className="truncate"><span className="font-medium">Department:</span> {(request as any).department || '—'}</div>
            </section>

            <section>
              <div className="text-orange-800 font-semibold mb-1">Status</div>
              <div><b>Status:</b> {(request as any).status || 'PENDING MANAGEMENT'}</div>
              <div><b>Applied:</b> {appliedLabel(request as any)}</div>
              <div className="text-xs text-gray-600 mt-1">
                Created {fmtDT((request as any).createdAt)}
                {(request as any).updatedAt ? ` • Updated ${fmtDT((request as any).updatedAt)}` : ''}
              </div>
            </section>

            <section>
              <div className="text-orange-800 font-semibold mb-1">Date & Time</div>
              <div><b>Date of Travel:</b> {(request as any).dateOfTravel}</div>
              <div><b>Time From:</b> {(request as any).timeFrom || '—'}</div>
              <div><b>Time To:</b> {(request as any).timeTo || '—'} {(request as any).overnight ? '(overnight)' : ''}</div>
            </section>

            <section>
              <div className="text-orange-800 font-semibold mb-1">Route</div>
              <div><b>From Location:</b> {(request as any).fromLocation}</div>
              <div><b>To Location:</b> {(request as any).toLocation}</div>
            </section>

            <section className="md:col-span-2 border border-orange-100 rounded-lg p-3">
              <div className="text-orange-800 font-semibold mb-2">Official Trip Description / Goods</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div>
                    <div className="text-gray-600">Official Trip Description</div>
                    <div className="text-orange-900 break-words break-all">{purposeWithoutOfficer(request as any)}</div>
                  </div>
                  <div>
                    <div className="text-gray-600">Goods being transported (if any)</div>
                    <div className="text-orange-800/90 break-words">{(request as any).goods || '—'}</div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div><div className="text-gray-600">Travelling with Officer</div><div>{yn((request as any).travelWithOfficer || off.withOfficer)}</div></div>
                  <div>
                    <div className="text-gray-600">Officer</div>
                    <div className="break-words break-all">
                      {off.withOfficer ? (<>{off.name || '—'} {off.id ? <span className="text-xs text-gray-600">({off.id})</span> : null}{off.phone ? `, ${off.phone}` : ''}</>) : '—'}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Gate / Trip (kept; you asked earlier) */}
            <section className="md:col-span-2 border border-orange-100 rounded-lg p-3">
              <div className="text-orange-800 font-semibold mb-2">Gate / Trip</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <div><b>Pickup:</b> {fmtDT((request as any).scheduledPickupAt)}</div>
                  <div><b>Return:</b> {fmtDT((request as any).scheduledReturnAt)}</div>
                </div>
                <div>
                  <div>
                    <b>Gate Exit:</b> {fmtDT((request as any).gateExitAt)} • <span className="text-xs text-gray-600">O {(request as any).exitOdometer ?? '—'}</span>
                    {(request as any).gateExitByName ? <> • <span>By {(request as any).gateExitByName}{(request as any).gateExitById ? ` (${(request as any).gateExitById})` : ''}</span></> : null}
                  </div>
                  <div>
                    <b>Gate Entry:</b> {fmtDT((request as any).gateEntryAt)} • <span className="text-xs text-gray-600">O {(request as any).entryOdometer ?? '—'}</span>
                    {(request as any).gateEntryByName ? <> • <span>By {(request as any).gateEntryByName}{(request as any).gateEntryById ? ` (${(request as any).gateEntryById})` : ''}</span></> : null}
                  </div>
                </div>
              </div>
            </section>

            {/* HOD Approval */}
            <section className="md:col-span-2 border border-orange-100 rounded-lg p-3">
              <div className="text-orange-800 font-semibold mb-2">HOD Approval</div>
              <div>
                {(hod.name || hod.id || hod.at)
                  ? (<>
                      <b>Approved By:</b> {hod.name ?? '—'}{hod.id ? <> <span className="text-xs text-gray-600">({hod.id})</span></> : null}
                      {hod.at ? <> • <b>At:</b> {fmtDT(hod.at)}</> : null}
                    </>)
                  : '—'}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}









// 'use client';

// /** MANAGEMENT — PENDING APPROVALS (HOD-style + HOD Approver column, no horizontal scroll)
//  * Columns/order:
//  *  RQ ID / Applied • Applicant / Dept • Status • HOD Approved By • Travel • Route • Officer • Purpose / Goods • Actions
//  * Behaviors:
//  *  - Row click opens Details modal
//  *  - Purpose / Goods in table + print
//  *  - Officer: "Name (ID), Phone" (sanitized)
//  *  - Hydration-safe <colgroup> via map()
//  * Layout fixes:
//  *  - Rebalanced column widths (sum 100%) to avoid overflow/overlap
//  *  - Truncation + titles for long text
//  */

// import React, { useEffect, useMemo, useState, useCallback } from 'react';
// import { createPortal } from 'react-dom';
// import ManagementSidebar from '../components/ManagementSidebar';
// import { listByStatus, mgmtApprove, mgmtReject } from '../../Transport/services/usageService';
// import type { UsageRequest } from '../../Transport/services/types';
// import { Th, Td } from '../../Transport/components/ThTd';
// import SearchBar from '../../Transport/components/SearchBar';
// import ManagementReviewModal from '../components/ManagementReviewModal';
// import { toast } from 'react-toastify';
// import { Printer, X, ClipboardCheck } from 'lucide-react';

// /* ---------------- helpers ---------------- */
// const fmtDT = (s?: string | null) => (s ? new Date(s).toLocaleString() : '—');

// const appliedLabel = (r: any) => {
//   const d = r?.appliedDate || r?.applied_at || r?.appliedOn;
//   const t = r?.appliedTime || r?.applied_time;
//   if (d && t) return `${d} ${t}`;
//   if (d && r?.createdAt) {
//     const tt = new Date(r.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
//     return `${d} ${tt}`;
//   }
//   if (r?.createdAt) return fmtDT(r.createdAt);
//   return '—';
// };

// /* phone sanitizer */
// const cleanPhone = (p?: string) =>
//   (p ?? '')
//     .replace(/[^\d+()\-\s./;]/g, '')
//     .replace(/^[;,\s-]+/, '')
//     .replace(/\s{2,}/g, ' ')
//     .trim();

// /** Official Trip Description without embedded "Travelling Officer" lines/phones */
// function purposeWithoutOfficer(r: any): string {
//   const raw = String(r?.officialDescription ?? '');
//   let cleaned = raw
//     .split(/\r?\n/)
//     .filter(line => !/travell?ing\s+officer\s*:/i.test(line))
//     .join('\n');
//   cleaned = cleaned.replace(/\b(?:Phone|Tel)\s*:\s*[\+\d()\-\s./;]+/gi, '');
//   cleaned = cleaned
//     .replace(/\s{2,}/g, ' ')
//     .replace(/\s+(,|\.)/g, '$1')
//     .replace(/^[\s\-–,:]+/, '')
//     .trim();
//   return cleaned || '—';
// }

// /** Officer extractor (explicit fields or from description text) */
// function extractOfficer(r: any): { withOfficer: boolean; name?: string; id?: string; phone?: string } {
//   if (r?.travelWithOfficer || r?.officerName || r?.officerId || r?.officerPhone) {
//     return {
//       withOfficer: true,
//       name: r.officerName || undefined,
//       id: r.officerId || undefined,
//       phone: cleanPhone(r.officerPhone) || undefined,
//     };
//   }
//   const text = `${r?.officialDescription || ''}\n${r?.remarks || ''}`;
//   const m =
//     /Travelling Officer:\s*([^\(\n,]+)?(?:\s*\((?:Employee\s*ID|Emp\.?\s*ID|ID)\s*:\s*([^)]+)\))?(?:,\s*(?:Phone|Tel)\s*:\s*([^\n]+))?/i.exec(text);
//   if (m) return { withOfficer: true, name: m[1]?.trim() || undefined, id: m[2]?.trim() || undefined, phone: cleanPhone(m[3]) || undefined };
//   return { withOfficer: false };
// }

// /** HOD approver (accept several common field shapes) */
// function extractHODApprover(r: any): { name?: string; id?: string; at?: string } {
//   const name = r?.hodApprovedByName || r?.hodApprovedName || r?.hodApproverName || r?.approvedByHodName || r?.hodByName || r?.hodApprovedBy?.name;
//   const id   = r?.hodApprovedById   || r?.hodApprovedId   || r?.hodApproverId   || r?.approvedByHodId   || r?.hodById   || r?.hodApprovedBy?.id;
//   const at   = r?.hodApprovedAt     || r?.approvedByHodAt || r?.hodApprovalAt;

//   if (!name && typeof r?.hodApprovedBy === 'string') {
//     const m = /^(.*?)\s*\(([^)]+)\)/.exec(r.hodApprovedBy);
//     return { name: m?.[1]?.trim(), id: m?.[2]?.trim(), at };
//   }
//   return { name: name?.toString(), id: id?.toString(), at };
// }

// const chip = (s: string) => (
//   <span className="inline-block px-1 py-[1px] rounded bg-blue-100 text-blue-800 leading-none text-[8px] whitespace-nowrap">
//     {s}
//   </span>
// );

// /* ---- iframe-only print ---- */
// function printHtmlViaIframe(html: string) {
//   const iframe = document.createElement('iframe');
//   Object.assign(iframe.style, { position: 'fixed', right: '0', bottom: '0', width: '0', height: '0', border: '0' });
//   document.body.appendChild(iframe);
//   const doc = iframe.contentWindow?.document;
//   if (!doc) { document.body.removeChild(iframe); return; }
//   doc.open(); doc.write(html); doc.close();
//   iframe.onload = () => {
//     try { iframe.contentWindow?.focus(); iframe.contentWindow?.print(); } catch {}
//     setTimeout(() => { try { document.body.removeChild(iframe); } catch {} }, 1200);
//   };
// }

// /* ---------- column widths (sum = 100%) ----------
//  * Balanced to fit screen without horizontal scroll or overlaps.
//  */
// const COLS = [
//   '12%', // RQ ID / Applied
//   '14%', // Applicant / Dept
//   '9%',  // Status
//   '12%', // HOD Approved By
//   '11%', // Travel
//   '12%', // Route
//   '10%', // Officer
//   '12%', // Purpose / Goods
//   '8%',  // Actions
// ] as const;

// /* ======================= Page ======================= */
// export default function ManagementPendingPage() {
//   const [rows, setRows] = useState<UsageRequest[]>([]);
//   const [q, setQ] = useState('');
//   const [selected, setSelected] = useState<UsageRequest | null>(null); // Review modal
//   const [view, setView] = useState<UsageRequest | null>(null);         // Details modal
//   const [loading, setLoading] = useState(true);

//   const load = useCallback(async () => {
//     setLoading(true);
//     try {
//       const list = await listByStatus('PENDING_MANAGEMENT');
//       setRows(list || []);
//     } finally {
//       setLoading(false);
//     }
//   }, []);
//   useEffect(() => { load(); }, [load]);

//   const filtered = useMemo(() => {
//     const s = q.trim().toLowerCase();
//     if (!s) return rows;
//     return rows.filter((r: any) => {
//       const off = extractOfficer(r);
//       const hod = extractHODApprover(r);
//       return [
//         r?.requestCode, r?.status, r?.applicantName, r?.employeeId, r?.department,
//         r?.fromLocation, r?.toLocation, r?.dateOfTravel, r?.timeFrom, r?.timeTo,
//         r?.officialDescription, r?.goods, off.name, off.id, off.phone,
//         hod.name, hod.id, appliedLabel(r),
//       ].map(x => (x ?? '').toString().toLowerCase()).join(' ').includes(s);
//     });
//   }, [rows, q]);

//   const actApprove = async (remarks?: string) => {
//     if (!selected) return;
//     try {
//       await mgmtApprove(selected.id, remarks);
//       toast?.success?.('Approved');
//       setSelected(null);
//       load();
//     } catch (e: any) {
//       toast?.error?.(e?.message || 'Failed to approve');
//     }
//   };
//   const actReject = async (remarks?: string) => {
//     if (!selected) return;
//     try {
//       await mgmtReject(selected.id, remarks);
//       toast?.success?.('Request rejected');
//       setSelected(null);
//       load();
//     } catch (e: any) {
//       toast?.error?.(e?.message || 'Failed to reject');
//     }
//   };

//   /* ---------- PRINT: page (with HOD column) ---------- */
//   const printPage = useCallback(() => {
//     const rowsHtml = filtered.map((r: any) => {
//       const off = extractOfficer(r);
//       const hod = extractHODApprover(r);
//       return `
// <tr>
//   <td><div class="rq">${r.requestCode || ''}</div><div class="sub">${appliedLabel(r)}</div></td>
//   <td>${r.applicantName || ''} <span class="sub">(${r.employeeId || ''})</span><div class="sub">${r.department || ''}</div></td>
//   <td class="center">${r.status || 'PENDING MANAGEMENT'}</td>
//   <td>${(hod.name || hod.id) ? `${hod.name ?? '—'}${hod.id ? ` <span class="sub">(${hod.id})</span>` : ''}` : '—'}</td>
//   <td><div>${r.dateOfTravel || ''}</div><div class="sub mono">${r.timeFrom || ''} – ${r.timeTo || ''} ${r.overnight ? '(overnight)' : ''}</div></td>
//   <td>${r.fromLocation || ''} → ${r.toLocation || ''}</td>
//   <td>${off.withOfficer ? `${off.name || '-'}${off.id ? ` <span class="sub">(${off.id})</span>` : ''}${off.phone ? `, ${off.phone}` : ''}` : '—'}</td>
//   <td><div>${purposeWithoutOfficer(r)}</div><div class="sub">${r.goods || '—'}</div></td>
// </tr>`;
//     }).join('');

//     const html = `<!DOCTYPE html>
// <html><head><meta charset="utf-8"/><title>Pending Management — Print</title><meta name="viewport" content="width=device-width, initial-scale=1"/>
// <style>
// :root{--fg:#111;--muted:#666;--head:#faf5f0}*{box-sizing:border-box}
// body{margin:0;padding:10mm;font-family:system-ui,Arial,sans-serif;color:var(--fg)}
// h3{margin:0 0 8px 0}.meta{margin:4px 0 8px 0;font-size:11px;color:var(--muted)}
// table{width:100%;border-collapse:collapse;table-layout:fixed}thead{display:table-header-group}
// th,td{border:1px solid #ddd;padding:6px 8px;vertical-align:top;font-size:11px}th{background:var(--head);text-align:left}
// .center{text-align:center}.sub{color:var(--muted);font-size:10.5px}.mono{font-family:ui-monospace,Menlo,Consolas,monospace}
// .rq{font-weight:600;color:#1e3a8a}
// col.c1{width:12%}col.c2{width:14%}col.c3{width:9%}col.c4{width:12%}col.c5{width:11%}col.c6{width:12%}col.c7{width:10%}col.c8{width:12%}
// @media print{@page{size:A4 landscape;margin:10mm}body{padding:0}}
// </style></head>
// <body>
// <h3>Pending Approvals — Management</h3>
// <div class="meta">Results: ${filtered.length}</div>
// <table>
//   <colgroup><col class="c1"/><col class="c2"/><col class="c3"/><col class="c4"/><col class="c5"/><col class="c6"/><col class="c7"/><col class="c8"/></colgroup>
//   <thead><tr>
//     <th>RQ ID / Applied</th>
//     <th>Applicant / Dept</th>
//     <th class="center">Status</th>
//     <th>HOD Approved By</th>
//     <th>Travel</th>
//     <th>Route</th>
//     <th>Officer</th>
//     <th>Purpose / Goods</th>
//   </tr></thead>
//   <tbody>${rowsHtml || '<tr><td colspan="8">No data</td></tr>'}</tbody>
// </table>
// <script>addEventListener('load',()=>setTimeout(()=>{focus();print();},150));</script>
// </body></html>`;
//     printHtmlViaIframe(html);
//   }, [filtered]);

//   /* ---------- PRINT: single row (kept with Gate + HOD info) ---------- */
//   const printOne = useCallback((r: any) => {
//     const off = extractOfficer(r);
//     const hod = extractHODApprover(r);
//     const html = `<!DOCTYPE html>
// <html><head><meta charset="utf-8"/><title>${r.requestCode || 'Request'} — Print</title><meta name="viewport" content="width=device-width, initial-scale=1"/>
// <style>*{box-sizing:border-box}body{margin:0;padding:12mm;font-family:system-ui,Arial,sans-serif;color:#111}
// h2{margin:0 0 12px 0}.grid{display:grid;grid-template-columns:1fr 1fr;gap:8px 16px;font-size:12px}
// .block{margin:8px 0 2px;font-weight:600;color:#1e3a8a}.sub{color:#666;font-size:11px}
// table{width:100%;border-collapse:collapse;margin-top:10px}th,td{border:1px solid #ddd;padding:6px 8px;font-size:12px;vertical-align:top}
// th{background:#faf5f0;text-align:left;width:34%}@media print{@page{size:A4 portrait;margin:10mm}body{padding:0}}</style></head>
// <body>
//   <h2>Transport Request • ${r.requestCode || ''}</h2>
//   <div class="grid">
//     <div><div class="block">Applicant</div>${r.applicantName || ''} <span class="sub">(${r.employeeId || ''})</span></div>
//     <div><div class="block">Status</div>${r.status || 'PENDING MANAGEMENT'}</div>
//     <div><div class="block">Department</div>${r.department || ''}</div>
//     <div><div class="block">Applied</div>${appliedLabel(r)}</div>
//     <div><div class="block">Travel</div>${r.dateOfTravel || ''} • ${r.timeFrom || ''} – ${r.timeTo || ''} ${r.overnight ? '(overnight)' : ''}</div>
//     <div><div class="block">Route</div>${r.fromLocation || ''} → ${r.toLocation || ''}</div>
//   </div>
//   <table>
//     <tr><th>Official Trip Description</th><td>${purposeWithoutOfficer(r)}</td></tr>
//     <tr><th>Goods being transported (if any)</th><td>${r.goods || '—'}</td></tr>
//     <tr><th>Officer</th><td>${off.withOfficer ? `${off.name || '—'}${off.id ? ` (${off.id})` : ''}${off.phone ? `, ${off.phone}` : ''}` : '—'}</td></tr>
//     <tr><th>Pickup</th><td>${fmtDT(r.scheduledPickupAt)}</td></tr>
//     <tr><th>Return</th><td>${fmtDT(r.scheduledReturnAt)}</td></tr>
//     <tr><th>Gate Exit • Odometer</th><td>${fmtDT(r.gateExitAt)} • O ${r.exitOdometer ?? '—'}${r.gateExitByName ? ` • By ${r.gateExitByName}${r.gateExitById ? ` (${r.gateExitById})` : ''}` : ''}</td></tr>
//     <tr><th>Gate Entry • Odometer</th><td>${fmtDT(r.gateEntryAt)} • O ${r.entryOdometer ?? '—'}${r.gateEntryByName ? ` • By ${r.gateEntryByName}${r.gateEntryById ? ` (${r.gateEntryById})` : ''}` : ''}</td></tr>
//     <tr><th>HOD Approval</th><td>${(hod.name || hod.id || hod.at)
//       ? `${hod.name ?? '—'}${hod.id ? ` (${hod.id})` : ''}${hod.at ? ` • ${fmtDT(hod.at)}` : ''}`
//       : '—'}</td></tr>
//   </table>
//   <script>addEventListener('load',()=>setTimeout(()=>{focus();print();},150));</script>
// </body></html>`;
//     printHtmlViaIframe(html);
//   }, []);

//   /* ---------- UI ---------- */
//   return (
//     <div className="flex min-h-screen bg-orange-50">
//       <ManagementSidebar />

//       <main className="p-3 md:p-4 flex-1">
//         <div className="flex items-center justify-between mb-2">
//           <h1 className="text-[14px] md:text-lg font-bold text-orange-900">Pending Approvals</h1>
//           <div className="flex items-center gap-2">
//             <SearchBar
//               value={q}
//               onChange={setQ}
//               placeholder="Search code, applicant, dept, HOD, route, officer, purpose…"
//               className="h-8"
//             />
//             <button
//               type="button"
//               onClick={printPage}
//               className="inline-flex items-center gap-1 px-2.5 h-8 rounded bg-orange-600 text-white hover:bg-orange-700 text-[12px]"
//               title="Print current list"
//             >
//               <Printer size={14} /> Print Page
//             </button>
//           </div>
//         </div>

//         {/* overflow-x-hidden ensures no horizontal scrollbar in the container */}
//         <div className="bg-white rounded-lg border border-orange-200 overflow-x-hidden overflow-y-auto">
//           {/* Hydration-safe colgroup */}
//           <table className="w-full table-fixed text-[8px] leading-tight">
//             <colgroup>{COLS.map((w, i) => <col key={i} style={{ width: w }} />)}</colgroup>

//             <thead className="bg-orange-50">
//               <tr className="text-[9.5px]">
//                 <Th className="px-2 py-1 text-left">RQ ID / Applied</Th>
//                 <Th className="px-2 py-1 text-left">Applicant / Dept</Th>
//                 <Th className="px-2 py-1 text-center">Status</Th>
//                 <Th className="px-2 py-1 text-left">HOD Approved By</Th>
//                 <Th className="px-2 py-1 text-left">Travel</Th>
//                 <Th className="px-2 py-1 text-left">Route</Th>
//                 <Th className="px-2 py-1 text-left">Officer</Th>
//                 <Th className="px-2 py-1 text-left">Purpose / Goods</Th>
//                 <Th className="px-2 py-1 text-center">Actions</Th>
//               </tr>
//             </thead>

//             <tbody className="divide-y">
//               {loading && (
//                 <tr>
//                   <Td colSpan={9} className="px-2 py-6 text-center text-gray-500">
//                     Loading…
//                   </Td>
//                 </tr>
//               )}

//               {!loading && filtered.map((r: any) => {
//                 const off = extractOfficer(r);
//                 const hod = extractHODApprover(r);
//                 const rowKey = String(r?.id ?? r?.requestCode ?? `${r?.employeeId}-${r?.dateOfTravel}-${r?.timeFrom}`);

//                 return (
//                   <tr
//                     key={rowKey}
//                     className="align-top hover:bg-orange-50/40 cursor-pointer"
//                     onClick={() => setView(r)}
//                     onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setView(r); } }}
//                     role="button"
//                     tabIndex={0}
//                     title="Click for full details"
//                   >
//                     {/* RQ / Applied */}
//                     <Td className="px-2 py-1">
//                       <div className="font-semibold text-orange-900 truncate" title={r.requestCode || '—'}>
//                         {r.requestCode || '—'}
//                       </div>
//                       <div className="text-xs text-gray-600 truncate" title={appliedLabel(r)}>
//                         {appliedLabel(r)}
//                       </div>
//                     </Td>

//                     {/* Applicant / Dept */}
//                     <Td className="px-2 py-1">
//                       <div className="truncate" title={`${r.applicantName || '—'} (${r.employeeId || '—'})`}>
//                         <span className="font-medium text-orange-900">{r.applicantName || '—'}</span>{' '}
//                         <span className="text-gray-600 text-xs">({r.employeeId || '—'})</span>
//                       </div>
//                       <div className="text-xs text-gray-700 truncate" title={r.department || '—'}>
//                         {r.department || '—'}
//                       </div>
//                     </Td>

//                     {/* Status (no wrap to avoid overlap) */}
//                     <Td className="px-2 py-1 text-center">
//                       <div className="inline-block truncate max-w-[100px]" title={r.status || 'PENDING MANAGEMENT'}>
//                         {chip(r.status || 'PENDING MANAGEMENT')}
//                       </div>
//                     </Td>

//                     {/* HOD Approved By */}
//                     <Td className="px-2 py-1">
//                       {(hod.name || hod.id) ? (
//                         <div className="truncate max-w-[150px]" title={`${hod.name ?? ''}${hod.id ? ` (${hod.id})` : ''}`}>
//                           {hod.name ?? '—'}{hod.id ? <span className="text-xs text-gray-600"> ({hod.id})</span> : null}
//                         </div>
//                       ) : '—'}
//                     </Td>

//                     {/* Travel */}
//                     <Td className="px-2 py-1">
//                       <div className="truncate" title={r.dateOfTravel || '—'}>{r.dateOfTravel || '—'}</div>
//                       <div className="text-xs text-gray-600 truncate" title={`${r.timeFrom || '—'} – ${r.timeTo || '—'} ${r.overnight ? '(overnight)' : ''}`}>
//                         <span className="font-mono">{r.timeFrom || '—'}</span>–<span className="font-mono">{r.timeTo || '—'}</span> {r.overnight ? '(overnight)' : ''}
//                       </div>
//                     </Td>

//                     {/* Route */}
//                     <Td className="px-2 py-1">
//                       <div className="truncate" title={`${r.fromLocation || '—'} → ${r.toLocation || '—'}`}>
//                         {r.fromLocation || '—'} → {r.toLocation || '—'}
//                       </div>
//                     </Td>

//                     {/* Officer */}
//                     <Td className="px-2 py-1">
//                       {off.withOfficer ? (
//                         <>
//                           <div className="truncate" title={`${off.name ?? '—'}${off.id ? ` (${off.id})` : ''}`}>
//                             {off.name ?? '—'}{off.id ? <span className="text-xs text-gray-600"> ({off.id})</span> : null}
//                           </div>
//                           {off.phone ? (
//                             <div className="text-xs text-gray-700 truncate" title={off.phone}>
//                               {off.phone}
//                             </div>
//                           ) : null}
//                         </>
//                       ) : '—'}
//                     </Td>

//                     {/* Purpose / Goods */}
//                     <Td className="px-2 py-1">
//                       <div className="truncate" title={purposeWithoutOfficer(r)}>{purposeWithoutOfficer(r)}</div>
//                       <div className="text-xs text-gray-700 truncate" title={r.goods || '—'}>{r.goods || '—'}</div>
//                     </Td>

//                     {/* Actions */}
//                     <Td className="px-2 py-1 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
//                       <div className="flex items-center justify-center gap-1.5">
//                         <button
//                           type="button"
//                           className="inline-flex items-center gap-1 px-2 py-[4px] rounded bg-blue-600 text-white hover:bg-blue-700 text-xs"
//                           onClick={() => setSelected(r)}
//                           title="Review / Approve / Reject"
//                         >
//                           <ClipboardCheck size={12} /> Review
//                         </button>
//                         <button
//                           type="button"
//                           className="inline-flex items-center justify-center px-2 py-[4px] rounded bg-orange-600 text-white hover:bg-orange-700 text-xs"
//                           onClick={() => printOne(r)}
//                           title="Print this request"
//                         >
//                           <Printer size={12} />
//                         </button>
//                       </div>
//                     </Td>
//                   </tr>
//                 );
//               })}

//               {!loading && !filtered.length && (
//                 <tr>
//                   <Td colSpan={9} className="px-2 py-6 text-center text-gray-500">
//                     No pending requests
//                   </Td>
//                 </tr>
//               )}
//             </tbody>
//           </table>
//         </div>
//       </main>

//       {/* Review modal */}
//       <ManagementReviewModal
//         open={!!selected}
//         request={selected}
//         onClose={() => setSelected(null)}
//         onApprove={actApprove}
//         onReject={actReject}
//       />

//       {/* Row-click Details modal */}
//       {view
//         ? createPortal(<DetailsModal request={view} onClose={() => setView(null)} />, document.body)
//         : null}
//     </div>
//   );
// }

// /* ========== Details Modal ========== */
// function DetailsModal({ request, onClose }: { request: UsageRequest; onClose: () => void }) {
//   const off = extractOfficer(request as any);
//   const hod = extractHODApprover(request as any);
//   const yn = (b?: boolean) => (b ? 'Yes' : 'No');

//   return (
//     <div className="fixed inset-0 bg-black/40 grid place-items-center z-50 p-3" onClick={onClose} aria-modal role="dialog">
//       <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
//         <div className="flex items-center justify-between px-4 py-2 border-b bg-orange-50">
//           <h3 className="font-bold text-orange-900 text-[13px]">Request • {(request as any).requestCode}</h3>
//           <button className="p-1 rounded hover:bg-orange-100" onClick={onClose} aria-label="Close">
//             <X size={16} />
//           </button>
//         </div>

//         <div className="p-4 text-[12px] leading-tight space-y-3">
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
//             <section>
//               <div className="text-orange-800 font-semibold mb-1">Applicant & Department</div>
//               <div className="truncate">
//                 <span className="font-medium text-orange-900">Applicant Name:</span> {(request as any).applicantName}
//                 <span className="text-gray-600 text-xs"> ({(request as any).employeeId})</span>
//               </div>
//               <div className="truncate"><span className="font-medium">Department:</span> {(request as any).department || '—'}</div>
//             </section>

//             <section>
//               <div className="text-orange-800 font-semibold mb-1">Status</div>
//               <div><b>Status:</b> {(request as any).status || 'PENDING MANAGEMENT'}</div>
//               <div><b>Applied:</b> {appliedLabel(request as any)}</div>
//               <div className="text-xs text-gray-600 mt-1">
//                 Created {fmtDT((request as any).createdAt)}
//                 {(request as any).updatedAt ? ` • Updated ${fmtDT((request as any).updatedAt)}` : ''}
//               </div>
//             </section>

//             <section>
//               <div className="text-orange-800 font-semibold mb-1">Date & Time</div>
//               <div><b>Date of Travel:</b> {(request as any).dateOfTravel}</div>
//               <div><b>Time From:</b> {(request as any).timeFrom || '—'}</div>
//               <div><b>Time To:</b> {(request as any).timeTo || '—'} {(request as any).overnight ? '(overnight)' : ''}</div>
//             </section>

//             <section>
//               <div className="text-orange-800 font-semibold mb-1">Route</div>
//               <div><b>From Location:</b> {(request as any).fromLocation}</div>
//               <div><b>To Location:</b> {(request as any).toLocation}</div>
//             </section>

//             <section className="md:col-span-2 border border-orange-100 rounded-lg p-3">
//               <div className="text-orange-800 font-semibold mb-2">Official Trip Description / Goods</div>
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                 <div className="space-y-2">
//                   <div>
//                     <div className="text-gray-600">Official Trip Description</div>
//                     <div className="text-orange-900 break-words break-all">{purposeWithoutOfficer(request as any)}</div>
//                   </div>
//                   <div>
//                     <div className="text-gray-600">Goods being transported (if any)</div>
//                     <div className="text-orange-800/90 break-words">{(request as any).goods || '—'}</div>
//                   </div>
//                 </div>
//                 <div className="space-y-2">
//                   <div><div className="text-gray-600">Travelling with Officer</div><div>{yn((request as any).travelWithOfficer || off.withOfficer)}</div></div>
//                   <div>
//                     <div className="text-gray-600">Officer</div>
//                     <div className="break-words break-all">
//                       {off.withOfficer ? (<>{off.name || '—'} {off.id ? <span className="text-xs text-gray-600">({off.id})</span> : null}{off.phone ? `, ${off.phone}` : ''}</>) : '—'}
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             </section>

//             {/* Gate / Trip */}
//             <section className="md:col-span-2 border border-orange-100 rounded-lg p-3">
//               <div className="text-orange-800 font-semibold mb-2">Gate / Trip</div>
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
//                 <div>
//                   <div><b>Pickup:</b> {fmtDT((request as any).scheduledPickupAt)}</div>
//                   <div><b>Return:</b> {fmtDT((request as any).scheduledReturnAt)}</div>
//                 </div>
//                 <div>
//                   <div>
//                     <b>Gate Exit:</b> {fmtDT((request as any).gateExitAt)} • <span className="text-xs text-gray-600">O {(request as any).exitOdometer ?? '—'}</span>
//                     {(request as any).gateExitByName ? <> • <span>By {(request as any).gateExitByName}{(request as any).gateExitById ? ` (${(request as any).gateExitById})` : ''}</span></> : null}
//                   </div>
//                   <div>
//                     <b>Gate Entry:</b> {fmtDT((request as any).gateEntryAt)} • <span className="text-xs text-gray-600">O {(request as any).entryOdometer ?? '—'}</span>
//                     {(request as any).gateEntryByName ? <> • <span>By {(request as any).gateEntryByName}{(request as any).gateEntryById ? ` (${(request as any).gateEntryById})` : ''}</span></> : null}
//                   </div>
//                 </div>
//               </div>
//             </section>

//             {/* HOD Approval */}
//             <section className="md:col-span-2 border border-orange-100 rounded-lg p-3">
//               <div className="text-orange-800 font-semibold mb-2">HOD Approval</div>
//               <div>
//                 {(hod.name || hod.id || hod.at)
//                   ? (<>
//                       <b>Approved By:</b> {hod.name ?? '—'}{hod.id ? <> <span className="text-xs text-gray-600">({hod.id})</span></> : null}
//                       {hod.at ? <> • <b>At:</b> {fmtDT(hod.at)}</> : null}
//                     </>)
//                   : '—'}
//               </div>
//             </section>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }
