// 'use client';

// import * as React from 'react';
// import ApplicantSidebar from '../components/ApplicantSidebar';
// import { listMyRequests } from '../../Transport/services/usageService';
// import type { UsageRequest } from '../../Transport/services/types';
// import SearchBar from '../../Transport/components/SearchBar';
// import { Th, Td } from '../../Transport/components/ThTd';
// import { Printer } from 'lucide-react';

// /* ===== small helpers ===== */
// const chip = (s: string) => (
//   <span className="inline-block text-[8.5px] px-1 py-[1px] rounded bg-orange-100 text-orange-800 leading-none">
//     {s}
//   </span>
// );
// const fmtDT = (s?: string | null) => (s ? new Date(s).toLocaleString() : '-');

// /** Extract officer info from explicit fields or by parsing description/remarks */
// function extractOfficer(r?: Partial<UsageRequest> | null): {
//   withOfficer: boolean;
//   name?: string;
//   id?: string;
//   phone?: string;
// } {
//   if (!r) return { withOfficer: false };
//   const hasExplicit =
//     !!((r as any).travelWithOfficer || (r as any).officerName || (r as any).officerId || (r as any).officerPhone);

//   if (hasExplicit) {
//     return {
//       withOfficer: true,
//       name: (r as any).officerName || undefined,
//       id: (r as any).officerId || undefined,
//       phone: (r as any).officerPhone || undefined,
//     };
//   }

//   // Fallback: parse "Travelling Officer:" line from officialDescription / remarks
//   const text = `${(r as any)?.officialDescription ?? ''}\n${(r as any)?.remarks ?? ''}`;
//   const m = /Travelling Officer:\s*([^\(\n,]+)?(?:\s*\(Employee ID:\s*([^)]+)\))?(?:,\s*Phone:\s*([^\s,]+))?/i.exec(
//     text
//   );
//   if (m) return { withOfficer: true, name: m[1]?.trim(), id: m[2]?.trim(), phone: m[3]?.trim() };

//   return { withOfficer: false };
// }

// /** Stable key even if r.id is missing/null */
// const rowKey = (r: Partial<UsageRequest> | undefined, i: number) =>
//   String(
//     (r as any)?.id ??
//       (r as any)?.requestCode ??
//       `${(r as any)?.employeeId ?? 'row'}|${(r as any)?.dateOfTravel ?? ''}|${(r as any)?.createdAt ?? ''}|${i}`
//   );

// export default function ApplicantSearchPage() {
//   const [items, setItems] = React.useState<UsageRequest[]>([]);
//   const [employeeId, setEmployeeId] = React.useState('');
//   const [q, setQ] = React.useState('');
//   const [loading, setLoading] = React.useState(true);

//   /* load ALL pages so search & print cover full history */
//   React.useEffect(() => {
//     const id = localStorage.getItem('employeeId') || localStorage.getItem('actor') || '';
//     setEmployeeId(id);
//     if (!id) {
//       setItems([]);
//       setLoading(false);
//       return;
//     }
//     (async () => {
//       setLoading(true);
//       let all: UsageRequest[] = [];
//       let page = 0;
//       let total = 1;
//       try {
//         while (page < total) {
//           const p = await listMyRequests(id, page, 100);
//           all = all.concat(p?.content || []);
//           total = (p?.totalPages as number) ?? 1;
//           page = ((p?.number as number) ?? page) + 1;
//         }
//         all.sort((a: any, b: any) => {
//           const ta = a?.createdAt ? Date.parse(a.createdAt) : 0;
//           const tb = b?.createdAt ? Date.parse(b.createdAt) : 0;
//           return tb - ta;
//         });
//       } finally {
//         setItems(all);
//         setLoading(false);
//       }
//     })();
//   }, []);

//   const filtered = React.useMemo(() => {
//     const s = q.trim().toLowerCase();
//     if (!s) return items;
//     return items.filter((r: any) => {
//       const off = extractOfficer(r);
//       return [
//         r?.requestCode,
//         r?.status,
//         r?.fromLocation,
//         r?.toLocation,
//         r?.assignedVehicleNumber,
//         r?.assignedDriverName,
//         r?.applicantName,
//         r?.employeeId,
//         r?.dateOfTravel,
//         r?.timeFrom,
//         r?.timeTo,
//         r?.officialDescription,
//         r?.goods,
//         off.name,
//         off.id,
//         off.phone,
//       ]
//         .map((x: any) => (x ?? '').toString().toLowerCase())
//         .join(' ')
//         .includes(s);
//     });
//   }, [items, q]);

//   /* ===== PRINT ALL (current filter) ===== */
//   const printAllCurrent = React.useCallback(() => {
//     const rows = filtered
//       .map((r: any) => {
//         const off = extractOfficer(r);
//         const applied = r?.appliedDate ?? (r?.createdAt ? fmtDT(r.createdAt) : '-');
//         return `
// <tr>
//   <td><div class="rq">${r?.requestCode || ''}</div><div class="sub">${applied}</div></td>
//   <td>
//     <div><b>Applicant:</b> ${r?.applicantName || ''} <span class="sub">(${r?.employeeId || ''})</span></div>
//     <div><b>Officer:</b> ${
//       off.withOfficer ? `${off.name || '-'} <span class="sub">(${off.id || '-'})</span>${off.phone ? `, ${off.phone}` : ''}` : '—'
//     }</div>
//   </td>
//   <td class="center">${r?.status || ''}</td>
//   <td>
//     <div>${r?.dateOfTravel || ''}</div>
//     <div class="sub mono">${r?.timeFrom || ''} – ${r?.timeTo || ''} ${r?.overnight ? '(overnight)' : ''}</div>
//   </td>
//   <td>${r?.fromLocation || ''} → ${r?.toLocation || ''}</td>
//   <td>
//     <div>${r?.assignedVehicleNumber || '—'}</div>
//     <div class="sub">${r?.assignedDriverName || '—'}</div>
//   </td>
//   <td>
//     <div>P: ${fmtDT(r?.scheduledPickupAt)}</div>
//     <div class="sub">R: ${fmtDT(r?.scheduledReturnAt)}</div>
//   </td>
//   <td>
//     <div>Ex ${fmtDT(r?.gateExitAt)} <span class="sub">O ${r?.exitOdometer ?? '-'}</span></div>
//     <div>En ${fmtDT(r?.gateEntryAt)} <span class="sub">O ${r?.entryOdometer ?? '-'}</span></div>
//   </td>
// </tr>`;
//       })
//       .join('');

//     const html = `<!DOCTYPE html>
// <html>
// <head>
// <meta charset="utf-8"/>
// <title>Search Results — Print</title>
// <meta name="viewport" content="width=device-width,initial-scale=1"/>
// <style>
// :root { --fg:#111; --muted:#666; --head:#faf5f0; }
// *{box-sizing:border-box}
// html,body{width:100%;height:100%}
// body{margin:0;padding:10mm;font-family:system-ui,Arial,sans-serif;color:var(--fg)}
// h3{margin:0 0 8px 0}
// .meta{margin:4px 0 8px 0;font-size:11px;color:var(--muted)}
// table{width:100%;border-collapse:collapse;table-layout:fixed}
// thead{display:table-header-group}
// tr,td,th{page-break-inside:avoid;break-inside:avoid}
// th,td{border:1px solid #ddd;padding:6px 8px;vertical-align:top;font-size:11px}
// th{background:var(--head);text-align:left}
// .center{text-align:center}
// .sub{color:var(--muted);font-size:10px}
// .mono{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}
// .rq{font-weight:600;color:#8b4513}
// col.c1{width:12%}col.c2{width:18%}col.c3{width:8%}col.c4{width:12%}
// col.c5{width:16%}col.c6{width:12%}col.c7{width:11%}col.c8{width:11%}
// @media print{ @page{size:A4 landscape;margin:8mm} body{padding:0} }
// </style>
// </head>
// <body>
//   <h3>My Requests — Search Results</h3>
//   <div class="meta">Results: ${filtered.length}</div>
//   <table>
//     <colgroup><col class="c1"/><col class="c2"/><col class="c3"/><col class="c4"/><col class="c5"/><col class="c6"/><col class="c7"/><col class="c8"/></colgroup>
//     <thead>
//       <tr>
//         <th>RQ ID / Applied</th>
//         <th>Applicant / Officer</th>
//         <th class="center">Status</th>
//         <th>Travel</th>
//         <th>Route</th>
//         <th>Assigned</th>
//         <th>Schedule</th>
//         <th>Gate</th>
//       </tr>
//     </thead>
//     <tbody>${rows || '<tr><td colspan="8">No data</td></tr>'}</tbody>
//   </table>
//   <script>window.addEventListener('load',()=>setTimeout(()=>{window.focus();window.print();},150));</script>
// </body>
// </html>`;

//     try {
//       const blob = new Blob([html], { type: 'text/html' });
//       const url = URL.createObjectURL(blob);
//       const w = window.open(url, '_blank', 'noopener');
//       if (w) {
//         w.addEventListener?.('load', () => { try { w.focus(); w.print(); } catch {} });
//         setTimeout(() => URL.revokeObjectURL(url), 60_000);
//         return;
//       }
//     } catch {}
//     const iframe = document.createElement('iframe');
//     iframe.style.position = 'fixed'; iframe.style.right = '0'; iframe.style.bottom = '0';
//     iframe.style.width = '0'; iframe.style.height = '0'; iframe.style.border = '0';
//     document.body.appendChild(iframe);
//     const doc = iframe.contentWindow?.document;
//     if (doc) {
//       doc.open(); doc.write(html); doc.close();
//       iframe.onload = () => {
//         iframe.contentWindow?.focus();
//         iframe.contentWindow?.print();
//         setTimeout(() => document.body.removeChild(iframe), 1000);
//       };
//     }
//   }, [filtered]);

//   /* ===== PRINT ONE (single row) ===== */
//   const printOne = React.useCallback((r: any) => {
//     const off = extractOfficer(r);
//     const html = `<!DOCTYPE html>
// <html>
// <head>
// <meta charset="utf-8"/>
// <title>${r?.requestCode || 'Request'} — Print</title>
// <meta name="viewport" content="width=device-width,initial-scale=1"/>
// <style>
// :root { --fg:#111; --muted:#666; --head:#faf5f0; }
// *{box-sizing:border-box}
// html,body{width:100%;height:100%}
// body{margin:0;padding:12mm;font-family:system-ui,Arial,sans-serif;color:#111}
// h2{margin:0 0 12px 0}
// .grid{display:grid;grid-template-columns:1fr 1fr;gap:8px 16px;font-size:12px}
// .block{margin:8px 0 2px;font-weight:600;color:#8b4513}
// .sub{color:#666;font-size:11px}
// table{width:100%;border-collapse:collapse;margin-top:10px}
// th,td{border:1px solid #ddd;padding:6px 8px;font-size:12px;vertical-align:top}
// th{background:#faf5f0;text-align:left;width:30%}
// @media print{ @page{size:A4 portrait;margin:10mm} body{padding:0} }
// </style>
// </head>
// <body>
//   <h2>Transport Request • ${r?.requestCode || ''}</h2>
//   <div class="grid">
//     <div><div class="block">Applicant</div>${r?.applicantName || ''} <span class="sub">(${r?.employeeId || ''})</span></div>
//     <div><div class="block">Status</div>${r?.status || ''}</div>

//     <div><div class="block">Travelling Officer</div>${
//       off.withOfficer
//         ? `${off.name || '-'} <span class="sub">(${off.id || '-'})</span>${off.phone ? `, ${off.phone}` : ''}`
//         : '—'
//     }</div>
//     <div><div class="block">Department</div>${r?.department || ''}</div>

//     <div><div class="block">Travel</div>${r?.dateOfTravel || ''} • ${r?.timeFrom || ''} – ${r?.timeTo || ''} ${
//       r?.overnight ? '(overnight)' : ''
//     }</div>
//     <div><div class="block">Route</div>${r?.fromLocation || ''} → ${r?.toLocation || ''}</div>
//   </div>

//   <table>
//     <tr><th>Vehicle</th><td>${r?.assignedVehicleNumber || '—'}</td></tr>
//     <tr><th>Driver</th><td>${r?.assignedDriverName || '—'} ${r?.assignedDriverPhone ? `(${r.assignedDriverPhone})` : ''}</td></tr>
//     <tr><th>Schedule</th><td>P: ${fmtDT(r?.scheduledPickupAt)}<br/>R: ${fmtDT(r?.scheduledReturnAt)}</td></tr>
//     <tr><th>Gate / Odometer</th><td>
//       Exit: ${fmtDT(r?.gateExitAt)} • O ${r?.exitOdometer ?? '-'}<br/>
//       Entry: ${fmtDT(r?.gateEntryAt)} • O ${r?.entryOdometer ?? '-'}
//     </td></tr>
//     <tr><th>Purpose</th><td>${r?.officialDescription || '—'}</td></tr>
//     <tr><th>Goods</th><td>${r?.goods || '—'}</td></tr>
//   </table>

//   <script>window.addEventListener('load',()=>setTimeout(()=>{window.focus();window.print();},150));</script>
// </body>
// </html>`;
//     try {
//       const blob = new Blob([html], { type: 'text/html' });
//       const url = URL.createObjectURL(blob);
//       const w = window.open(url, '_blank', 'noopener');
//       if (w) {
//         w.addEventListener?.('load', () => { try { w.focus(); w.print(); } catch {} });
//         setTimeout(() => URL.revokeObjectURL(url), 60_000);
//         return;
//       }
//     } catch {}
//     const iframe = document.createElement('iframe');
//     iframe.style.position = 'fixed'; iframe.style.right = '0'; iframe.style.bottom = '0';
//     iframe.style.width = '0'; iframe.style.height = '0'; iframe.style.border = '0';
//     document.body.appendChild(iframe);
//     const doc = iframe.contentWindow?.document;
//     if (doc) {
//       doc.open(); doc.write(html); doc.close();
//       iframe.onload = () => {
//         iframe.contentWindow?.focus();
//         iframe.contentWindow?.print();
//         setTimeout(() => document.body.removeChild(iframe), 1000);
//       };
//     }
//   }, []);

//   return (
//     <div className="flex min-h-screen bg-orange-50">
//       <ApplicantSidebar />
//       <main className="p-2 md:p-3 flex-1">
//         <div className="flex items-center justify-between mb-2">
//           <h1 className="text-[12px] font-semibold text-orange-900">Search My Requests</h1>

//           <button
//             type="button"
//             onClick={printAllCurrent}
//             className="inline-flex items-center gap-1 px-2.5 h-7 rounded bg-orange-600 text-white hover:bg-orange-700 text-[11px]"
//             title="Print all (current filter)"
//           >
//             <Printer size={13} />
//             Print Page
//           </button>
//         </div>

//         <SearchBar value={q} onChange={setQ} placeholder="Search code, route, status, vehicle, driver, officer…" />

//         {!employeeId && (
//           <div className="mt-2 mb-2 text-[9px] rounded bg-yellow-50 border border-yellow-200 text-yellow-800 px-2 py-1">
//             Submit a request first to save your Employee ID locally, then search here.
//           </div>
//         )}

//         <div className="bg-white rounded-md border border-orange-200 overflow-auto mt-2">
//           <table className="w-full table-fixed text-[9.5px] leading-[1.12]">
//             {/* keep colgroup on one line to avoid whitespace text nodes in Next.js */}
//             <colgroup><col className="w-28"/><col className="w-56"/><col className="w-44"/><col className="w-36"/><col className="w-40"/><col className="w-24"/><col className="w-16"/></colgroup>
//             <thead className="bg-orange-50">
//               <tr className="text-[9px]">
//                 <Th className="px-2 py-1 text-left">Code</Th>
//                 <Th className="px-2 py-1 text-left">APPLICANT / OFFICER</Th>
//                 <Th className="px-2 py-1 text-left">Route</Th>
//                 <Th className="px-2 py-1 text-left">Travel</Th>
//                 <Th className="px-2 py-1 text-left">Assigned</Th>
//                 <Th className="px-2 py-1 text-center">Status</Th>
//                 <Th className="px-2 py-1 text-center">Print</Th>
//               </tr>
//             </thead>
//             <tbody className="divide-y">
//               {loading && (
//                 <tr>
//                   <Td colSpan={7} className="px-2 py-6 text-center text-gray-500">Loading…</Td>
//                 </tr>
//               )}

//               {!loading &&
//                 filtered.map((r: any, i: number) => {
//                   const off = extractOfficer(r);
//                   return (
//                     <tr key={rowKey(r, i)} className="align-top hover:bg-orange-50/40">
//                       {/* Code */}
//                       <Td className="px-2 py-1">
//                         <div className="font-semibold text-orange-900 truncate" title={r?.requestCode || ''}>
//                           {r?.requestCode || '—'}
//                         </div>
//                       </Td>

//                       {/* People (Applicant / Officer) */}
//                       <Td className="px-2 py-1">
//                         <div className="truncate" title={`${r?.applicantName || ''} (${r?.employeeId || ''})`}>
//                           <span className="font-medium text-orange-900">Applicant:</span> {r?.applicantName || '—'}
//                           <span className="text-gray-600 text-[8.5px]"> ({r?.employeeId || '—'})</span>
//                         </div>
//                         <div
//                           className="text-[9px] text-gray-700 truncate"
//                           title={off.withOfficer ? `${off.name || '-'} (${off.id || '-'})${off.phone ? `, ${off.phone}` : ''}` : '—'}
//                         >
//                           <span className="font-medium">Officer:</span>{' '}
//                           {off.withOfficer ? (
//                             <>
//                               {off.name || '-'}
//                               <span className="text-gray-600 text-[8.5px]"> ({off.id || '-'})</span>
//                               {off.phone ? <span className="text-gray-600 text-[8.5px]">, {off.phone}</span> : null}
//                             </>
//                           ) : (
//                             '—'
//                           )}
//                         </div>
//                       </Td>

//                       {/* Route */}
//                       <Td className="px-2 py-1">
//                         <div className="truncate" title={`${r?.fromLocation || ''} → ${r?.toLocation || ''}`}>
//                           {(r?.fromLocation || '—')} → {(r?.toLocation || '—')}
//                         </div>
//                       </Td>

//                       {/* Travel */}
//                       <Td className="px-2 py-1">
//                         <div className="truncate">{r?.dateOfTravel || '—'}</div>
//                         <div className="text-[8.5px] text-gray-600">
//                           <span className="font-mono">{r?.timeFrom || '—'}</span>–<span className="font-mono">{r?.timeTo || '—'}</span>{' '}
//                           {r?.overnight ? '(overnight)' : ''}
//                         </div>
//                       </Td>

//                       {/* Assigned */}
//                       <Td className="px-2 py-1">
//                         <div className="font-medium truncate" title={r?.assignedVehicleNumber || '—'}>
//                           {r?.assignedVehicleNumber || '—'}
//                         </div>
//                         <div className="text-[8.5px] text-gray-600 truncate" title={r?.assignedDriverName || '—'}>
//                           {r?.assignedDriverName || '—'}
//                         </div>
//                       </Td>

//                       {/* Status */}
//                       <Td className="px-2 py-1 text-center">{chip(r?.status || '—')}</Td>

//                       {/* Print row */}
//                       <Td className="px-2 py-1 text-center">
//                         <button
//                           type="button"
//                           className="inline-flex items-center justify-center w-6 h-6 rounded bg-orange-600 text-white hover:bg-orange-700"
//                           title="Print this row"
//                           onClick={() => printOne(r)}
//                         >
//                           <Printer size={12} />
//                         </button>
//                       </Td>
//                     </tr>
//                   );
//                 })}

//               {!loading && !filtered.length && (
//                 <tr>
//                   <Td colSpan={7} className="px-2 py-6 text-center text-gray-500">
//                     No results
//                   </Td>
//                 </tr>
//               )}
//             </tbody>
//           </table>
//         </div>
//       </main>
//     </div>
//   );
// }
