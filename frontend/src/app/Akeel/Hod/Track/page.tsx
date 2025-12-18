'use client';

import * as React from 'react';
import type { UsageRequest, RequestStatus } from '../../Transport/services/types';
import { listByStatus, listAllRequests } from '../../Transport/services/usageService';
import { Th, Td } from '../../Transport/components/ThTd';
import { Printer, X } from 'lucide-react';
import HODSearchBar from '../components/HODSearchBar';

/* ---------------- helpers (same look & feel as applicant page) ---------------- */
const fmtDT = (s?: string | null) => (s ? new Date(s).toLocaleString() : '—');

const appliedLabel = (r: any) => {
  const d = r?.appliedDate || r?.applied_on || r?.appliedOn;
  const t = r?.appliedTime || r?.applied_time;
  if (d && t) return `${d} ${t}`;
  if (d && r?.createdAt) {
    const tt = new Date(r.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return `${d} ${tt}`;
  }
  if (r?.createdAt) return fmtDT(r.createdAt);
  return '—';
};

/** accept both arrays and paged objects */
function toArray(maybe: any): any[] {
  if (Array.isArray(maybe)) return maybe;
  if (maybe && Array.isArray(maybe.content)) return maybe.content;
  if (maybe && Array.isArray(maybe.items)) return maybe.items;
  return [];
}

/** statuses that indicate "HOD has approved / moved forward" (include later states too) */
const POST_HOD_STATUSES: RequestStatus[] = [
  'PENDING_MANAGEMENT',
  'APPROVED',
  'SCHEDULED',
  'DISPATCHED',
  'RETURNED',
];
const STATUS_VARIANTS = ['PENDING MANAGMENT', 'SENT_TO_MANAGEMENT']; // legacy spellings/labels
const ALLOWED = new Set<string>([
  ...POST_HOD_STATUSES,
  ...STATUS_VARIANTS,
  'ASSIGNED',   // kept for backward compatibility (older data)
  'COMPLETED',  // kept for backward compatibility (older data)
]);

/* readable + non-overflowing status chip */
function chipStatus(raw?: string) {
  const s = (raw || '—').toUpperCase().trim();
  const base =
    'inline-flex items-center justify-center px-2 py-[3px] rounded leading-[1.05] text-[11px] ' +
    'whitespace-normal break-words max-w-[8.75rem]'; // ~140px; wraps nicely in 12% column

  const orange = 'bg-orange-100 text-orange-800';
  const green = 'bg-green-100 text-green-800';
  const red   = 'bg-red-100 text-red-800';

  let cls = orange;
  let label = s.replaceAll('_', ' ');

  if (s === 'PENDING_MANAGEMENT' || s === 'PENDING MANAGMENT' || s === 'SENT_TO_MANAGEMENT') {
    cls = orange;
    if (s.startsWith('PENDING')) label = 'PENDING MGMT';
    if (s.startsWith('SENT'))    label = 'SENT TO MGMT';
  } else if (s === 'APPROVED' || s === 'ASSIGNED' || s === 'COMPLETED' || s === 'SCHEDULED' || s === 'DISPATCHED' || s === 'RETURNED') {
    cls = green;
  } else if (s === 'REJECTED') {
    cls = red;
  }

  return <span className={`${base} ${cls}`}>{label || '—'}</span>;
}

/* print helper (iframe, no new tab) */
function printHtmlViaIframe(html: string) {
  const iframe = document.createElement('iframe');
  Object.assign(iframe.style, { position: 'fixed', right: '0', bottom: '0', width: '0', height: '0', border: '0' } as CSSStyleDeclaration);
  document.body.appendChild(iframe);
  const doc = iframe.contentWindow?.document;
  if (!doc) { document.body.removeChild(iframe); return; }
  doc.open(); doc.write(html); doc.close();
  iframe.onload = () => {
    try { iframe.contentWindow?.focus(); iframe.contentWindow?.print(); } catch {}
    setTimeout(() => { try { document.body.removeChild(iframe); } catch {} }, 1200);
  };
}

/* ======================= Page ======================= */
export default function HODTrackPage() {
  const [baseItems, setBaseItems] = React.useState<UsageRequest[]>([]);
  const [items, setItems] = React.useState<UsageRequest[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [q, setQ] = React.useState('');
  const [view, setView] = React.useState<UsageRequest | null>(null);
  const [lookup, setLookup] = React.useState('');
  const [lookupMessage, setLookupMessage] = React.useState<string | null>(null);

  // widen Status to 12% so long labels don’t crowd neighbors
  const COLS = React.useMemo(() => ['15%','12%','22%','21%','24%','6%'], []);

  const normalizeItems = React.useCallback((merged: any[], enforceAllowed = true) => {
    const seen = new Set<string>();
    const filtered = merged.filter((r: any) => {
      const k = String(r?.id ?? r?.requestCode ?? '');
      if (!k || seen.has(k)) return false;
      seen.add(k);
      if (enforceAllowed && !ALLOWED.has(String(r?.status || '').toUpperCase())) return false;
      return true;
    });
    filtered.sort((a: any, b: any) => (Date.parse(b?.createdAt || '') || 0) - (Date.parse(a?.createdAt || '') || 0));
    return filtered;
  }, []);

  React.useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const statuses: Array<RequestStatus | string> = [
          ...POST_HOD_STATUSES,
          ...STATUS_VARIANTS,
          'ASSIGNED',   // compatibility
          'COMPLETED',  // compatibility
        ];
        const buckets: any[][] = [];
        for (const st of statuses) {
          try {
            const res = await listByStatus(st as any);
            buckets.push(toArray(res));
          } catch {}
        }
        let merged: any[] = buckets.flat();

        if (!merged.length) {
          try {
            const all = toArray(await listAllRequests());
            merged = all.filter((r: any) => ALLOWED.has(String(r?.status || '').toUpperCase()));
          } catch {}
        }

        const normalized = normalizeItems(merged, true);
        setBaseItems(normalized);
        setItems(normalized);
      } finally {
        setLoading(false);
      }
    })();
  }, [normalizeItems]);

  React.useEffect(() => {
    if (!lookup) {
      setItems(baseItems);
      setLookupMessage(null);
    }
  }, [lookup, baseItems]);

  const list = React.useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return items;
    return items.filter((r: any) =>
      [
        r.requestCode, r.status,
        r.assignedVehicleNumber, r.assignedDriverName, r.assignedDriverPhone,
        r.scheduledPickupAt, r.scheduledReturnAt,
        r.gateExitAt, r.gateEntryAt, r.exitOdometer, r.entryOdometer,
        appliedLabel(r),
      ].map(x => (x ?? '').toString().toLowerCase()).join(' ').includes(s)
    );
  }, [items, q]);

  /* -------------------- PRINT HELPERS (match applicant page) -------------------- */
  const printAllCurrent = React.useCallback(() => {
    const rowsHtml = list.map((r: any) => `
<tr>
  <td><div class="rq">${r.requestCode || ''}</div><div class="sub">${appliedLabel(r)}</div></td>
  <td class="center">${r.status || ''}</td>
  <td><div>${r.assignedVehicleNumber || '—'}</div><div class="sub">${r.assignedDriverName || '—'}${r.assignedDriverPhone ? ` (${r.assignedDriverPhone})` : ''}</div></td>
  <td><div>P: ${fmtDT(r.scheduledPickupAt)}</div><div class="sub">R: ${fmtDT(r.scheduledReturnAt)}</div></td>
  <td><div>Ex ${fmtDT(r.gateExitAt)} <span class="sub">• O ${r.exitOdometer ?? '—'}</span></div><div>En ${fmtDT(r.gateEntryAt)} <span class="sub">• O ${r.entryOdometer ?? '—'}</span></div></td>
</tr>`).join('');

    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"/><title>Track Requests - Print</title><meta name="viewport" content="width=device-width, initial-scale=1"/>
<style>
:root{--fg:#111;--muted:#666;--head:#faf5f0}*{box-sizing:border-box}body{margin:0;padding:10mm;font-family:system-ui,Arial,sans-serif;color:var(--fg)}
h3{margin:0 0 8px 0}.meta{margin:4px 0 8px 0;font-size:12px;color:var(--muted)}
table{width:100%;border-collapse:collapse;table-layout:fixed}thead{display:table-header-group}
th,td{border:1px solid #ddd;padding:6px 8px;vertical-align:top;font-size:12px}th{background:var(--head);text-align:left}
.center{text-align:center}.sub{color:var(--muted);font-size:11px}.rq{font-weight:600;color:#8b4513}
col.c1{width:15%}col.c2{width:12%}col.c3{width:22%}col.c4{width:21%}col.c5{width:24%}
@media print{@page{size:A4 landscape;margin:8mm}body{padding:0}}
</style></head>
<body>
  <h3>Track Request — HOD (Approved only)</h3>
  <div class="meta">Results: ${list.length}</div>
  <table>
    <colgroup><col class="c1"/><col class="c2"/><col class="c3"/><col class="c4"/><col class="c5"/></colgroup>
    <thead><tr><th>RQ ID / Applied</th><th class="center">Status</th><th>Assigned</th><th>Schedule</th><th>Gate</th></tr></thead>
    <tbody>${rowsHtml || '<tr><td colspan="5">No data</td></tr>'}</tbody>
  </table>
  <script>addEventListener('load',()=>setTimeout(()=>{focus();print();},150));</script>
</body></html>`;
    printHtmlViaIframe(html);
  }, [list]);

  const printOne = React.useCallback((r: any) => {
    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"/><title>${r.requestCode || 'Request'} - Print</title><meta name="viewport" content="width=device-width, initial-scale=1"/>
<style>*{box-sizing:border-box}body{margin:0;padding:12mm;font-family:system-ui,Arial,sans-serif;color:#111}
h2{margin:0 0 12px 0}table{width:100%;border-collapse:collapse;margin-top:10px}
th,td{border:1px solid #ddd;padding:6px 8px;font-size:12px;vertical-align:top}th{background:#faf5f0;text-align:left;width:34%}
@media print{@page{size:A4 portrait;margin:10mm}body{padding:0}}</style></head>
<body>
  <h2>Transport Request • ${r.requestCode || ''}</h2>
  <table>
    <tr><th>Status</th><td>${r.status || '—'}</td></tr>
    <tr><th>Assigned</th><td>${r.assignedVehicleNumber || '—'} / ${r.assignedDriverName || '—'}${r.assignedDriverPhone ? ` (${r.assignedDriverPhone})` : ''}</td></tr>
    <tr><th>Pickup</th><td>${fmtDT(r.scheduledPickupAt)}</td></tr>
    <tr><th>Return</th><td>${fmtDT(r.scheduledReturnAt)}</td></tr>
    <tr><th>Gate Exit • Odometer</th><td>${fmtDT(r.gateExitAt)} • O ${r.exitOdometer ?? '—'}</td></tr>
    <tr><th>Gate Entry • Odometer</th><td>${fmtDT(r.gateEntryAt)} • O ${r.entryOdometer ?? '—'}</td></tr>
  </table>
  <script>addEventListener('load',()=>setTimeout(()=>{focus();print();},150));</script>
</body></html>`;
    printHtmlViaIframe(html);
  }, []);

  const handleLookup = React.useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault();
    const code = lookup.trim();
    if (!code) {
      setItems(baseItems);
      setLookupMessage(null);
      return;
    }
    setLoading(true);
    setLookupMessage(null);
    try {
      const all = await listAllRequests();
      const dataset = toArray(all);
      const matches = dataset.filter((r: any) =>
        String(r?.requestCode || '')
          .toLowerCase()
          .includes(code.toLowerCase())
      );
      if (matches.length) {
        const normalized = normalizeItems(matches, false);
        setItems(normalized);
        setLookupMessage(`Showing ${normalized.length} match${normalized.length > 1 ? 'es' : ''}`);
      } else {
        setLookupMessage('No requests found for that ID');
      }
    } catch {
      setLookupMessage('Unable to fetch requests right now');
    } finally {
      setLoading(false);
    }
  }, [lookup, baseItems, normalizeItems]);

  const resetLookup = React.useCallback(() => {
    setLookup('');
    setLookupMessage(null);
    setItems(baseItems);
  }, [baseItems]);

  return (
    <>
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-3">
        <h1 className="text-sm md:text-base font-semibold text-orange-900">Track Request (HOD — Approved only)</h1>
        <div className="flex flex-col gap-2 w-full md:w-auto md:flex-row md:items-center">
          <HODSearchBar
            value={q}
            onChange={setQ}
            placeholder="Search by code, vehicle, driver…"
            className="w-full md:w-72"
          />
          <button
            type="button"
            onClick={printAllCurrent}
            className="inline-flex items-center justify-center gap-1 px-3 h-11 md:h-10 rounded-lg bg-orange-600 text-white hover:bg-orange-700 text-xs font-semibold"
            title="Print all (current filter)"
          >
            <Printer size={14} /> Print
          </button>
        </div>
      </div>

      <form onSubmit={handleLookup} className="flex flex-col gap-2 md:flex-row md:items-center md:gap-3 mb-4">
        <HODSearchBar
          value={lookup}
          onChange={setLookup}
          placeholder="Quick lookup by Request ID / Code"
          className="w-full md:w-80"
        />
        <div className="flex gap-2">
          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-lg border border-orange-300 px-4 py-2 text-sm font-semibold text-orange-700 hover:bg-orange-50"
          >
            Track ID
          </button>
          {lookup && (
            <button
              type="button"
              onClick={resetLookup}
              className="inline-flex items-center justify-center rounded-lg border border-orange-200 px-4 py-2 text-sm text-orange-700 hover:bg-orange-50"
            >
              Reset
            </button>
          )}
        </div>
        {lookupMessage && <p className="text-xs text-gray-600 md:ml-3">{lookupMessage}</p>}
      </form>

        <div className="bg-white rounded-md border border-orange-200">
          <table className="w-full table-fixed text-[12.5px] leading-[1.25]">
            <colgroup>{COLS.map((w, i) => <col key={i} style={{ width: w }} />)}</colgroup>
            <thead className="bg-orange-50">
              <tr className="text-[12px]">
                <Th className="px-2 py-1 text-left">RQ ID / Applied</Th>
                <Th className="px-2 py-1 text-center">Status</Th>
                <Th className="px-2 py-1 text-left">Assigned</Th>
                <Th className="px-2 py-1 text-left">Schedule</Th>
                <Th className="px-2 py-1 text-left">Gate</Th>
                <Th className="px-2 py-1 text-center">Print</Th>
              </tr>
            </thead>

            <tbody className="divide-y">
              {loading && (<tr><Td colSpan={6} className="px-2 py-6 text-center text-gray-500">Loading…</Td></tr>)}

              {!loading && list.map((r: any) => (
                <tr
                  key={String(r?.id ?? r?.requestCode)}
                  className="align-top hover:bg-orange-50/40 cursor-pointer"
                  onClick={() => setView(r)}
                  title="Click to view row details"
                >
                  {/* RQ / Applied */}
                  <Td className="px-2 py-1 whitespace-normal break-words">
                    <div className="font-semibold text-orange-900">{r.requestCode || '—'}</div>
                    <div className="text-[11px] text-gray-600">{appliedLabel(r)}</div>
                  </Td>

                  {/* Status — wrapped chip, centered; no overflow */}
                  <Td className="px-2 py-1 text-center align-top">
                    <div className="flex items-start justify-center min-w-0">{chipStatus(r.status)}</div>
                  </Td>

                  {/* Assigned */}
                  <Td className="px-2 py-1 whitespace-normal break-words">
                    <div>{r.assignedVehicleNumber || '—'}</div>
                    <div className="text-[11px] text-gray-700">
                      {r.assignedDriverName || '—'}{r.assignedDriverPhone ? ` (${r.assignedDriverPhone})` : ''}
                    </div>
                  </Td>

                  {/* Schedule */}
                  <Td className="px-2 py-1 whitespace-normal break-words">
                    <div>P: {fmtDT(r.scheduledPickupAt)}</div>
                    <div className="text-[11px] text-gray-700">R: {fmtDT(r.scheduledReturnAt)}</div>
                  </Td>

                  {/* Gate */}
                  <Td className="px-2 py-1 whitespace-normal break-words">
                    <div>Ex {fmtDT(r.gateExitAt)} <span className="text-[11px] text-gray-600">• O {r.exitOdometer ?? '—'}</span></div>
                    <div>En {fmtDT(r.gateEntryAt)} <span className="text-[11px] text-gray-600">• O {r.entryOdometer ?? '—'}</span></div>
                  </Td>

                  {/* Print */}
                  <Td className="px-2 py-1 text-center" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      className="inline-flex items-center justify-center w-7 h-7 rounded bg-orange-600 text-white hover:bg-orange-700"
                      title="Print this row"
                      onClick={() => printOne(r)}
                    >
                      <Printer size={13} />
                    </button>
                  </Td>
                </tr>
              ))}

              {!loading && !list.length && (<tr><Td colSpan={6} className="px-2 py-6 text-center text-gray-500">No requests found.</Td></tr>)}
            </tbody>
          </table>
        </div>

      {view && <DetailsModal request={view} onClose={() => setView(null)} />}
    </>
  );
}

/* ---------------- Details Modal (same structure as applicant page) ---------------- */
function DetailsModal({ request, onClose }: { request: UsageRequest; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/40 grid place-items-center z-50 p-3" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-2 border-b bg-orange-50">
          <h3 className="font-bold text-orange-900 text-[13px]">Request • {(request as any).requestCode}</h3>
          <button className="p-1 rounded hover:bg-orange-100" onClick={onClose} aria-label="Close"><X size={16} /></button>
        </div>

        <div className="p-4 text-[12px] leading-tight space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <section>
              <div className="text-orange-800 font-semibold mb-1">Status</div>
              <div><b>Status:</b> {(request as any).status}</div>
              <div><b>Applied:</b> {fmtDT((request as any).createdAt)}</div>
            </section>

            <section>
              <div className="text-orange-800 font-semibold mb-1">Assigned</div>
              <div><b>Vehicle:</b> {(request as any).assignedVehicleNumber || '—'}</div>
              <div><b>Driver:</b> {(request as any).assignedDriverName || '—'}{(request as any).assignedDriverPhone ? ` (${(request as any).assignedDriverPhone})` : ''}</div>
            </section>

            <section className="md:col-span-2">
              <div className="text-orange-800 font-semibold mb-1">Schedule</div>
              <div><b>Pickup:</b> {fmtDT((request as any).scheduledPickupAt)} • <b>Return:</b> {fmtDT((request as any).scheduledReturnAt)}</div>
            </section>

            <section className="md:col-span-2">
              <div className="text-orange-800 font-semibold mb-1">Gate</div>
              <div><b>Exit:</b> {fmtDT((request as any).gateExitAt)} • <span className="text-[11px] text-gray-600">O {(request as any).exitOdometer ?? '—'}</span></div>
              <div><b>Entry:</b> {fmtDT((request as any).gateEntryAt)} • <span className="text-[11px] text-gray-600">O {(request as any).entryOdometer ?? '—'}</span></div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
