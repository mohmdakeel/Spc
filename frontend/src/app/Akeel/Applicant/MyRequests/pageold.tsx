'use client';

import * as React from 'react';
import ApplicantSidebar from '../components/ApplicantSidebar';
import { listMyRequests, listAllRequests } from '../../Transport/services/usageService';
import type { UsageRequest } from '../../Transport/services/types';
import { Th, Td } from '../../Transport/components/ThTd';
import { Printer, Search, X } from 'lucide-react';

/* ---------- small helpers ---------- */
const chip = (s: string) => (
  <span className="inline-block text-[8px] px-1 py-[1px] rounded bg-orange-100 text-orange-800 leading-none">
    {s}
  </span>
);
const fmtDT = (s?: string | null) => (s ? new Date(s).toLocaleString() : '-');

/** Applied label: prefers appliedDate + appliedTime; falls back to createdAt with time */
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

/** Get Travelling Officer from explicit fields OR "Travelling Officer: ..." text */
function extractOfficer(r: any): { withOfficer: boolean; name?: string; id?: string; phone?: string } {
  if (r.travelWithOfficer || r.officerName || r.officerId || r.officerPhone) {
    return {
      withOfficer: !!(r.travelWithOfficer || r.officerName || r.officerId || r.officerPhone),
      name: r.officerName || undefined,
      id: r.officerId || undefined,
      phone: r.officerPhone || undefined,
    };
  }
  const text = `${r.officialDescription || ''}\n${r.remarks || ''}`;
  const re =
    /Travelling Officer:\s*([^\(\n,]+)?(?:\s*\((?:Employee\s*ID|Emp\.?\s*ID|ID)\s*:\s*([^)]+)\))?(?:,\s*(?:Phone|Tel)\s*:\s*([^\s,]+))?/i;
  const m = re.exec(text);
  if (m) {
    return {
      withOfficer: true,
      name: m[1]?.trim() || undefined,
      id: m[2]?.trim() || undefined,
      phone: m[3]?.trim() || undefined,
    };
  }
  return { withOfficer: false };
}

/** Strip the embedded "Travelling Officer: ..." clause from Official Trip Description */
function purposeWithoutOfficer(r: any): string {
  const raw = (r.officialDescription ?? '').toString();
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

/* ---------------- iframe-only print helper (no new tab) ---------------- */
function printHtmlViaIframe(html: string) {
  const iframe = document.createElement('iframe');
  Object.assign(iframe.style, {
    position: 'fixed',
    right: '0',
    bottom: '0',
    width: '0',
    height: '0',
    border: '0',
  } as CSSStyleDeclaration);
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

/* ======================= Page ======================= */
export default function MyRequestsPage() {
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

      // Pull all pages for each known id
      for (const id of uniqueIds) {
        try {
          let page = 0,
            totalPages = 1;
          while (page < totalPages) {
            const p = await listMyRequests(id, page, 100);
            merged = merged.concat(p.content || []);
            totalPages = (p.totalPages as number) ?? 1;
            page = ((p.number as number) ?? page) + 1;
          }
        } catch {}
      }

      // If nothing came back, fallback to all and filter
      if (merged.length === 0) {
        try {
          const all = await listAllRequests();
          merged = all.filter((u: any) => uniqueIds.includes(u.employeeId) || uniqueIds.includes(u.createdBy || ''));
        } catch {}
      }

      // Dedupe by id & sort newest first
      const seen = new Set<number>();
      merged = merged.filter((r) => (seen.has(r.id) ? false : (seen.add(r.id), true)));
      merged.sort((a: any, b: any) => {
        const ta = a.createdAt ? Date.parse(a.createdAt) : 0;
        const tb = b.createdAt ? Date.parse(b.createdAt) : 0;
        return tb - ta;
      });

      setItems(merged);
      setLoading(false);
    })();
  }, []);

  const filtered = React.useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return items;
    return items.filter((r: any) => {
      const off = extractOfficer(r);
      return [
        r.requestCode,
        r.status,
        r.applicantName,
        r.employeeId,
        r.fromLocation,
        r.toLocation,
        r.assignedVehicleNumber,
        r.assignedDriverName,
        r.officialDescription,
        r.goods,
        off.name,
        off.id,
        off.phone,
      ]
        .map((x) => (x ?? '').toString().toLowerCase())
        .join(' ')
        .includes(s);
    });
  }, [items, q]);

  /* ---------------- print current table (no new tab) ---------------- */
  const printAllCurrent = React.useCallback(() => {
    const rowsHtml = filtered
      .map((r: any) => {
        const off = extractOfficer(r);
        return `
<tr>
  <td><div class="rq">${r.requestCode || ''}</div><div class="sub">${appliedLabel(r)}</div></td>
  <td>
    <div><b>Applicant Name:</b> ${r.applicantName || ''} <span class="sub">(${r.employeeId || ''})</span></div>
    <div><b>Travelling Officer:</b> ${
      off.withOfficer ? `${off.name || '-'} <span class="sub">(${off.id || '-'})</span>${off.phone ? `, ${off.phone}` : ''}` : '—'
    }</div>
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
      })
      .join('');

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>My Requests - Print</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    :root { --fg:#111; --muted:#666; --head:#faf5f0; }
    * { box-sizing: border-box; }
    html, body { width: 100%; height: 100%; }
    body { margin: 0; padding: 10mm; font-family: system-ui, Arial, sans-serif; color: var(--fg); }
    h3 { margin: 0 0 8px 0; }
    .meta { margin: 4px 0 8px 0; font-size: 11px; color: var(--muted); }
    table { width: 100%; border-collapse: collapse; table-layout: fixed; }
    thead { display: table-header-group; }
    tr, td, th { page-break-inside: avoid; break-inside: avoid; }
    th, td { border: 1px solid #ddd; padding: 6px 8px; vertical-align: top; font-size: 11px; }
    th { background: var(--head); text-align: left; }
    .center { text-align: center; }
    .sub { color: var(--muted); font-size: 10px; }
    .mono { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }
    .rq { font-weight: 600; color: #8b4513; }
    col.c1{width:12%}col.c2{width:18%}col.c3{width:8%}col.c4{width:12%}
    col.c5{width:16%}col.c6{width:12%}col.c7{width:11%}col.c8{width:11%}
    @media print { @page { size: A4 landscape; margin: 8mm; } body { padding: 0; } }
  </style>
</head>
<body>
  <h3>My Requests (History)</h3>
  <div class="meta">Results: ${filtered.length}</div>
  <table>
    <colgroup><col class="c1"/><col class="c2"/><col class="c3"/><col class="c4"/><col class="c5"/><col class="c6"/><col class="c7"/><col class="c8"/></colgroup>
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
</body>
</html>`;
    printHtmlViaIframe(html);
  }, [filtered]);

  /* ---------------- print a single row (no new tab) ---------------- */
  const printOne = React.useCallback((r: any) => {
    const off = extractOfficer(r);
    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${r.requestCode || 'Request'} - Print</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    :root { --fg:#111; --muted:#666; --head:#faf5f0; }
    * { box-sizing: border-box; }
    html, body { width: 100%; height: 100%; }
    body { margin: 0; padding: 12mm; font-family: system-ui, Arial, sans-serif; color: #111; }
    h2 { margin: 0 0 12px 0; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 16px; font-size: 12px; }
    .block { margin: 8px 0 2px; font-weight: 600; color: #8b4513; }
    .sub { color: #666; font-size: 11px; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    th, td { border: 1px solid #ddd; padding: 6px 8px; font-size: 12px; vertical-align: top; }
    th { background: #faf5f0; text-align: left; width: 34%; }
    @media print { @page { size: A4 portrait; margin: 10mm; } body { padding: 0; } }
  </style>
</head>
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
    <div><div class="block">Travelling with Officer</div>${off.withOfficer ? 'Yes' : 'No'}</div>
  </div>

  <table>
    <tr><th>Official Trip Description</th><td>${purposeWithoutOfficer(r)}</td></tr>
    <tr><th>Goods being transported (if any)</th><td>${r.goods || '—'}</td></tr>
    <tr><th>Name of Travelling Officer</th><td>${off.withOfficer ? (off.name || '—') : '—'}</td></tr>
    <tr><th>Travelling Officer Employee ID</th><td>${off.withOfficer ? (off.id || '—') : '—'}</td></tr>
    <tr><th>Travelling Officer Phone</th><td>${off.withOfficer ? (off.phone || '—') : '—'}</td></tr>
    <tr><th>Vehicle</th><td>${r.assignedVehicleNumber || '—'}</td></tr>
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
    <div className="flex min-h-screen bg-orange-50">
      <ApplicantSidebar />

      <main className="p-2 md:p-3 flex-1">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-[12px] font-semibold text-orange-900">My Requests (History)</h1>

          <div className="flex items-center gap-2">
            <label className="relative">
              <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search…"
                className="pl-6 pr-2 py-1 rounded border border-orange-200 text-[11px] h-7 w-[200px] focus:outline-none focus:ring-1 focus:ring-orange-300"
              />
            </label>

            <button
              type="button"
              onClick={printAllCurrent}
              className="inline-flex items-center gap-1 px-2.5 h-7 rounded bg-orange-600 text-white hover:bg-orange-700 text-[11px]"
              title="Print all (current filter)"
            >
              <Printer size={13} />
              Print Page
            </button>
          </div>
        </div>

        {!ids.length && (
          <div className="mb-2 text-[9px] rounded bg-yellow-50 border border-yellow-200 text-yellow-800 px-2 py-1">
            Tip: after your first submission, your Employee ID is remembered automatically.
          </div>
        )}

        <div className="bg-white rounded-md border border-orange-200 overflow-auto">
          <table className="w-full table-fixed text-[9px] leading-[1.1]">
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
              <tr className="text-[8.5px]">
                <Th className="px-1.5 py-1 text-left">RQ ID / Applied</Th>
                <Th className="px-1.5 py-1 text-left">APPLICANT / OFFICER</Th>
                <Th className="px-1.5 py-1 text-center">Status</Th>
                <Th className="px-1.5 py-1 text-left">Travel</Th>
                <Th className="px-1.5 py-1 text-left">Route</Th>
                <Th className="px-1.5 py-1 text-left">Assigned</Th>
                <Th className="px-1.5 py-1 text-left">Schedule</Th>
                <Th className="px-1.5 py-1 text-left">Gate</Th>
                <Th className="px-1.5 py-1 text-center">Print</Th>
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

              {!loading &&
                filtered.map((r: any) => {
                  const off = extractOfficer(r);
                  return (
                    <tr
                      key={r.id}
                      className="align-top hover:bg-orange-50/40 cursor-pointer"
                      onClick={() => setView(r)}
                    >
                      {/* Code / Applied */}
                      <Td className="px-1.5 py-1 whitespace-nowrap">
                        <div className="font-semibold text-orange-900 truncate" title={r.requestCode}>
                          {r.requestCode}
                        </div>
                        <div className="text-[8px] text-gray-600 truncate" title={appliedLabel(r)}>
                          {appliedLabel(r)}
                        </div>
                      </Td>

                      {/* People */}
                      <Td className="px-1.5 py-1">
                        <div className="truncate" title={`${r.applicantName} (${r.employeeId})`}>
                          <span className="font-medium text-orange-900">Applicant:</span> {r.applicantName}
                          <span className="text-gray-600 text-[8px]"> ({r.employeeId})</span>
                        </div>
                        <div
                          className="text-[8.5px] text-gray-700 truncate"
                          title={
                            off.withOfficer
                              ? `${off.name || '-'} (${off.id || '-'})${off.phone ? `, ${off.phone}` : ''}`
                              : '—'
                          }
                        >
                          <span className="font-medium">Officer:</span>{' '}
                          {off.withOfficer ? (
                            <>
                              {off.name || '-'}
                              <span className="text-gray-600 text-[8px]"> ({off.id || '-'})</span>
                              {off.phone ? <span className="text-gray-600 text-[8px]">, {off.phone}</span> : null}
                            </>
                          ) : (
                            '—'
                          )}
                        </div>
                      </Td>

                      <Td className="px-1.5 py-1 text-center">{chip(r.status)}</Td>

                      <Td className="px-1.5 py-1 whitespace-nowrap">
                        <div className="truncate" title={r.dateOfTravel}>
                          {r.dateOfTravel}
                        </div>
                        <div className="text-[8px] text-gray-600">
                          <span className="font-mono">{r.timeFrom}</span>–<span className="font-mono">{r.timeTo}</span>{' '}
                          {r.overnight ? '(overnight)' : ''}
                        </div>
                      </Td>

                      <Td className="px-1.5 py-1">
                        <div className="truncate" title={`${r.fromLocation} → ${r.toLocation}`}>
                          {r.fromLocation} → {r.toLocation}
                        </div>
                      </Td>

                      <Td className="px-1.5 py-1 whitespace-nowrap">
                        <div className="font-medium truncate" title={r.assignedVehicleNumber || '—'}>
                          {r.assignedVehicleNumber || '—'}
                        </div>
                        <div className="text-[8px] text-gray-600 truncate" title={r.assignedDriverName || '—'}>
                          {r.assignedDriverName || '—'}
                        </div>
                      </Td>

                      <Td className="px-1.5 py-1 whitespace-nowrap">
                        <div className="truncate" title={fmtDT(r.scheduledPickupAt)}>
                          P: {fmtDT(r.scheduledPickupAt)}
                        </div>
                        <div className="text-[8px] text-gray-600 truncate" title={fmtDT(r.scheduledReturnAt)}>
                          R: {fmtDT(r.scheduledReturnAt)}
                        </div>
                      </Td>

                      <Td className="px-1.5 py-1 whitespace-nowrap">
                        <div className="truncate" title={`Exit ${fmtDT(r.gateExitAt)} Odo ${r.exitOdometer ?? '-'}`}>
                          Ex {fmtDT(r.gateExitAt)}{' '}
                          <span className="text-[8px] text-gray-600">O {r.exitOdometer ?? '-'}</span>
                        </div>
                        <div className="truncate" title={`Entry ${fmtDT(r.gateEntryAt)} Odo ${r.entryOdometer ?? '-'}`}>
                          En {fmtDT(r.gateEntryAt)}{' '}
                          <span className="text-[8px] text-gray-600">O {r.entryOdometer ?? '-'}</span>
                        </div>
                      </Td>

                      {/* Row print */}
                      <Td className="px-1.5 py-1 text-center">
                        <button
                          type="button"
                          className="inline-flex items-center justify-center w-6 h-6 rounded bg-orange-600 text-white hover:bg-orange-700"
                          title="Print this row"
                          onClick={(e) => {
                            e.stopPropagation();
                            printOne(r);
                          }}
                        >
                          <Printer size={12} />
                        </button>
                      </Td>
                    </tr>
                  );
                })}

              {!loading && !filtered.length && (
                <tr>
                  <Td colSpan={9} className="px-2 py-6 text-center text-gray-500">
                    No requests found {ids.length ? `for ${ids.join(', ')}` : ''}.
                  </Td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>

      {/* -------- details modal opened by ROW CLICK -------- */}
      {view && <DetailsModal request={view} onClose={() => setView(null)} />}
    </div>
  );
}

/* ================= Details Modal ================= */
function DetailsModal({ request, onClose }: { request: UsageRequest; onClose: () => void }) {
  const off = extractOfficer(request as any);
  const yn = (b?: boolean) => (b ? 'Yes' : 'No');

  return (
    <div className="fixed inset-0 bg-black/40 grid place-items-center z-50 p-3" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-2 border-b bg-orange-50">
          <h3 className="font-bold text-orange-900 text-[12px]">Request • {(request as any).requestCode}</h3>
          <button className="p-1 rounded hover:bg-orange-100" onClick={onClose} aria-label="Close">
            <X size={14} />
          </button>
        </div>

        <div className="p-4 text-[10px] leading-tight space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Applicant & Department */}
            <section>
              <div className="text-orange-800 font-semibold mb-1">Applicant & Department</div>
              <div className="truncate">
                <span className="font-medium text-orange-900">Applicant Name:</span> {(request as any).applicantName}
                <span className="text-gray-600 text-[9px]"> ({(request as any).employeeId})</span>
              </div>
              <div className="truncate">
                <span className="font-medium">Department:</span> {(request as any).department || '—'}
              </div>
            </section>

            {/* Status */}
            <section>
              <div className="text-orange-800 font-semibold mb-1">Status</div>
              <div><b>Status:</b> {(request as any).status}</div>
              <div><b>Applied:</b> {appliedLabel(request as any)}</div>
              <div className="text-[9px] text-gray-600 mt-1">
                Created {fmtDT((request as any).createdAt)}
                {(request as any).updatedAt ? ` • Updated ${fmtDT((request as any).updatedAt)}` : ''}
              </div>
            </section>

            {/* Date & Time */}
            <section>
              <div className="text-orange-800 font-semibold mb-1">Date & Time</div>
              <div><b>Date of Travel:</b> {(request as any).dateOfTravel}</div>
              <div><b>Time From:</b> {(request as any).timeFrom || '—'}</div>
              <div><b>Time To:</b> {(request as any).timeTo || '—'} {(request as any).overnight ? '(overnight)' : ''}</div>
            </section>

            {/* Route */}
            <section>
              <div className="text-orange-800 font-semibold mb-1">Route</div>
              <div><b>From Location:</b> {(request as any).fromLocation}</div>
              <div><b>To Location:</b> {(request as any).toLocation}</div>
            </section>

            {/* Assignment */}
            <section>
              <div className="text-orange-800 font-semibold mb-1">Assignment</div>
              <div><b>Vehicle:</b> {(request as any).assignedVehicleNumber || '-'}</div>
              <div><b>Driver:</b> {(request as any).assignedDriverName || '-'} {(request as any).assignedDriverPhone ? `(${(request as any).assignedDriverPhone})` : ''}</div>
            </section>

            {/* Schedule */}
            <section>
              <div className="text-orange-800 font-semibold mb-1">Schedule</div>
              <div><b>Pickup:</b> {fmtDT((request as any).scheduledPickupAt)}</div>
              <div><b>Return:</b> {fmtDT((request as any).scheduledReturnAt)}</div>
            </section>

            {/* Official Trip Description / Goods / Officer */}
            <section className="md:col-span-2 border border-orange-100 rounded-lg p-3">
              <div className="text-orange-800 font-semibold mb-2">Official Trip Description / Goods</div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* LEFT: Official Trip Description + Goods */}
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

                {/* RIGHT: Travelling Officer details */}
                <div className="space-y-2">
                  <div>
                    <div className="text-gray-600">Travelling with Officer</div>
                    <div>{yn((request as any).travelWithOfficer || off.withOfficer)}</div>
                  </div>
                  <div>
                    <div className="text-gray-600">Name of Travelling Officer</div>
                    <div className="break-words">{off.withOfficer ? (off.name || '—') : '—'}</div>
                  </div>
                  <div>
                    <div className="text-gray-600">Travelling Officer Employee ID</div>
                    <div>{off.withOfficer ? (off.id || '—') : '—'}</div>
                  </div>
                  <div>
                    <div className="text-gray-600">Travelling Officer Phone</div>
                    <div>{off.withOfficer ? (off.phone || '—') : '—'}</div>
                  </div>
                </div>
              </div>
            </section>

            {/* Gate / Trip */}
            <section className="md:col-span-2">
              <div className="text-orange-800 font-semibold mb-1">Gate / Trip</div>
              <div>
                <b>Exit:</b> {fmtDT((request as any).gateExitAt)} • <span className="text-[9px] text-gray-600">O {(request as any).exitOdometer ?? '-'}</span>
              </div>
              <div>
                <b>Entry:</b> {fmtDT((request as any).gateEntryAt)} • <span className="text-[9px] text-gray-600">O {(request as any).entryOdometer ?? '-'}</span>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
