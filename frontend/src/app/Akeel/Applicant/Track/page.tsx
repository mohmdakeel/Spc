'use client';

import * as React from 'react';
import ApplicantSidebar from '../components/ApplicantSidebar';
import { listMyRequests, listAllRequests } from '../../Transport/services/usageService';
import type { UsageRequest } from '../../Transport/services/types';
import { Th, Td } from '../../Transport/components/ThTd';
import { Search, Printer, X } from 'lucide-react';

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

/* Status chip: wraps + abbreviates long labels */
function chip(raw?: string) {
  const s = (raw || '—').toUpperCase().trim();
  let label = s.replaceAll('_', ' ');
  if (s === 'PENDING_MANAGEMENT' || s === 'PENDING MANAGMENT') label = 'PENDING MGMT';
  if (s === 'SENT_TO_MANAGEMENT') label = 'SENT TO MGMT';

  return (
    <span
      className={[
        'inline-flex items-center justify-center',
        'px-2 py-[3px] rounded leading-[1.05] text-[11px]',
        'bg-orange-100 text-orange-800',
        'whitespace-normal break-words max-w-[9.5rem]', // prevent overflow into next column
      ].join(' ')}
    >
      {label || '—'}
    </span>
  );
}

/* print helper */
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

export default function TrackRequestPage() {
  const [items, setItems] = React.useState<UsageRequest[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [ids, setIds] = React.useState<string[]>([]);
  const [q, setQ] = React.useState('');
  const [view, setView] = React.useState<UsageRequest | null>(null);

  React.useEffect(() => {
    const eid = (typeof window !== 'undefined' && (localStorage.getItem('employeeId') || '')) || '';
    const actor = (typeof window !== 'undefined' && (localStorage.getItem('actor') || '')) || '';
    const uniqueIds = Array.from(new Set([eid, actor].filter(Boolean)));
    setIds(uniqueIds);

    (async () => {
      setLoading(true);
      let merged: UsageRequest[] = [];

      for (const id of uniqueIds) {
        try {
          let page = 0, totalPages = 1;
          while (page < totalPages) {
            const p: any = await listMyRequests(id, page, 100);
            merged = merged.concat(p.content || []);
            totalPages = (p.totalPages as number) ?? 1;
            page = ((p.number as number) ?? page) + 1;
          }
        } catch {}
      }

      if (merged.length === 0) {
        try {
          const all: any[] = await listAllRequests();
          merged = all.filter((u: any) => uniqueIds.includes(u.employeeId) || uniqueIds.includes(u.createdBy || ''));
        } catch {}
      }

      const seen = new Set<string>();
      merged = merged.filter((r: any) => {
        const k = String(r?.id ?? r?.requestCode ?? '');
        if (!k || seen.has(k)) return false;
        seen.add(k);
        return true;
      });
      merged.sort((a: any, b: any) => (Date.parse(b?.createdAt || '') || 0) - (Date.parse(a?.createdAt || '') || 0));

      setItems(merged);
      setLoading(false);
    })();
  }, []);

  const filtered = React.useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return items;
    return items.filter((r: any) =>
      [
        r.requestCode, r.status,
        r.assignedVehicleNumber, r.assignedDriverName, r.assignedDriverPhone,
        r.scheduledPickupAt, r.scheduledReturnAt,
        r.gateExitAt, r.gateEntryAt, r.exitOdometer, r.entryOdometer,
      ].map(x => (x ?? '').toString().toLowerCase()).join(' ').includes(s)
    );
  }, [items, q]);

  const printAllCurrent = React.useCallback(() => {
    const rowsHtml = filtered.map((r: any) => `
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
  <h3>Track Request</h3>
  <div class="meta">Results: ${filtered.length}</div>
  <table>
    <colgroup><col class="c1"/><col class="c2"/><col class="c3"/><col class="c4"/><col class="c5"/></colgroup>
    <thead><tr><th>RQ ID / Applied</th><th class="center">Status</th><th>Assigned</th><th>Schedule</th><th>Gate</th></tr></thead>
    <tbody>${rowsHtml || '<tr><td colspan="5">No data</td></tr>'}</tbody>
  </table>
  <script>addEventListener('load',()=>setTimeout(()=>{focus();print();},150));</script>
</body></html>`;
    printHtmlViaIframe(html);
  }, [filtered]);

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

  /* widen status column to avoid overlap */
  const COLS = React.useMemo(() => ['15%','12%','22%','21%','24%','6%'], []);

  return (
    <div className="flex min-h-screen bg-orange-50">
      <ApplicantSidebar />

      <main className="p-3 md:p-4 flex-1 text-[13px] min-w-0">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-sm md:text-base font-semibold text-orange-900">Track Request</h1>
          <div className="flex items-center gap-2">
            <label className="relative">
              <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search…"
                className="pl-7 pr-2 py-1.5 rounded border border-orange-200 text-[12px] h-8 w-[240px] focus:outline-none focus:ring-1 focus:ring-orange-300"
              />
            </label>
            <button
              type="button"
              onClick={printAllCurrent}
              className="inline-flex items-center gap-1 px-3 h-8 rounded bg-orange-600 text-white hover:bg-orange-700 text-[12px]"
              title="Print all (current filter)"
            >
              <Printer size={14} /> Print Page
            </button>
          </div>
        </div>

        {!ids.length && (
          <div className="mb-3 text-[11px] rounded bg-yellow-50 border border-yellow-200 text-yellow-800 px-2 py-1">
            Tip: after your first submission, your Employee ID is remembered automatically.
          </div>
        )}

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

              {!loading && filtered.map((r: any) => (
                <tr
                  key={String(r?.id ?? r?.requestCode)}
                  className="align-top hover:bg-orange-50/40 cursor-pointer"
                  onClick={() => setView(r)}
                >
                  {/* RQ / Applied */}
                  <Td className="px-2 py-1 whitespace-normal break-words">
                    <div className="font-semibold text-orange-900">{r.requestCode || '—'}</div>
                    <div className="text-[11px] text-gray-600">{appliedLabel(r)}</div>
                  </Td>

                  {/* Status — wrapped & centered chip (no overlap) */}
                  <Td className="px-2 py-1 text-center align-top">
                    <div className="flex items-start justify-center min-w-0">{chip(r.status)}</div>
                  </Td>

                  {/* Assigned */}
                  <Td className="px-2 py-1 whitespace-normal break-words">
                    <div>{r.assignedVehicleNumber || '—'}</div>
                    <div className="text-[11px] text-gray-700">{r.assignedDriverName || '—'}{r.assignedDriverPhone ? ` (${r.assignedDriverPhone})` : ''}</div>
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
                  <Td className="px-2 py-1 text-center">
                    <button
                      type="button"
                      className="inline-flex items-center justify-center w-7 h-7 rounded bg-orange-600 text-white hover:bg-orange-700"
                      title="Print this row"
                      onClick={(e) => { e.stopPropagation(); printOne(r); }}
                    >
                      <Printer size={13} />
                    </button>
                  </Td>
                </tr>
              ))}

              {!loading && !filtered.length && (<tr><Td colSpan={6} className="px-2 py-6 text-center text-gray-500">No requests found.</Td></tr>)}
            </tbody>
          </table>
        </div>
      </main>

      {view && <DetailsModal request={view} onClose={() => setView(null)} />}
    </div>
  );
}

/* Details Modal (same structure as Requests) */
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
