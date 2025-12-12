'use client';

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Th, Td } from '../../Transport/components/ThTd';
import { listByStatus } from '../../Transport/services/usageService';
import type { UsageRequest } from '../../Transport/services/types';
import GateSearchBar from '../components/GateSearchBar';
import { Printer, X } from 'lucide-react';

/* ------------ helpers ------------ */
const fmtDT = (s?: string | null) => (s ? new Date(s).toLocaleString() : '—');
const fmtTime = (s?: string | null) =>
  s ? new Date(s).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—';

const cleanPhone = (p?: string | null) =>
  (p ?? '')
    .replace(/[^\d+()\-\s./;]/g, '')
    .replace(/^[;,\s-]+/, '')
    .replace(/\s{2,}/g, ' ')
    .trim();

// Resolve officer bits from explicit fields or embedded text "(ID: ...)"
function resolveOfficerBits(r: any): { name?: string; id?: string; phone?: string } {
  const name = r?.officerName || undefined;
  const phone = cleanPhone(r?.officerPhone) || undefined;

  if (r?.officerId) return { name, id: String(r.officerId), phone };

  const text = `${r?.officialDescription || ''}\n${r?.remarks || ''}`;
  const m = /\(\s*(?:Employee\s*ID|Emp\.?\s*ID|ID)\s*:\s*([^)]+)\)/i.exec(text);
  const id = m?.[1]?.trim();
  return { name, id, phone };
}

const chip = (s: 'Scheduled' | 'Departed' | 'Returned') => {
  const cls =
    s === 'Scheduled'
      ? 'bg-yellow-200 text-yellow-900 ring-1 ring-yellow-400/70'
      : s === 'Departed'
      ? 'bg-blue-600 text-white ring-1 ring-blue-700/60'
      : 'bg-green-500 text-white ring-1 ring-green-600/60';
  return <span className={`inline-block text-[10px] px-2.5 py-[4px] rounded-full ${cls}`}>{s}</span>;
};

/* print via hidden iframe */
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

/* ========== Page ========== */
export default function GateTripsHistoryPage() {
  const [rows, setRows] = useState<UsageRequest[]>([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<UsageRequest | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [dispatched, returned] = await Promise.all([
        listByStatus('DISPATCHED'),
        listByStatus('RETURNED'),
      ]);
      let merged = [...(dispatched || []), ...(returned || [])];

      // de-dupe
      const seen = new Set<string>();
      merged = merged.filter((r: any) => {
        const k = String(r?.id ?? r?.requestCode ?? '');
        if (!k || seen.has(k)) return false;
        seen.add(k);
        return true;
      });

      // newest exit first (fallback createdAt)
      merged.sort((a: any, b: any) => {
        const ta = new Date(b?.gateExitAt || b?.createdAt || 0).getTime();
        const tb = new Date(a?.gateExitAt || a?.createdAt || 0).getTime();
        return ta - tb;
      });

      setRows(merged);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter((r: any) => {
      const off = resolveOfficerBits(r);
      return [
        r.requestCode,
        r.assignedVehicleNumber,
        r.assignedDriverName,
        r.assignedDriverPhone,
        r.assignedDriverId,
        r.department,
        r.fromLocation,
        r.toLocation,
        r.dateOfTravel,
        off.name,
        off.id,
        off.phone,
      ].map(x => (x ?? '').toString().toLowerCase()).join(' ').includes(s);
    });
  }, [rows, q]);

  /* --------- Print helpers --------- */
  const printPage = useCallback(() => {
    const rowsHtml = filtered.map((r: any) => {
      const driverPhone = cleanPhone(r.assignedDriverPhone);
      const driverId = r.assignedDriverId || r.driverEmployeeId || '';
      const off = resolveOfficerBits(r);
      return `
<tr>
  <td><div class="rq">${r.requestCode || ''}</div><div class="sub">${r.department || ''}</div></td>
  <td>
    <div><b>Pickup (Sched.)</b> ${fmtTime(r.scheduledPickupAt)}</div>
    <div><b>Return (Sched.)</b> ${fmtTime(r.scheduledReturnAt)}</div>
    <div><b>Departed</b> ${fmtTime(r.gateExitAt)}</div>
    <div><b>Returned</b> ${fmtTime(r.gateEntryAt)}</div>
  </td>
  <td>
    <div><b>${r.assignedVehicleNumber || '—'}</b></div>
    <div>${r.assignedDriverName || '—'}${driverId ? ` <span class="sub">(${driverId})</span>` : ''}</div>
    <div class="sub">${driverPhone || ''}</div>
  </td>
  <td>
    <div>${off.name || '—'}${off.id ? ` <span class="sub">(${off.id})</span>` : ''}</div>
    <div class="sub">${off.phone || ''}</div>
  </td>
  <td>${r.fromLocation || '—'} → ${r.toLocation || '—'}</td>
</tr>`;
    }).join('');

    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"/><title>Trips History • Print</title><meta name="viewport" content="width=device-width, initial-scale=1"/>
<style>
:root{--fg:#111;--muted:#666;--head:#faf5f0}
*{box-sizing:border-box}body{margin:0;padding:10mm;font-family:system-ui,Arial,sans-serif;color:var(--fg)}
h3{margin:0 0 8px 0}.meta{margin:4px 0 8px 0;font-size:11px;color:var(--muted)}
table{width:100%;border-collapse:collapse;table-layout:fixed}thead{display:table-header-group}
th,td{border:1px solid #ddd;padding:6px 8px;vertical-align:top;font-size:11px}th{background:var(--head);text-align:left}
.sub{color:var(--muted);font-size:10.5px}.rq{font-weight:600;color:#8b4513}
col.c1{width:12%}col.c2{width:28%}col.c3{width:22%}col.c4{width:18%}col.c5{width:20%}
@media print{@page{size:A4 landscape;margin:10mm}body{padding:0}}
</style></head>
<body>
<h3>Trips History</h3>
<div class="meta">Results: ${filtered.length}</div>
<table>
  <colgroup><col class="c1"/><col class="c2"/><col class="c3"/><col class="c4"/><col class="c5"/></colgroup>
  <thead><tr>
    <th>Request</th><th>Schedule</th><th>Vehicle / Driver</th><th>Officer</th><th>Route</th>
  </tr></thead>
  <tbody>${rowsHtml || '<tr><td colspan="5">No data</td></tr>'}</tbody>
</table>
<script>addEventListener('load',()=>setTimeout(()=>{focus();print();},150));</script>
</body></html>`;
    printHtmlViaIframe(html);
  }, [filtered]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-[14px] md:text-lg font-bold text-orange-900">Trips History</h1>
        <div className="flex items-center gap-2">
          <GateSearchBar
            value={q}
            onChange={setQ}
            placeholder="Search request, vehicle, driver, officer, route…"
          />
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
        <table className="min-w-[980px] w-full table-fixed text-[10px] leading-tight">
          {/* keep colgroup on one line to avoid whitespace text nodes */}
          <colgroup><col className="w-[12%]"/><col className="w-[26%]"/><col className="w-[20%]"/><col className="w-[18%]"/><col className="w-[24%]"/></colgroup>
          <thead className="bg-orange-50 text-[9px] uppercase tracking-wide">
            <tr>
              <Th className="px-3 py-2 text-left">Request</Th>
              <Th className="px-3 py-2 text-left">Schedule</Th>
              <Th className="px-3 py-2 text-left">Vehicle / Driver</Th>
              <Th className="px-3 py-2 text-left">Officer</Th>
              <Th className="px-3 py-2 text-left">Route</Th>
            </tr>
          </thead>

          <tbody className="divide-y">
            {loading && (
              <tr>
                <Td colSpan={5} className="px-3 py-6 text-center text-gray-500">Loading…</Td>
              </tr>
            )}

            {!loading && filtered.map((r) => {
              const isDeparted = !!r.gateExitAt && !r.gateEntryAt;
              const isReturned = !!r.gateEntryAt;
              const statusLabel: 'Scheduled' | 'Departed' | 'Returned' =
                isReturned ? 'Returned' : isDeparted ? 'Departed' : 'Scheduled';

              const driverPhone = cleanPhone(r.assignedDriverPhone);
              const driverId = (r as any).assignedDriverId || (r as any).driverEmployeeId || '';
              const { name: offName, id: offId, phone: offPhone } = resolveOfficerBits(r);

              return (
                <tr
                  key={r.id}
                  className="align-top hover:bg-orange-50/40 cursor-pointer"
                  onClick={() => setView(r)}
                  title="Click for full details"
                >
                  {/* Request */}
                  <Td className="px-3 py-2">
                    <div className="font-semibold text-orange-900 text-[11px]">{r.requestCode || '—'}</div>
                    <div className="text-[9px] text-gray-600">{r.department || '—'}</div>
                  </Td>

                  {/* Schedule (4 lines) */}
                  <Td className="px-3 py-2">
                    <div className="font-medium">Pickup (Sched.): {fmtTime(r.scheduledPickupAt)}</div>
                    <div>Return (Sched.): {fmtTime(r.scheduledReturnAt)}</div>
                    <div className="text-blue-700">Departed: {fmtTime(r.gateExitAt)}</div>
                    <div className="text-green-600">Returned: {fmtTime(r.gateEntryAt)}</div>
                  </Td>

                  {/* Vehicle / Driver */}
                  <Td className="px-3 py-2">
                    <div className="font-medium">{r.assignedVehicleNumber || '—'}</div>
                    <div className="text-[10px] text-gray-800">
                      {r.assignedDriverName || '—'}
                      {driverId ? <span className="text-gray-600"> ({driverId})</span> : null}
                    </div>
                    <div className="text-[9px] text-gray-700">{driverPhone || '—'}</div>
                  </Td>

                  {/* Officer */}
                  <Td className="px-3 py-2">
                    <div className="text-[10px] text-gray-800">
                      {offName || '—'}{offId ? <span className="text-gray-600"> ({offId})</span> : null}
                    </div>
                    <div className="text-[9px] text-gray-700">{offPhone || ''}</div>
                  </Td>

                  {/* Route */}
                  <Td className="px-3 py-2">
                    <div>{r.fromLocation || '—'} → {r.toLocation || '—'}</div>
                    <div className="mt-1">{chip(statusLabel)}</div>
                  </Td>
                </tr>
              );
            })}

            {!loading && !filtered.length && (
              <tr>
                <Td colSpan={5} className="px-3 py-6 text-center text-gray-500">No trip history</Td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {view && <DetailsModal request={view} onClose={() => setView(null)} />}
    </div>
  );
}

/* ========== Details Modal ========== */
function DetailsModal({ request, onClose }: { request: UsageRequest; onClose: () => void }) {
  const { name: offName, id: offId, phone: offPhone } = resolveOfficerBits(request as any);
  const driverPhone = cleanPhone((request as any).assignedDriverPhone);
  const driverId = (request as any).assignedDriverId || (request as any).driverEmployeeId || '';
  const yn = (b?: boolean) => (b ? 'Yes' : 'No');

  return (
    <div className="fixed inset-0 bg-black/40 grid place-items-center z-50 p-3" onClick={onClose} aria-modal role="dialog">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-2 border-b bg-orange-50">
          <h3 className="font-bold text-orange-900 text-[13px]">Trip • {(request as any).requestCode}</h3>
          <button className="p-1 rounded hover:bg-orange-100" onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>
        </div>

        <div className="p-4 text-[12px] leading-tight space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <section>
              <div className="text-orange-800 font-semibold mb-1">Request & Department</div>
              <div className="truncate"><b>Request ID:</b> {(request as any).requestCode || '—'}</div>
              <div className="truncate"><b>Department:</b> {(request as any).department || '—'}</div>
              <div className="text-[11px] text-gray-600 mt-1">
                Created {fmtDT((request as any).createdAt)}
                {(request as any).updatedAt ? ` • Updated ${fmtDT((request as any).updatedAt)}` : ''}
              </div>
            </section>

            <section>
              <div className="text-orange-800 font-semibold mb-1">Vehicle & Driver</div>
              <div><b>Vehicle No.:</b> {(request as any).assignedVehicleNumber || '—'}</div>
              <div>
                <b>Driver:</b> {(request as any).assignedDriverName || '—'}{driverId ? ` (${driverId})` : ''}
              </div>
              <div><b>Phone:</b> {driverPhone || '—'}</div>
            </section>

            <section>
              <div className="text-orange-800 font-semibold mb-1">Officer</div>
              <div><b>Name:</b> {offName || '—'}{offId ? ` (${offId})` : ''}</div>
              <div><b>Phone:</b> {offPhone || '—'}</div>
              <div><b>Travelling with Officer:</b> {yn((request as any).travelWithOfficer)}</div>
            </section>

            <section>
              <div className="text-orange-800 font-semibold mb-1">Route</div>
              <div><b>From:</b> {(request as any).fromLocation || '—'}</div>
              <div><b>To:</b> {(request as any).toLocation || '—'}</div>
            </section>

            <section className="md:col-span-2 border border-orange-100 rounded-lg p-3">
              <div className="text-orange-800 font-semibold mb-2">Schedule & Gate</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div>
                  <div><b>Pickup (Sched.):</b> {fmtDT((request as any).scheduledPickupAt)}</div>
                  <div><b>Return (Sched.):</b> {fmtDT((request as any).scheduledReturnAt)}</div>
                </div>
                <div>
                  <div><b>Departed:</b> {fmtDT((request as any).gateExitAt)} <span className="text-[11px] text-gray-600">• O {(request as any).exitOdometer ?? '—'}</span></div>
                  <div><b>Returned:</b> {fmtDT((request as any).gateEntryAt)} <span className="text-[11px] text-gray-600">• O {(request as any).entryOdometer ?? '—'}</span></div>
                </div>
              </div>
            </section>

            <section className="md:col-span-2">
              <div className="text-orange-800 font-semibold mb-1">Purpose / Goods</div>
              <div><b>Official Trip Description:</b> {(request as any).officialDescription || '—'}</div>
              <div className="mt-1"><b>Goods (if any):</b> {(request as any).goods || '—'}</div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
