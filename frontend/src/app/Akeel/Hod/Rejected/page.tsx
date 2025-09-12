'use client';

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import HODSidebar from '../components/HODSidebar';
import { listByStatus } from '../../Transport/services/usageService';
import type { UsageRequest } from '../../Transport/services/types';
import { Th, Td } from '../../Transport/components/ThTd';
import SearchBar from '../../Transport/components/SearchBar';
import { Printer } from 'lucide-react';

/* ---------- helpers ---------- */
const fmtDT = (s?: string | null) => (s ? new Date(s).toLocaleString() : '-');

const chipRejected = () => (
  <span className="inline-block text-[8px] px-1 py-[1px] rounded bg-red-100 text-red-800 leading-none">
    REJECTED
  </span>
);

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

/** Travelling Officer from explicit fields OR "Travelling Officer: ..." text */
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

/* iframe-only print (no new tab) */
function printHtmlViaIframe(html: string) {
  const iframe = document.createElement('iframe');
  Object.assign(iframe.style, {
    position: 'fixed', right: '0', bottom: '0', width: '0', height: '0', border: '0',
  } as CSSStyleDeclaration);
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
export default function HODRejectedPage() {
  const [rows, setRows] = useState<UsageRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const list = await listByStatus('REJECTED');
        setRows(list || []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter((r: any) => {
      const off = extractOfficer(r);
      return [
        r.requestCode, 'rejected', r.applicantName, r.employeeId, r.department,
        r.fromLocation, r.toLocation, r.dateOfTravel, r.timeFrom, r.timeTo,
        r.assignedVehicleNumber, r.assignedDriverName, r.officialDescription, r.goods,
        off.name, off.id, off.phone, appliedLabel(r),
      ]
        .map((x) => (x ?? '').toString().toLowerCase())
        .join(' ')
        .includes(s);
    });
  }, [rows, q]);

  /* ---------------- print current table ---------------- */
  const printPage = useCallback(() => {
    const rowsHtml = filtered.map((r: any) => {
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
  <td class="center">REJECTED</td>
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
<html>
<head>
  <meta charset="utf-8" />
  <title>Rejected Requests - Print</title>
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
  <h3>Rejected Requests</h3>
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

  /* ---------------- print a single row ---------------- */
  const printOne = useCallback((r: any) => {
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
  <h2>Transport Request • ${r.requestCode || ''} (REJECTED)</h2>
  <div class="grid">
    <div><div class="block">Applicant Name</div>${r.applicantName || ''} <span class="sub">(${r.employeeId || ''})</span></div>
    <div><div class="block">Status</div>REJECTED</div>

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
    <tr><th>Official Trip Description</th><td>${r.officialDescription || '—'}</td></tr>
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

  /* ======================= UI ======================= */
  return (
    <div className="flex min-h-screen bg-orange-50">
      <HODSidebar />

      <main className="p-3 md:p-4 flex-1">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-[14px] md:text-lg font-bold text-orange-900">Rejected Requests</h1>
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
                    <tr key={r.id} className="align-top hover:bg-orange-50/40">
                      {/* RQ ID / Applied */}
                      <Td className="px-1.5 py-1 whitespace-nowrap">
                        <div className="font-semibold text-orange-900 truncate" title={r.requestCode}>
                          {r.requestCode}
                        </div>
                        <div className="text-[8px] text-gray-600 truncate" title={appliedLabel(r)}>
                          {appliedLabel(r)}
                        </div>
                      </Td>

                      {/* Applicant / Officer */}
                      <Td className="px-1.5 py-1">
                        <div className="truncate" title={`${r.applicantName} (${r.employeeId})`}>
                          <span className="font-medium text-orange-900">Applicant:</span> {r.applicantName}
                          <span className="text-gray-600 text-[8px]"> ({r.employeeId})</span>
                        </div>
                        <div
                          className="text-[8.5px] text-gray-700 truncate"
                          title={
                            off.withOfficer ? `${off.name || '-'} (${off.id || '-'})${off.phone ? `, ${off.phone}` : ''}` : '—'
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

                      {/* Status */}
                      <Td className="px-1.5 py-1 text-center">{chipRejected()}</Td>

                      {/* Travel */}
                      <Td className="px-1.5 py-1 whitespace-nowrap">
                        <div className="truncate" title={r.dateOfTravel}>
                          {r.dateOfTravel}
                        </div>
                        <div className="text-[8px] text-gray-600">
                          <span className="font-mono">{r.timeFrom}</span>–<span className="font-mono">{r.timeTo}</span>{' '}
                          {r.overnight ? '(overnight)' : ''}
                        </div>
                      </Td>

                      {/* Route */}
                      <Td className="px-1.5 py-1">
                        <div className="truncate" title={`${r.fromLocation} → ${r.toLocation}`}>
                          {r.fromLocation} → {r.toLocation}
                        </div>
                      </Td>

                      {/* Assigned */}
                      <Td className="px-1.5 py-1 whitespace-nowrap">
                        <div className="font-medium truncate" title={r.assignedVehicleNumber || '—'}>
                          {r.assignedVehicleNumber || '—'}
                        </div>
                        <div className="text-[8px] text-gray-600 truncate" title={r.assignedDriverName || '—'}>
                          {r.assignedDriverName || '—'}
                        </div>
                      </Td>

                      {/* Schedule */}
                      <Td className="px-1.5 py-1 whitespace-nowrap">
                        <div className="truncate" title={fmtDT(r.scheduledPickupAt)}>
                          P: {fmtDT(r.scheduledPickupAt)}
                        </div>
                        <div className="text-[8px] text-gray-600 truncate" title={fmtDT(r.scheduledReturnAt)}>
                          R: {fmtDT(r.scheduledReturnAt)}
                        </div>
                      </Td>

                      {/* Gate */}
                      <Td className="px-1.5 py-1 whitespace-nowrap">
                        <div className="truncate" title={`Exit ${fmtDT(r.gateExitAt)} Odo ${r.exitOdometer ?? '-'}`}>
                          Ex {fmtDT(r.gateExitAt)} <span className="text-[8px] text-gray-600">O {r.exitOdometer ?? '-'}</span>
                        </div>
                        <div className="truncate" title={`Entry ${fmtDT(r.gateEntryAt)} Odo ${r.entryOdometer ?? '-'}`}>
                          En {fmtDT(r.gateEntryAt)} <span className="text-[8px] text-gray-600">O {r.entryOdometer ?? '-'}</span>
                        </div>
                      </Td>

                      {/* Print */}
                      <Td className="px-1.5 py-1 text-center">
                        <button
                          type="button"
                          className="inline-flex items-center justify-center w-6 h-6 rounded bg-orange-600 text-white hover:bg-orange-700"
                          title="Print this row"
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
                  <Td colSpan={9} className="px-2 py-6 text-center text-gray-500">
                    No rejected requests
                  </Td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
