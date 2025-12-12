'use client';

/** PENDING APPROVALS (HOD) — aligned with Applicant table
 * - Columns/order/names: RQ ID / Applied • Applicant / Dept • Status • Travel • Route • Officer • Purpose / Goods • Actions
 * - Row click opens Details modal (no "Details" button)
 * - Purpose / Goods visible in table + print page + print single row
 * - Officer shown as "Name (ID), Phone" (sanitized)
 * - Hydration-safe <colgroup> via map()
 * - SMALL TWEAKS: Actions column widened; Officer/Purpose reduced 1% each. Review button now has an icon.
 */

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { listByStatus, hodApprove, hodReject } from '../../Transport/services/usageService';
import type { UsageRequest } from '../../Transport/services/types';
import { Th, Td } from '../../Transport/components/ThTd';
import ReviewModal from '../components/ReviewModal';
import HODSearchBar from '../components/HODSearchBar';
import { toast } from 'react-toastify';
import { Printer, X, ClipboardCheck, RefreshCw } from 'lucide-react';
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

/* ---- phone sanitizer ---- */
const cleanPhone = (p?: string) =>
  (p ?? '')
    .replace(/[^\d+()\-\s./;]/g, '')   // allow digits + () - / . ; and spaces
    .replace(/^[;,\s-]+/, '')          // trim odd leading punctuation
    .replace(/\s{2,}/g, ' ')
    .trim();

/** Strip any "Travelling Officer: ..." line(s) and trailing phone/tel fragments */
function purposeWithoutOfficer(r: any): string {
  const raw = String(r?.officialDescription ?? '');

  // Remove lines with "Travelling Officer:"
  let cleaned = raw
    .split(/\r?\n/)
    .filter(line => !/travell?ing\s+officer\s*:/i.test(line))
    .join('\n');

  // Remove leftover Phone/Tel tokens
  cleaned = cleaned.replace(/\b(?:Phone|Tel)\s*:\s*[\+\d()\-\s./;]+/gi, '');

  // Neaten spaces/punctuation
  cleaned = cleaned
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+(,|\.)/g, '$1')
    .replace(/^[\s\-–,:]+/, '')
    .trim();

  return cleaned || '—';
}

/** Resolve officer from explicit fields or from the description text */
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

/* ---------- column widths — tweak to fit icon + text in Actions ---------- */
const COLS = [
  '12%', // RQ ID / Applied
  '17%', // Applicant / Dept
  '8%', // Status
  '12%', // Travel
  '15%', // Route
  '13%', // Officer (reduced by 1%)
  '13%', // Purpose / Goods (reduced by 1%)
  '10%',  // Actions (widened for icon + text)
] as const;

/* ======================= Page ======================= */
export default function HODPendingPage() {
  const [rows, setRows] = useState<UsageRequest[]>([]);
  const [q, setQ] = useState('');
  const [selected, setSelected] = useState<UsageRequest | null>(null); // Review modal
  const [view, setView] = useState<UsageRequest | null>(null);         // Details modal
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await listByStatus('PENDING_HOD');
      setRows(list || []);
    } catch (err: any) {
      console.warn('Failed to load pending HOD list', err);
      setError(err?.message || 'Unable to load pending requests right now.');
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
      return [
        r?.requestCode, r?.status, r?.applicantName, r?.employeeId, r?.department,
        r?.fromLocation, r?.toLocation, r?.dateOfTravel, r?.timeFrom, r?.timeTo,
        r?.officialDescription, r?.goods, off.name, off.id, off.phone, appliedLabel(r),
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
      await hodApprove(selected.id, remarks);
      toast?.success?.('Approved & sent to Management');
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
      await hodReject(selected.id, remarks);
      toast?.success?.('Request rejected');
      setSelected(null);
      load();
    } catch (e: any) {
      toast?.error?.(e?.message || 'Failed to reject');
    }
  };

  /* ---------- PRINT: page (match Applicant columns, incl. Purpose / Goods) ---------- */
  const printPage = useCallback(() => {
    const rowsHtml = filtered.map((r: any) => {
      const off = extractOfficer(r);
      return `
<tr>
  <td><div class="rq">${r.requestCode || ''}</div><div class="sub">${appliedLabel(r)}</div></td>
  <td>${r.applicantName || ''} <span class="sub">(${r.employeeId || ''})</span><div class="sub">${r.department || ''}</div></td>
  <td class="center">${r.status || ''}</td>
  <td><div>${r.dateOfTravel || ''}</div><div class="sub mono">${r.timeFrom || ''} – ${r.timeTo || ''} ${r.overnight ? '(overnight)' : ''}</div></td>
  <td>${r.fromLocation || ''} → ${r.toLocation || ''}</td>
  <td>${off.withOfficer ? `${off.name || '-'}${off.id ? ` <span class="sub">(${off.id})</span>` : ''}${off.phone ? `, ${off.phone}` : ''}` : '—'}</td>
  <td><div>${purposeWithoutOfficer(r)}</div><div class="sub">${r.goods || '—'}</div></td>
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
.center{text-align:center}.sub{color:var(--muted);font-size:10.5px}.mono{font-family:ui-monospace,Menlo,Consolas,monospace}
.rq{font-weight:600;color:#8b4513}
col.c1{width:12%}col.c2{width:17%}col.c3{width:10%}col.c4{width:12%}col.c5{width:15%}col.c6{width:14%}col.c7{width:14%}
@media print{@page{size:A4 landscape;margin:10mm}body{padding:0}}
</style></head>
<body>
<h3>Pending Approvals — HOD</h3>
<div class="meta">Results: ${filtered.length}</div>
<table>
  <colgroup><col class="c1"/><col class="c2"/><col class="c3"/><col class="c4"/><col class="c5"/><col class="c6"/><col class="c7"/></colgroup>
  <thead><tr>
    <th>RQ ID / Applied</th>
    <th>Applicant / Dept</th>
    <th class="center">Status</th>
    <th>Travel</th>
    <th>Route</th>
    <th>Officer</th>
    <th>Purpose / Goods</th>
  </tr></thead>
  <tbody>${rowsHtml || '<tr><td colspan="7">No data</td></tr>'}</tbody>
</table>
<script>addEventListener('load',()=>setTimeout(()=>{focus();print();},150));</script>
</body></html>`;
    printHtmlViaIframe(html);
  }, [filtered]);

  /* ---------- PRINT: single row (includes Purpose & Goods) ---------- */
  const printOne = useCallback((r: any) => {
    const off = extractOfficer(r);
    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"/><title>${r.requestCode || 'Request'} — Print</title><meta name="viewport" content="width=device-width, initial-scale=1"/>
<style>*{box-sizing:border-box}body{margin:0;padding:12mm;font-family:system-ui,Arial,sans-serif;color:#111}
h2{margin:0 0 12px 0}.grid{display:grid;grid-template-columns:1fr 1fr;gap:8px 16px;font-size:12px}
.block{margin:8px 0 2px;font-weight:600;color:#8b4513}.sub{color:#666;font-size:11px}
table{width:100%;border-collapse:collapse;margin-top:10px}th,td{border:1px solid #ddd;padding:6px 8px;font-size:12px;vertical-align:top}
th{background:#faf5f0;text-align:left;width:34%}@media print{@page{size:A4 portrait;margin:10mm}body{padding:0}}</style></head>
<body>
  <h2>Transport Request • ${r.requestCode || ''}</h2>
  <div class="grid">
    <div><div class="block">Applicant</div>${r.applicantName || ''} <span class="sub">(${r.employeeId || ''})</span></div>
    <div><div class="block">Status</div>${r.status || ''}</div>
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
    <tr><th>Gate Exit • Odometer</th><td>${fmtDT(r.gateExitAt)} • O ${r.exitOdometer ?? '—'}</td></tr>
    <tr><th>Gate Entry • Odometer</th><td>${fmtDT(r.gateEntryAt)} • O ${r.entryOdometer ?? '—'}</td></tr>
  </table>
  <script>addEventListener('load',()=>setTimeout(()=>{focus();print();},150));</script>
</body></html>`;
    printHtmlViaIframe(html);
  }, []);

  /* ---------- UI ---------- */
  return (
    <>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-2">
          <h1 className="text-[14px] md:text-lg font-bold text-orange-900">Pending Approvals</h1>
          <div className="flex flex-col gap-2 w-full md:w-auto md:flex-row md:items-center">
            <HODSearchBar
              value={q}
              onChange={setQ}
              placeholder="Search code, applicant, dept, route…"
              className="w-full md:w-72"
            />
            <button
              type="button"
              onClick={load}
              disabled={loading}
              className="inline-flex items-center justify-center gap-1 px-3 h-11 md:h-10 rounded-lg border border-orange-200 text-orange-800 hover:bg-orange-50 text-xs font-semibold disabled:opacity-60"
              title="Refresh from server"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
            </button>
            <button
              type="button"
              onClick={printPage}
              className="inline-flex items-center justify-center gap-1 px-3 h-11 md:h-10 rounded-lg bg-orange-600 text-white hover:bg-orange-700 text-xs font-semibold"
              title="Print current list"
            >
              <Printer size={14} /> Print
            </button>
          </div>
        </div>

      <div className="bg-white rounded-lg border border-orange-200 overflow-auto">
        {/* Hydration-safe colgroup */}
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
                <Td colSpan={8} className="px-2 py-6 text-center text-gray-500">
                  Loading…
                </Td>
              </tr>
            )}

            {!loading && !error && filtered.map((r: any) => {
              const off = extractOfficer(r);
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
                  <Td className="px-2 py-1 whitespace-normal">
                    <div className="font-semibold text-orange-900 truncate">{r.requestCode || '—'}</div>
                    <div className="text-[9px] text-gray-600 truncate">{appliedLabel(r)}</div>
                  </Td>

                  {/* Applicant / Dept */}
                  <Td className="px-2 py-1 whitespace-normal">
                    <div className="truncate">
                      <span className="font-medium text-orange-900">{r.applicantName || '—'}</span>{' '}
                      <span className="text-gray-600 text-[9px]">({r.employeeId || '—'})</span>
                    </div>
                    <div className="text-[9px] text-gray-700 truncate">{r.department || '—'}</div>
                  </Td>

                  {/* Status */}
                  <Td className="px-2 py-1 text-center">{chip(r.status)}</Td>

                  {/* Travel */}
                  <Td className="px-2 py-1 whitespace-normal">
                    <div className="truncate">{r.dateOfTravel || '—'}</div>
                    <div className="text-[9px] text-gray-600">
                      <span className="font-mono">{r.timeFrom || '—'}</span>–<span className="font-mono">{r.timeTo || '—'}</span> {r.overnight ? '(overnight)' : ''}
                    </div>
                  </Td>

                  {/* Route */}
                  <Td className="px-2 py-1 whitespace-normal">
                    <div className="truncate">{r.fromLocation || '—'} → {r.toLocation || '—'}</div>
                  </Td>

                  {/* Officer */}
                  <Td className="px-2 py-1 whitespace-normal">
                    {off.withOfficer ? (
                      <>
                        <div className="truncate">
                          {off.name ?? '—'}{off.id ? <span className="text-[9px] text-gray-600"> ({off.id})</span> : null}
                        </div>
                        {off.phone ? <div className="text-[9px] text-gray-700 break-all">{off.phone}</div> : null}
                      </>
                    ) : '—'}
                  </Td>

                  {/* Purpose / Goods */}
                  <Td className="px-2 py-1 whitespace-normal">
                    <div className="break-words break-all">{purposeWithoutOfficer(r)}</div>
                    <div className="text-[9px] text-gray-700">{r.goods || '—'}</div>
                  </Td>

                  {/* Actions */}
                  <Td className="px-2 py-1 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 px-2 py-[4px] rounded bg-blue-600 text-white hover:bg-blue-700 text-[10px]"
                        onClick={() => setSelected(r)}
                        title="Review / Approve / Reject"
                      >
                        <ClipboardCheck size={12} /> Review
                      </button>
                      <button
                        type="button"
                        className="inline-flex items-center justify-center px-2 py-[4px] rounded bg-orange-600 text-white hover:bg-orange-700 text-[10px]"
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

            {!loading && !error && !filtered.length && (
              <tr>
                <Td colSpan={8} className="px-2 py-6 text-center text-gray-500">
                  No pending requests
                </Td>
              </tr>
            )}
            {!loading && error && (
              <tr>
                <Td colSpan={8} className="px-2 py-6 text-center text-red-600 text-[12px]">
                  {error}
                </Td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Approve/Reject modal */}
      <ReviewModal
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
    </>
  );
}

/* ========== Details Modal (row click) ========== */
function DetailsModal({ request, onClose }: { request: UsageRequest; onClose: () => void }) {
  const off = extractOfficer(request as any);
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
                <span className="text-gray-600 text-[11px]"> ({(request as any).employeeId})</span>
              </div>
              <div className="truncate"><span className="font-medium">Department:</span> {(request as any).department || '—'}</div>
            </section>

            <section>
              <div className="text-orange-800 font-semibold mb-1">Status</div>
              <div><b>Status:</b> {(request as any).status}</div>
              <div><b>Applied:</b> {appliedLabel(request as any)}</div>
              <div className="text-[11px] text-gray-600 mt-1">
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
                      {off.withOfficer ? (<>{off.name || '—'} {off.id ? <span className="text-[11px] text-gray-600">({off.id})</span> : null}{off.phone ? `, ${off.phone}` : ''}</>) : '—'}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="md:col-span-2">
              <div className="text-orange-800 font-semibold mb-1">Gate / Trip</div>
              <div><b>Pickup:</b> {fmtDT((request as any).scheduledPickupAt)} • <b>Return:</b> {fmtDT((request as any).scheduledReturnAt)}</div>
              <div><b>Exit:</b> {fmtDT((request as any).gateExitAt)} • <span className="text-[11px] text-gray-600">O {(request as any).exitOdometer ?? '—'}</span></div>
              <div><b>Entry:</b> {fmtDT((request as any).gateEntryAt)} • <span className="text-[11px] text-gray-600">O {(request as any).entryOdometer ?? '—'}</span></div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
