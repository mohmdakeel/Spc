'use client';

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { listByStatus, listAllRequests } from '../../Transport/services/usageService';
import type { UsageRequest, RequestStatus } from '../../Transport/services/types';
import { Th, Td } from '../../Transport/components/ThTd';
import WorkspaceSearchBar from '../../../../../components/workspace/WorkspaceSearchBar';
import { Printer, X } from 'lucide-react';

/* ---------------- helpers (same style as HOD Pending) ---------------- */
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

const chipRejected = () => (
  <span className="inline-block text-[7px] px-1 py-px rounded bg-red-100 text-red-800 leading-none">
    REJECTED
  </span>
);

const cleanPhone = (p?: string) =>
  (p ?? '')
    .replace(/[^\d+()\-\s./;]/g, '')
    .replace(/^[;,\s-]+/, '')
    .replace(/\s{2,}/g, ' ')
    .trim();

/** Remove “Travelling Officer:” lines + phone/tel tokens from description */
function purposeWithoutOfficer(r: any): string {
  const raw = String(r?.officialDescription ?? '');
  let cleaned = raw
    .split(/\r?\n/)
    .filter(line => !/travell?ing\s+officer\s*:/i.test(line))
    .join('\n')
    .replace(/\b(?:Phone|Tel)\s*:\s*[\+\d()\-\s./;]+/gi, '');
  cleaned = cleaned
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+(,|\.)/g, '$1')
    .replace(/^[\s\-–,:]+/, '')
    .trim();
  return cleaned || '—';
}

/** Officer from explicit fields or parsed from text */
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

/* ---------- column widths (sum 100%) — match HOD Pending ---------- */
const COLS = [
  '12%', // RQ ID / Applied
  '17%', // Applicant / Dept
  '8%',  // Status
  '12%', // Travel
  '15%', // Route
  '13%', // Officer
  '13%', // Purpose / Goods
  '10%', // Actions (print)
] as const;

const REJECTED_STATUSES: RequestStatus[] = ['REJECTED'];

/* ======================= Page ======================= */
export default function ManagementRejectedPage() {
  const [rows, setRows] = useState<UsageRequest[]>([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<UsageRequest | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const buckets = await Promise.all(REJECTED_STATUSES.map((s) => listByStatus(s)));
      let merged = buckets.flat().filter(Boolean) as UsageRequest[];

      if (!merged.length) {
        try {
          const all = await listAllRequests();
          const arr = Array.isArray(all) ? all : (all as any)?.content || [];
          merged = arr.filter((r: any) => String(r?.status || '').toUpperCase() === 'REJECTED');
        } catch {}
      }

      const seen = new Set<string>();
      const unique = merged.filter((r: any) => {
        const key = String(r?.id ?? r?.requestCode ?? '');
        if (!key || seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      unique.sort((a, b) => (Date.parse((b as any)?.updatedAt || (b as any)?.createdAt || '') || 0) - (Date.parse((a as any)?.updatedAt || (a as any)?.createdAt || '') || 0));
      setRows(unique);
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

  /* ---------------- print current table (same columns) ---------------- */
  const printPage = useCallback(() => {
    const rowsHtml = filtered.map((r: any) => {
      const off = extractOfficer(r);
      return `
<tr>
  <td><div class="rq">${r.requestCode || ''}</div><div class="sub">${appliedLabel(r)}</div></td>
  <td>${r.applicantName || ''} <span class="sub">(${r.employeeId || ''})</span><div class="sub">${r.department || ''}</div></td>
  <td class="center">REJECTED</td>
  <td><div>${r.dateOfTravel || ''}</div><div class="sub mono">${r.timeFrom || ''} – ${r.timeTo || ''} ${r.overnight ? '(overnight)' : ''}</div></td>
  <td>${r.fromLocation || ''} → ${r.toLocation || ''}</td>
  <td>${off.withOfficer ? `${off.name || '-'}${off.id ? ` <span class="sub">(${off.id})</span>` : ''}${off.phone ? `, ${off.phone}` : ''}` : '—'}</td>
  <td><div>${purposeWithoutOfficer(r)}</div><div class="sub">${r.goods || '—'}</div></td>
</tr>`;
    }).join('');

    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"/><title>Rejected — Print</title><meta name="viewport" content="width=device-width, initial-scale=1"/>
<style>
:root{--fg:#111;--muted:#666;--head:#faf5f0}*{box-sizing:border-box}
body{margin:0;padding:10mm;font-family:system-ui,Arial,sans-serif;color:var(--fg)}
h3{margin:0 0 8px 0}.meta{margin:4px 0 8px 0;font-size:11px;color:var(--muted)}
table{width:100%;border-collapse:collapse;table-layout:fixed}thead{display:table-header-group}
th,td{border:1px solid #ddd;padding:6px 8px;vertical-align:top;font-size:11px}th{background:var(--head);text-align:left}
.center{text-align:center}.sub{color:var(--muted);font-size:10.5px}.mono{font-family:ui-monospace,Menlo,Consolas,monospace}
.rq{font-weight:600;color:#8b4513}
col.c1{width:12%}col.c2{width:17%}col.c3{width:8%}col.c4{width:12%}col.c5{width:15%}col.c6{width:13%}col.c7{width:13%}
@media print{@page{size:A4 landscape;margin:10mm}body{padding:0}}
</style></head>
<body>
<h3>Rejected Requests</h3>
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

  /* ---------------- print a single row (basic only) ---------------- */
  const printOne = useCallback((r: any) => {
    const off = extractOfficer(r);
    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"/><title>${r.requestCode || 'Request'} — Print</title><meta name="viewport" content="width=device-width, initial-scale=1"/>
<style>*{box-sizing:border-box}body{margin:0;padding:12mm;font-family:system-ui,Arial,sans-serif;color:#111}
h2{margin:0 0 12px 0}.grid{display:grid;grid-template-columns:1fr 1fr;gap:8px 16px;font-size:12px}
.block{margin:8px 0 2px;font-weight:600;color:#8b4513}.sub{color:#666;font-size:11px}
table{width:100%;border-collapse:collapse;margin-top:10px}
th,td{border:1px solid #ddd;padding:6px 8px;font-size:12px;vertical-align:top}
th{background:#faf5f0;text-align:left;width:34%}
@media print{@page{size:A4 portrait;margin:10mm}body{padding:0}}
</style></head>
<body>
  <h2>Transport Request • ${r.requestCode || ''} (REJECTED)</h2>
  <div class="grid">
    <div><div class="block">Applicant</div>${r.applicantName || ''} <span class="sub">(${r.employeeId || ''})</span></div>
    <div><div class="block">Status</div>REJECTED</div>
    <div><div class="block">Department</div>${r.department || ''}</div>
    <div><div class="block">Applied</div>${appliedLabel(r)}</div>
    <div><div class="block">Travel</div>${r.dateOfTravel || ''} • ${r.timeFrom || ''} – ${r.timeTo || ''} ${r.overnight ? '(overnight)' : ''}</div>
    <div><div class="block">Route</div>${r.fromLocation || ''} → ${r.toLocation || ''}</div>
  </div>
  <table>
    <tr><th>Official Trip Description</th><td>${purposeWithoutOfficer(r)}</td></tr>
    <tr><th>Goods being transported (if any)</th><td>${r.goods || '—'}</td></tr>
    <tr><th>Officer</th><td>${off.withOfficer ? `${off.name || '—'}${off.id ? ` (${off.id})` : ''}${off.phone ? `, ${off.phone}` : ''}` : '—'}</td></tr>
  </table>
  <script>addEventListener('load',()=>setTimeout(()=>{focus();print();},150));</script>
</body></html>`;
    printHtmlViaIframe(html);
  }, []);

  /* ---------------- UI ---------------- */
  return (
    <div className="space-y-4 p-3 md:p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-[14px] font-bold text-orange-900">Rejected Requests</h1>
          <p className="text-xs text-gray-500">Requests declined during management review.</p>
        </div>
        <div className="flex items-center gap-2 w-full lg:w-auto">
          <WorkspaceSearchBar
            value={q}
            onChange={setQ}
            placeholder="Search code, applicant, dept, route, officer, purpose…"
            className="w-full lg:w-72 h-10"
          />
          <button
            type="button"
            onClick={printPage}
            className="inline-flex items-center gap-2 px-4 h-10 rounded-lg bg-orange-600 text-white hover:bg-orange-700 text-sm font-semibold shadow-sm"
            title="Print current list"
          >
            <Printer size={16} /> Print Page
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-orange-200 overflow-x-hidden overflow-y-auto">
        {/* hydration-safe colgroup */}
        <table className="w-full table-fixed text-[8px] leading-tight align-top">
          <colgroup>{COLS.map((w, i) => <col key={i} style={{ width: w }} />)}</colgroup>
            <thead className="bg-orange-50 text-[9px] uppercase tracking-wide">
            <tr>
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
                    <Td className="px-2 py-1 text-[10px]">
                      <div className="font-semibold text-orange-900 truncate">{r.requestCode || '—'}</div>
                      <div className="text-[9px] text-gray-600 truncate">{appliedLabel(r)}</div>
                    </Td>

                    {/* Applicant / Dept */}
                    <Td className="px-2 py-1 text-[10px]">
                      <div className="truncate">
                        <span className="font-medium text-orange-900">{r.applicantName || '—'}</span>{' '}
                        <span className="text-gray-600 text-[9px]">({r.employeeId || '—'})</span>
                      </div>
                      <div className="text-[9px] text-gray-700 truncate">{r.department || '—'}</div>
                    </Td>

                    {/* Status */}
                    <Td className="px-2 py-1 text-center">{chipRejected()}</Td>

                    {/* Travel */}
                    <Td className="px-2 py-1 text-[10px]">
                      <div className="truncate">{r.dateOfTravel || '—'}</div>
                      <div className="text-[9px] text-gray-600 truncate">
                        <span className="font-mono">{r.timeFrom || '—'}</span>–<span className="font-mono">{r.timeTo || '—'}</span> {r.overnight ? '(overnight)' : ''}
                      </div>
                    </Td>

                    {/* Route */}
                    <Td className="px-2 py-1 text-[10px]">
                      <div className="truncate">{r.fromLocation || '—'} → {r.toLocation || '—'}</div>
                    </Td>

                    {/* Officer */}
                    <Td className="px-2 py-1 text-[10px]">
                      {off.withOfficer ? (
                        <>
                          <div className="truncate">
                            {off.name ?? '—'}{off.id ? <span className="text-[9px] text-gray-600"> ({off.id})</span> : null}
                          </div>
                          {off.phone ? <div className="text-[9px] text-gray-700 truncate">{off.phone}</div> : null}
                        </>
                      ) : '—'}
                    </Td>

                    {/* Purpose / Goods */}
                    <Td className="px-2 py-1 text-[10px]">
                      <div className="truncate text-[9px] leading-tight">{purposeWithoutOfficer(r)}</div>
                      <div className="text-[9px] text-gray-700 truncate">{r.goods || '—'}</div>
                    </Td>

                    {/* Actions */}
                    <Td className="px-2 py-1 text-center" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        className="inline-flex items-center justify-center px-2 py-[4px] rounded bg-orange-600 text-white hover:bg-orange-700 text-xs"
                        title="Print this request"
                        onClick={() => printOne(r)}
                      >
                        <Printer size={12} />
                      </button>
                    </Td>
                  </tr>
                );
              })}

              {!loading && !filtered.length && (
                <tr>
                  <Td colSpan={8} className="px-2 py-6 text-center text-gray-500">No rejected requests</Td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      {/* Details modal — basic only */}
      {view
        ? createPortal(<DetailsModal request={view} onClose={() => setView(null)} />, document.body)
        : null}
    </div>
  );
}

/* ================= Details Modal (basic like Pending) ================= */
function DetailsModal({ request, onClose }: { request: UsageRequest; onClose: () => void }) {
  const off = extractOfficer(request as any);
  const yn = (b?: boolean) => (b ? 'Yes' : 'No');

  return (
    <div className="fixed inset-0 bg-black/40 grid place-items-center z-50 p-3" onClick={onClose} role="dialog" aria-modal="true">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-2 border-b bg-orange-50">
          <h3 className="font-bold text-orange-900 text-[12px]">Request • {(request as any).requestCode}</h3>
          <button className="p-1 rounded hover:bg-orange-100" onClick={onClose} aria-label="Close">
            <X size={14} />
          </button>
        </div>

        <div className="p-4 text-[10.5px] leading-tight space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <section>
              <div className="text-orange-800 font-semibold mb-1">Applicant & Department</div>
              <div className="truncate">
                <span className="font-medium text-orange-900">Applicant:</span> {(request as any).applicantName}
                <span className="text-gray-600 text-xs"> ({(request as any).employeeId})</span>
              </div>
              <div className="truncate"><span className="font-medium">Department:</span> {(request as any).department || '—'}</div>
            </section>

            <section>
              <div className="text-orange-800 font-semibold mb-1">Status</div>
              <div><b>Status:</b> REJECTED</div>
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
                    <div className="text-orange-900 break-words">{purposeWithoutOfficer(request as any)}</div>
                  </div>
                  <div>
                    <div className="text-gray-600">Goods being transported (if any)</div>
                    <div className="text-orange-800/90 break-words">{(request as any).goods || '—'}</div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div><div className="text-gray-600">Travelling with Officer</div>{yn((request as any).travelWithOfficer || off.withOfficer)}</div>
                  <div>
                    <div className="text-gray-600">Officer</div>
                    <div className="break-words">
                      {off.withOfficer ? (<>{off.name || '—'} {off.id ? <span className="text-xs text-gray-600">({off.id})</span> : null}{off.phone ? `, ${off.phone}` : ''}</>) : '—'}
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );  
}
