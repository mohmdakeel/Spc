'use client';

import * as React from 'react';
import ApplicantSidebar from '../components/ApplicantSidebar';
import { listMyRequests, listAllRequests } from '../../Transport/services/usageService';
import type { UsageRequest } from '../../Transport/services/types';
import { Th, Td } from '../../Transport/components/ThTd';
import { Search, Printer, X } from 'lucide-react';

/* ------------ helpers ------------ */
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

function statusChip(raw?: string) {
  const s = (raw || '—').toUpperCase().trim();
  const color =
    s === 'APPROVED' ? 'bg-green-100 text-green-800' :
    s === 'REJECTED' ? 'bg-red-100 text-red-800' :
    s === 'ASSIGNED' ? 'bg-blue-100 text-blue-800' :
    s === 'COMPLETED' ? 'bg-slate-100 text-slate-800' :
    'bg-orange-100 text-orange-800';

  let label = s.replaceAll('_', ' ');
  if (s === 'PENDING_MANAGEMENT' || s === 'PENDING MANAGMENT') label = 'PENDING MGMT';
  if (s === 'SENT_TO_MANAGEMENT') label = 'SENT TO MGMT';
  if (s === 'PENDING_HOD') label = 'PENDING HOD';

  return (
    <span className={['inline-flex items-center justify-center','px-2 py-[3px] rounded leading-[1.05] text-[11px]',color,'whitespace-normal break-words text-center max-w-[9.5rem]'].join(' ')}>
      {label || '—'}
    </span>
  );
}

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
  if (r.travelWithOfficer || r.officerName || r.officerId || r.officerPhone) {
    return { withOfficer: true, name: r.officerName || undefined, id: r.officerId || undefined, phone: cleanPhone(r.officerPhone) || undefined };
  }
  const text = `${r?.officialDescription || ''}\n${r?.remarks || ''}`;
  const m =
    /Travelling Officer:\s*([^\(\n,]+)?(?:\s*\((?:Employee\s*ID|Emp\.?\s*ID|ID)\s*:\s*([^)]+)\))?(?:,\s*(?:Phone|Tel)\s*:\s*([^\n]+))?/i.exec(text);
  if (m) return { withOfficer: true, name: m[1]?.trim() || undefined, id: m[2]?.trim() || undefined, phone: cleanPhone(m[3]) || undefined };
  return { withOfficer: false };
}

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

export default function RequestsPage() {
  const [items, setItems] = React.useState<UsageRequest[]>([]);
  const [ids, setIds] = React.useState<string[]>([]);
  const [loading, setLoading] = React.useState(true);
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
            merged = merged.concat(p?.content || []);
            totalPages = (p?.totalPages as number) ?? 1;
            page = ((p?.number as number) ?? page) + 1;
          }
        } catch {}
      }

      if (merged.length === 0) {
        try {
          const all: any[] = await listAllRequests();
          merged = all.filter((u: any) => uniqueIds.includes(u?.employeeId) || uniqueIds.includes(u?.createdBy || ''));
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
        r?.requestCode, r?.status, r?.applicantName, r?.employeeId, r?.department,
        r?.fromLocation, r?.toLocation, r?.officialDescription, r?.goods,
        r?.appliedDate, r?.appliedTime,
      ]
        .map((x) => (x ?? '').toString().toLowerCase())
        .join(' ')
        .includes(s)
    );
  }, [items, q]);

  const printAllCurrent = React.useCallback(() => {
    const rowsHtml = filtered
      .map((r: any) => {
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
      })
      .join('');

    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"/><title>Requests - Print</title><meta name="viewport" content="width=device-width, initial-scale=1"/>
<style>
:root{--fg:#111;--muted:#666;--head:#faf5f0}*{box-sizing:border-box}body{margin:0;padding:10mm;font-family:system-ui,Arial,sans-serif;color:var(--fg)}
h3{margin:0 0 8px 0}.meta{margin:4px 0 8px 0;font-size:12px;color:var(--muted)}
table{width:100%;border-collapse:collapse;table-layout:fixed}thead{display:table-header-group}
th,td{border:1px solid #ddd;padding:6px 8px;vertical-align:top;font-size:12px}th{background:var(--head);text-align:left}
.center{text-align:center}.sub{color:var(--muted);font-size:11px}.mono{font-family:ui-monospace,Menlo,Consolas,monospace}.rq{font-weight:600;color:#8b4513}
col.c1{width:12%}col.c2{width:17%}col.c3{width:10%}col.c4{width:12%}col.c5{width:15%}col.c6{width:14%}col.c7{width:14%}
@media print{@page{size:A4 landscape;margin:8mm}body{padding:0}}
</style></head>
<body>
  <h3>Requests (Applicant-entered)</h3>
  <div class="meta">Results: ${filtered.length}</div>
  <table>
    <colgroup><col class="c1"/><col class="c2"/><col class="c3"/><col class="c4"/><col class="c5"/><col class="c6"/><col class="c7"/></colgroup>
    <thead><tr><th>RQ ID / Applied</th><th>Applicant / Dept</th><th class="center">Status</th><th>Travel</th><th>Route</th><th>Officer</th><th>Purpose / Goods</th></tr></thead>
    <tbody>${rowsHtml || '<tr><td colspan="7">No data</td></tr>'}</tbody>
  </table>
  <script>addEventListener('load',()=>setTimeout(()=>{focus();print();},150));</script>
</body></html>`;
    printHtmlViaIframe(html);
  }, [filtered]);

  const printOne = React.useCallback((r: any) => {
    const off = extractOfficer(r);
    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"/><title>${r.requestCode || 'Request'} - Print</title><meta name="viewport" content="width=device-width, initial-scale=1"/>
<style>*{box-sizing:border-box}body{margin:0;padding:12mm;font-family:system-ui,Arial,sans-serif;color:#111}
h2{margin:0 0 12px 0}.grid{display:grid;grid-template-columns:1fr 1fr;gap:8px 16px;font-size:13px}
.block{margin:8px 0 2px;font-weight:600;color:#8b4513}.sub{color:#666;font-size:12px}
table{width:100%;border-collapse:collapse;margin-top:10px}th,td{border:1px solid #ddd;padding:6px 8px;font-size:12px;vertical-align:top}
th{background:#faf5f0;text-align:left;width:34%}@media print{@page{size:A4 portrait;margin:10mm}body{padding:0}}</style></head>
<body>
  <h2>Transport Request • ${r.requestCode || ''}</h2>
  <div class="grid">
    <div><div class="block">Applicant Name</div>${r.applicantName || ''} <span class="sub">(${r.employeeId || ''})</span></div>
    <div><div class="block">Status</div>${r.status || ''}</div>
    <div><div class="block">Department</div>${r.department || ''}</div>
    <div><div class="block">Applied</div>${appliedLabel(r)}</div>
    <div><div class="block">Date of Travel</div>${r.dateOfTravel || ''}</div>
    <div><div class="block">From Location</div>${r.fromLocation || ''}</div>
    <div><div class="block">Time From</div>${r.timeFrom || ''}</div>
    <div><div class="block">To Location</div>${r.toLocation || ''}</div>
    <div><div class="block">Time To</div>${r.timeTo || ''} ${r.overnight ? '(overnight)' : ''}</div>
  </div>
  <table>
    <tr><th>Official Trip Description</th><td>${purposeWithoutOfficer(r)}</td></tr>
    <tr><th>Goods being transported (if any)</th><td>${r.goods || '—'}</td></tr>
    <tr><th>Travelling Officer</th><td>${off.withOfficer ? `${off.name || '—'}${off.id ? ` (${off.id})` : ''}${off.phone ? `, ${off.phone}` : ''}` : '—'}</td></tr>
    <tr><th>Pickup</th><td>${fmtDT(r.scheduledPickupAt)}</td></tr>
    <tr><th>Return</th><td>${fmtDT(r.scheduledReturnAt)}</td></tr>
    <tr><th>Gate Exit • Odometer</th><td>${fmtDT(r.gateExitAt)} • O ${r.exitOdometer ?? '—'}</td></tr>
    <tr><th>Gate Entry • Odometer</th><td>${fmtDT(r.gateEntryAt)} • O ${r.entryOdometer ?? '—'}</td></tr>
  </table>
  <script>addEventListener('load',()=>setTimeout(()=>{focus();print();},150));</script>
</body></html>`;
    printHtmlViaIframe(html);
  }, []);

  const COLS = React.useMemo(() => ['12%','17%','10%','12%','15%','14%','14%','6%'], []);

  return (
    <div className="flex min-h-screen bg-orange-50">
      <ApplicantSidebar />

      <main className="min-w-0 p-3 md:p-4 flex-1 text-[13px]">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-sm md:text-base font-semibold text-orange-900">Requests</h1>
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
                <Th className="px-2 py-1 text-left">Applicant / Dept</Th>
                <Th className="px-2 py-1 text-center">Status</Th>
                <Th className="px-2 py-1 text-left">Travel</Th>
                <Th className="px-2 py-1 text-left">Route</Th>
                <Th className="px-2 py-1 text-left">Officer</Th>
                <Th className="px-2 py-1 text-left">Purpose / Goods</Th>
                <Th className="px-2 py-1 text-center">Print</Th>
              </tr>
            </thead>

            <tbody className="divide-y">
              {loading && (<tr><Td colSpan={8} className="px-2 py-6 text-center text-gray-500">Loading…</Td></tr>)}

              {!loading && filtered.map((r: any) => {
                const off = extractOfficer(r);
                const rowKey = String(r?.id ?? r?.requestCode ?? `${r?.employeeId}-${r?.dateOfTravel}-${r?.timeFrom}`);
                return (
                  <tr
                    key={rowKey}
                    className="align-top hover:bg-orange-50/40 cursor-pointer"
                    onClick={() => setView(r)}
                  >
                    <Td className="px-2 py-1 whitespace-normal break-words">
                      <div className="font-semibold text-orange-900">{r.requestCode || '—'}</div>
                      <div className="text-[11px] text-gray-600">{appliedLabel(r)}</div>
                    </Td>

                    <Td className="px-2 py-1 whitespace-normal break-words">
                      <div>
                        <span className="font-medium text-orange-900">{r.applicantName || '—'}</span>{' '}
                        <span className="text-gray-600 text-[11px]">({r.employeeId || '—'})</span>
                      </div>
                      <div className="text-[11px] text-gray-700">{r.department || '—'}</div>
                    </Td>

                    <Td className="px-2 py-1 text-center align-top">
                      <div className="flex items-start justify-center min-w-0">{statusChip(r.status)}</div>
                    </Td>

                    <Td className="px-2 py-1 whitespace-normal break-words">
                      <div>{r.dateOfTravel || '—'}</div>
                      <div className="text-[11px] text-gray-600">
                        <span className="font-mono">{r.timeFrom || '—'}</span>–<span className="font-mono">{r.timeTo || '—'}</span> {r.overnight ? '(overnight)' : ''}
                      </div>
                    </Td>

                    <Td className="px-2 py-1 whitespace-normal break-words">
                      {(r.fromLocation || '—')} → {(r.toLocation || '—')}
                    </Td>

                    <Td className="px-2 py-1 whitespace-normal break-words">
                      {off.withOfficer ? (
                        <>
                          <div>{off.name ?? '—'} {off.id ? <span className="text-[11px] text-gray-600">({off.id})</span> : null}</div>
                          {off.phone ? <div className="text-[11px] text-gray-700 break-all">{off.phone}</div> : null}
                        </>
                      ) : '—'}
                    </Td>

                    <Td className="px-2 py-1 whitespace-normal break-words">
                      <div className="break-words break-all">{purposeWithoutOfficer(r)}</div>
                      <div className="text-[11px] text-gray-700">{r.goods || '—'}</div>
                    </Td>

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
                );
              })}

              {!loading && !filtered.length && (<tr><Td colSpan={8} className="px-2 py-6 text-center text-gray-500">No requests found.</Td></tr>)}
            </tbody>
          </table>
        </div>
      </main>

      {view && <DetailsModal request={view} onClose={() => setView(null)} />}
    </div>
  );
}

/* ========== Details Modal ========== */
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
                  <div><div className="text-gray-600">Official Trip Description</div><div className="text-orange-900 break-words break-all">{purposeWithoutOfficer(request as any)}</div></div>
                  <div><div className="text-gray-600">Goods being transported (if any)</div><div className="text-orange-800/90 break-words">{(request as any).goods || '—'}</div></div>
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
