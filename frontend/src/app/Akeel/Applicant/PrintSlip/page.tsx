// 'use client';

// import * as React from 'react';
// import ApplicantSidebar from '../components/ApplicantSidebar';
// import { listMyRequests } from '../../Transport/services/usageService';
// import type { UsageRequest } from '../../Transport/services/types';
// import { Th, Td } from '../../Transport/components/ThTd';
// import { Printer, Search, X } from 'lucide-react';

// /* ---------------- helpers ---------------- */
// const fmtDT = (s?: string | null) => (s ? new Date(s).toLocaleString() : '-');

// const chip = (s: string) => (
//   <span className="inline-block text-[8.5px] px-1 py-[1px] rounded bg-orange-100 text-orange-800 leading-none">
//     {s}
//   </span>
// );

// /** Safely extract officer details from explicit fields or parse fallback text */
// function extractOfficer(
//   r?: Partial<UsageRequest> | null
// ): { withOfficer: boolean; name?: string; id?: string } {
//   if (!r) return { withOfficer: false };
//   const anyr = r as any;
//   if (anyr.travelWithOfficer || anyr.officerName || anyr.officerId) {
//     return {
//       withOfficer: !!(anyr.travelWithOfficer || anyr.officerName || anyr.officerId),
//       name: anyr.officerName || undefined,
//       id: anyr.officerId || undefined,
//     };
//   }
//   const text = `${anyr?.officialDescription ?? ''}\n${anyr?.remarks ?? ''}`;
//   const m = /Travelling Officer:\s*([^\(\n,]+)?(?:\s*\(Employee ID:\s*([^)]+)\))?/i.exec(text);
//   if (m) return { withOfficer: true, name: m[1]?.trim(), id: m[2]?.trim() };
//   return { withOfficer: false };
// }

// /** Compose a stable key for a row, even if id is missing */
// function rowKey(r: any, i: number): string {
//   return String(r?.id ?? r?.requestCode ?? `${r?.employeeId ?? 'row'}-${r?.dateOfTravel ?? ''}-${i}`);
// }

// /* -------- iframe-only print helper (no new tab / about:blank) -------- */
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

// /* ---------------- page ---------------- */
// export default function ApplicantPrintSlipPage() {
//   const [items, setItems] = React.useState<UsageRequest[]>([]);
//   const [employeeId, setEmployeeId] = React.useState('');
//   const [q, setQ] = React.useState('');
//   const [view, setView] = React.useState<UsageRequest | null>(null);

//   React.useEffect(() => {
//     const id =
//       (typeof window !== 'undefined' && (localStorage.getItem('employeeId') || localStorage.getItem('actor'))) ||
//       '';
//     setEmployeeId(id);
//     if (!id) return;

//     let cancelled = false;
//     (async () => {
//       try {
//         const seen = new Set<string>();
//         const mkKey = (r: any) =>
//           String(r?.id ?? r?.requestCode ?? `${r?.employeeId ?? 'row'}|${r?.dateOfTravel ?? ''}|${r?.createdAt ?? ''}`);

//         let all: UsageRequest[] = [];
//         let page = 0;
//         let total = 1;

//         while (!cancelled && page < total) {
//           const p: any = await listMyRequests(id, page, 100);
//           const batch: any[] = Array.isArray(p?.content) ? p.content : [];
//           if (!batch.length) break;

//           for (const item of batch) {
//             if (!item || typeof item !== 'object') continue;
//             const k = mkKey(item);
//             if (!seen.has(k)) {
//               seen.add(k);
//               all.push(item as UsageRequest);
//             }
//           }

//           total = Number.isFinite(p?.totalPages) ? p.totalPages : 1;
//           const current = Number.isFinite(p?.number) ? p.number : page;
//           page = current + 1;
//         }

//         // newest first by createdAt
//         all.sort((a: any, b: any) => {
//           const ta = a?.createdAt ? Date.parse(a.createdAt) : 0;
//           const tb = b?.createdAt ? Date.parse(b.createdAt) : 0;
//           return tb - ta;
//         });

//         if (!cancelled) setItems(all);
//       } catch {
//         if (!cancelled) setItems([]);
//       }
//     })();

//     return () => { cancelled = true; };
//   }, []);

//   // Only slips that make sense to print
//   const ready = React.useMemo(
//     () => items.filter((r) => r && ['APPROVED', 'SCHEDULED', 'DISPATCHED', 'COMPLETED'].includes(r.status)),
//     [items]
//   );

//   const filtered = React.useMemo(() => {
//     const s = q.trim().toLowerCase();
//     if (!s) return ready;
//     return ready.filter((r: any) => {
//       if (!r) return false;
//       const off = extractOfficer(r);
//       return [
//         r.requestCode, r.status, r.applicantName, r.employeeId, off.name, off.id,
//         r.fromLocation, r.toLocation, r.assignedVehicleNumber, r.assignedDriverName, r.dateOfTravel,
//       ].map((x) => (x ?? '').toString().toLowerCase()).join(' ').includes(s);
//     });
//   }, [ready, q]);

//   /* -------- Print all current rows (compact table) -------- */
//   const printAllCurrent = React.useCallback(() => {
//     const rowsHtml = filtered.map((r: any) => {
//       const applied = (r as any)?.appliedDate ?? (r?.createdAt ? fmtDT(r.createdAt) : '-');
//       const off = extractOfficer(r);
//       return `
// <tr>
//   <td><div class="rq">${r?.requestCode || ''}</div><div class="sub">${applied}</div></td>
//   <td>
//     <div><b>Applicant:</b> ${r?.applicantName || ''} <span class="sub">(${r?.employeeId || ''})</span></div>
//     <div><b>Officer:</b> ${off.withOfficer ? `${off.name || '-'} <span class="sub">(${off.id || '-'})</span>` : '—'}</div>
//   </td>
//   <td>${r?.dateOfTravel || ''}<div class="sub mono">${r?.timeFrom || ''} – ${r?.timeTo || ''} ${r?.overnight ? '(overnight)' : ''}</div></td>
//   <td>${r?.fromLocation || ''} → ${r?.toLocation || ''}</td>
//   <td>
//     <div>${r?.assignedVehicleNumber || '—'}</div>
//     <div class="sub">${r?.assignedDriverName || '—'}</div>
//   </td>
//   <td>
//     <div>P: ${fmtDT(r?.scheduledPickupAt)}</div>
//     <div class="sub">R: ${fmtDT(r?.scheduledReturnAt)}</div>
//   </td>
//   <td class="center">${r?.status || ''}</td>
// </tr>`;
//     }).join('');

//     const html = `<!DOCTYPE html>
// <html>
// <head>
//   <meta charset="utf-8" />
//   <title>Print Slips - List</title>
//   <meta name="viewport" content="width=device-width, initial-scale=1" />
//   <style>
//     :root { --fg:#111; --muted:#666; --head:#faf5f0; }
//     * { box-sizing: border-box; }
//     html, body { width: 100%; height: 100%; }
//     body { margin: 0; padding: 10mm; font-family: system-ui, Arial, sans-serif; color: var(--fg); }
//     h3 { margin: 0 0 8px 0; }
//     .meta { margin: 4px 0 8px 0; font-size: 11px; color: var(--muted); }
//     table { width: 100%; border-collapse: collapse; table-layout: fixed; }
//     thead { display: table-header-group; }
//     tr, td, th { page-break-inside: avoid; break-inside: avoid; }
//     th, td { border: 1px solid #ddd; padding: 6px 8px; vertical-align: top; font-size: 11px; }
//     th { background: var(--head); text-align: left; }
//     .center { text-align: center; }
//     .sub { color: var(--muted); font-size: 10px; }
//     .mono { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }
//     .rq { font-weight: 600; color: #8b4513; }
//     col.c1{width:13%}col.c2{width:22%}col.c3{width:14%}col.c4{width:18%}col.c5{width:13%}col.c6{width:12%}col.c7{width:8%}
//     @media print { @page { size: A4 landscape; margin: 8mm; } body { padding: 0; } }
//   </style>
// </head>
// <body>
//   <h3>Transport Requests Ready to Print</h3>
//   <div class="meta">Results: ${filtered.length}</div>
//   <table>
//     <colgroup><col class="c1"/><col class="c2"/><col class="c3"/><col class="c4"/><col class="c5"/><col class="c6"/><col class="c7"/></colgroup>
//     <thead>
//       <tr>
//         <th>RQ ID / Applied</th>
//         <th>People</th>
//         <th>Travel</th>
//         <th>Route</th>
//         <th>Assigned</th>
//         <th>Schedule</th>
//         <th class="center">Status</th>
//       </tr>
//     </thead>
//     <tbody>${rowsHtml || '<tr><td colspan="7">No data</td></tr>'}</tbody>
//   </table>
//   <script>addEventListener('load',()=>setTimeout(()=>{focus();print();},150));</script>
// </body>
// </html>`;
//     printHtmlViaIframe(html);
//   }, [filtered]);

//   /* -------- Print one slip (detailed, A4 portrait) -------- */
//   const printOneSlip = React.useCallback((r: any) => {
//     const off = extractOfficer(r);
//     const html = `<!DOCTYPE html>
// <html>
// <head>
//   <meta charset="utf-8" />
//   <title>${r?.requestCode || 'Request'} - Slip</title>
//   <meta name="viewport" content="width=device-width, initial-scale=1" />
//   <style>
//     :root { --fg:#111; --muted:#666; --head:#faf5f0; }
//     * { box-sizing: border-box; }
//     html, body { width: 100%; height: 100%; }
//     body { margin: 0; padding: 12mm; font-family: system-ui, Arial, sans-serif; color: var(--fg); }
//     h2 { margin: 0 0 12px 0; }
//     .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 16px; font-size: 12px; }
//     .block { margin: 8px 0 2px; font-weight: 600; color: #8b4513; }
//     .sub { color: var(--muted); font-size: 11px; }
//     table { width: 100%; border-collapse: collapse; margin-top: 10px; }
//     th, td { border: 1px solid #ddd; padding: 6px 8px; font-size: 12px; vertical-align: top; }
//     th { background: var(--head); text-align: left; width: 30%; }
//     @media print { @page { size: A4 portrait; margin: 10mm; } body { padding: 0; } }
//   </style>
// </head>
// <body>
//   <h2>Transport Request • ${r?.requestCode || ''}</h2>
//   <div class="grid">
//     <div><div class="block">Applicant</div>${r?.applicantName || ''} <span class="sub">(${r?.employeeId || ''})</span></div>
//     <div><div class="block">Status</div>${r?.status || ''}</div>

//     <div><div class="block">Travelling Officer</div>${off.withOfficer ? `${off.name || '-'} <span class="sub">(${off.id || '-'})</span>` : '—'}</div>
//     <div><div class="block">Department</div>${r?.department || ''}</div>

//     <div><div class="block">Travel</div>${r?.dateOfTravel || ''} • ${r?.timeFrom || ''} – ${r?.timeTo || ''} ${r?.overnight ? '(overnight)' : ''}</div>
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

//   <script>addEventListener('load',()=>setTimeout(()=>{focus();print();},150));</script>
// </body>
// </html>`;
//     printHtmlViaIframe(html);
//   }, []);

//   return (
//     <div className="flex min-h-screen bg-orange-50">
//       <ApplicantSidebar />
//       <main className="p-2 md:p-3 flex-1">
//         <div className="flex items-center justify-between mb-2">
//           <h1 className="text-[12px] font-semibold text-orange-900">Print Slips</h1>

//           <div className="flex items-center gap-2">
//             <label className="relative">
//               <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500" />
//               <input
//                 value={q}
//                 onChange={(e) => setQ(e.target.value)}
//                 placeholder="Search…"
//                 className="pl-6 pr-2 py-1 rounded border border-orange-200 text-[11px] h-7 w-[200px] focus:outline-none focus:ring-1 focus:ring-orange-300"
//               />
//             </label>

//             <button
//               type="button"
//               onClick={printAllCurrent}
//               disabled={!filtered.length}
//               className="inline-flex items-center gap-1 px-2.5 h-7 rounded bg-orange-600 text-white hover:bg-orange-700 disabled:opacity-60 text-[11px]"
//               title="Print all rows"
//             >
//               <Printer size={13} />
//               Print Page
//             </button>
//           </div>
//         </div>

//         {!employeeId && (
//           <div className="mb-2 text-[10px] rounded bg-yellow-50 border border-yellow-200 text-yellow-800 px-2 py-1">
//             Submit a request first to save your Employee ID, then return here.
//           </div>
//         )}

//         <div className="bg-white rounded-md border border-orange-200 overflow-auto">
//           {/* fixed-width columns – keep colgroup on a single line to avoid whitespace text nodes */}
//           <table className="w-full table-fixed text-[9.5px] leading-[1.15]">
//             <colgroup><col className="w-28"/><col className="w-52"/><col className="w-36"/><col className="w-44"/><col className="w-40"/><col className="w-40"/><col className="w-20"/><col className="w-20"/></colgroup>

//             <thead className="bg-orange-50">
//               <tr className="text-[9px]">
//                 <Th className="px-2 py-1 text-left">Code / Applied</Th>
//                 <Th className="px-2 py-1 text-left">People</Th>
//                 <Th className="px-2 py-1 text-left">Travel</Th>
//                 <Th className="px-2 py-1 text-left">Route</Th>
//                 <Th className="px-2 py-1 text-left">Assigned</Th>
//                 <Th className="px-2 py-1 text-left">Schedule</Th>
//                 <Th className="px-2 py-1 text-center">Status</Th>
//                 <Th className="px-2 py-1 text-center">Print</Th>
//               </tr>
//             </thead>

//             <tbody className="divide-y">
//               {filtered.map((r, i) => {
//                 if (!r) return null;
//                 const applied = (r as any)?.appliedDate ?? (r.createdAt ? fmtDT(r.createdAt) : '-');
//                 const off = extractOfficer(r);
//                 return (
//                   <tr
//                     key={rowKey(r, i)}
//                     className="align-top hover:bg-orange-50/40 cursor-pointer"
//                     onClick={() => setView(r)} // row click → open modal
//                     onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setView(r); }}
//                     tabIndex={0}
//                     role="button"
//                     title="Click to view details"
//                   >
//                     <Td className="px-2 py-1">
//                       <div className="font-semibold text-orange-900 truncate" title={r.requestCode || ''}>
//                         {r.requestCode || '—'}
//                       </div>
//                       <div className="text-[8.5px] text-gray-600 truncate" title={applied}>
//                         {applied}
//                       </div>
//                     </Td>

//                     <Td className="px-2 py-1">
//                       <div className="truncate" title={`${r.applicantName || ''} (${r.employeeId || ''})`}>
//                         <span className="font-medium text-orange-900">Applicant:</span> {r.applicantName || '—'}
//                         <span className="text-gray-600 text-[8.5px]"> ({r.employeeId || '—'})</span>
//                       </div>
//                       <div
//                         className="text-[9px] text-gray-700 truncate"
//                         title={off.withOfficer ? `${off.name || '-'} (${off.id || '-'})` : '—'}
//                       >
//                         <span className="font-medium">Officer:</span>{' '}
//                         {off.withOfficer ? (
//                           <>
//                             {off.name || '-'}
//                             <span className="text-gray-600 text-[8.5px]"> ({off.id || '-'})</span>
//                           </>
//                         ) : '—'}
//                       </div>
//                     </Td>

//                     <Td className="px-2 py-1">
//                       <div className="truncate" title={r.dateOfTravel || ''}>
//                         {r.dateOfTravel || '—'}
//                       </div>
//                       <div className="text-[8.5px] text-gray-600">
//                         <span className="font-mono">{r.timeFrom || '—'}</span>–<span className="font-mono">{r.timeTo || '—'}</span>{' '}
//                         {r.overnight ? '(overnight)' : ''}
//                       </div>
//                     </Td>

//                     <Td className="px-2 py-1">
//                       <div className="truncate" title={`${r.fromLocation || ''} → ${r.toLocation || ''}`}>
//                         {(r.fromLocation || '—')} → {(r.toLocation || '—')}
//                       </div>
//                     </Td>

//                     <Td className="px-2 py-1">
//                       <div className="font-medium truncate" title={r.assignedVehicleNumber || '—'}>
//                         {r.assignedVehicleNumber || '—'}
//                       </div>
//                       <div className="text-[8.5px] text-gray-600 truncate" title={r.assignedDriverName || '—'}>
//                         {r.assignedDriverName || '—'}
//                       </div>
//                     </Td>

//                     <Td className="px-2 py-1">
//                       <div className="truncate" title={fmtDT(r.scheduledPickupAt)}>
//                         P: {fmtDT(r.scheduledPickupAt)}
//                       </div>
//                       <div className="text-[8.5px] text-gray-600 truncate" title={fmtDT(r.scheduledReturnAt)}>
//                         R: {fmtDT(r.scheduledReturnAt)}
//                       </div>
//                     </Td>

//                     <Td className="px-2 py-1 text-center">{chip(r.status || '—')}</Td>

//                     {/* row print button (doesn't bubble to row click) */}
//                     <Td className="px-2 py-1 text-center">
//                       <button
//                         className="inline-flex items-center justify-center w-6 h-6 rounded bg-orange-600 text-white hover:bg-orange-700"
//                         onClick={(e) => { e.stopPropagation(); printOneSlip(r); }}
//                         title="Print slip"
//                       >
//                         <Printer size={12} />
//                       </button>
//                     </Td>
//                   </tr>
//                 );
//               })}

//               {!filtered.length && (
//                 <tr>
//                   <Td colSpan={8} className="text-center text-gray-500 py-6">
//                     Nothing to print
//                   </Td>
//                 </tr>
//               )}
//             </tbody>
//           </table>
//         </div>
//       </main>

//       {view && <DetailsModal request={view} onClose={() => setView(null)} />}
//     </div>
//   );
// }

// /* --- Compact details modal (opened by row click) --- */
// function DetailsModal({ request, onClose }: { request: UsageRequest; onClose: () => void }) {
//   const off = extractOfficer(request);
//   return (
//     <div
//       className="fixed inset-0 bg-black/40 grid place-items-center z-50 p-3"
//       onClick={onClose}
//       onKeyDown={(e) => { if (e.key === 'Escape') onClose(); }}
//       role="dialog"
//       aria-modal="true"
//     >
//       <div
//         className="bg-white rounded-lg shadow-xl w-full max-w-2xl overflow-hidden"
//         onClick={(e) => e.stopPropagation()}
//       >
//         <div className="flex items-center justify-between px-3 py-2 border-b bg-orange-50">
//           <h3 className="font-bold text-orange-900 text-[11px]">Request • {request?.requestCode || '—'}</h3>
//           <button className="p-1 rounded hover:bg-orange-100" onClick={onClose} aria-label="Close">
//             <X size={13} />
//           </button>
//         </div>

//         <div className="p-3 text-[10px] leading-tight space-y-3">
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
//             <section>
//               <div className="text-orange-800 font-semibold mb-1">People</div>
//               <div className="truncate">
//                 <span className="font-medium text-orange-900">Applicant:</span> {request?.applicantName || '—'}
//                 <span className="text-gray-600 text-[9px]"> ({request?.employeeId || '—'})</span>
//               </div>
//               <div className="truncate">
//                 <span className="font-medium">Officer:</span>{' '}
//                 {off.withOfficer ? (
//                   <>
//                     {off.name || '-'} <span className="text-gray-600 text-[9px]">({off.id || '-'})</span>
//                   </>
//                 ) : '—'}
//               </div>
//             </section>

//             <section>
//               <div className="text-orange-800 font-semibold mb-1">Status & Dates</div>
//               <div><b>Status:</b> {request?.status || '—'}</div>
//               <div>
//                 <b>Applied:</b> {(request as any)?.appliedDate ?? (request?.createdAt ? fmtDT(request.createdAt) : '—')}
//               </div>
//             </section>

//             <section>
//               <div className="text-orange-800 font-semibold mb-1">Travel</div>
//               <div><b>Date:</b> {request?.dateOfTravel || '—'}</div>
//               <div><b>Time:</b> {request?.timeFrom || '—'} – {request?.timeTo || '—'} {request?.overnight ? '(overnight)' : ''}</div>
//             </section>

//             <section>
//               <div className="text-orange-800 font-semibold mb-1">Route</div>
//               <div className="truncate">{request?.fromLocation || '—'} → {request?.toLocation || '—'}</div>
//             </section>

//             <section>
//               <div className="text-orange-800 font-semibold mb-1">Assignment</div>
//               <div><b>Vehicle:</b> {request?.assignedVehicleNumber || '-'}</div>
//               <div><b>Driver:</b> {request?.assignedDriverName || '-'}</div>
//               <div><b>Pickup:</b> {fmtDT(request?.scheduledPickupAt)}</div>
//               <div><b>Return:</b> {fmtDT(request?.scheduledReturnAt)}</div>
//             </section>

//             <section className="md:col-span-2">
//               <div className="text-orange-800 font-semibold mb-1">Purpose / Goods</div>
//               <div>{request?.officialDescription || '—'}</div>
//               <div className="text-gray-700">{request?.goods || '—'}</div>
//             </section>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }
