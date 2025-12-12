// src/app/Akeel/Transport/utils/print.ts
import { toast } from 'react-toastify';
import type { Vehicle, Driver, AuditFields } from '../services/types';
import { fmt } from './format';
import { fmtDate } from './date';

const odoLabel = (v: Vehicle) => {
  const reg = v.registeredKm ?? v.totalKmDriven;
  const cur = v.totalKmDriven;
  if (reg != null && cur != null) {
    return reg === cur ? String(cur) : `${reg} / ${cur}`;
  }
  if (reg != null) return String(reg);
  if (cur != null) return String(cur);
  return '—';
};

function openWin(w = 1000, h = 700): Window | null {
  const win = window.open('', '', `width=${w},height=${h}`);
  if (!win) { toast.error('Failed to open print window'); return null; }
  return win;
}

function writeAndPrint(doc: Document, html: string) {
  doc.write(html); doc.close();
  setTimeout(() => {
    try {
      (doc.defaultView as Window)?.print?.();
      (doc.defaultView as Window)?.close?.();
    } catch {
      toast.error('Failed to print document');
    }
  }, 120);
}

/* ---------- Styles ---------- */

const singleEntityStyle = `
  :root { --brand:#ea580c; --ink:#111827; --muted:#6b7280; --line:#e5e7eb; }
  * { box-sizing: border-box; }
  body { font-family: Arial, sans-serif; color: var(--ink); padding: 20px; }
  h2 { color: var(--brand); border-bottom: 2px solid var(--brand); padding-bottom: 6px; margin: 0 0 12px; }
  .grid { display: grid; grid-template-columns: 220px 1fr; gap: 6px 12px; align-items: start; }
  .label { color: var(--muted); font-weight: 700; }
  .val { word-break: break-word; }
  .section { margin-top: 14px; padding-top: 10px; border-top: 1px dashed var(--line); }
  .small { color: var(--muted); font-size: 12px; }
`;

const listStyle = `
  :root { --brand:#ea580c; --brand2:#ffedd5; --ink:#111827; --muted:#6b7280; --line:#e5e7eb; }
  * { box-sizing: border-box; }
  body { font-family: Arial, sans-serif; color: var(--ink); padding: 20px; }
  h2 { color: var(--brand); text-align: center; margin: 0 0 4px; }
  .meta { text-align: center; color: var(--muted); margin-bottom: 8px; font-size: 12px; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; table-layout: fixed; }
  thead th {
    background: var(--brand2);
    color: #9a3412;
    position: sticky; top: 0;
    z-index: 1;
  }
  th, td { border-bottom: 1px solid var(--line); padding: 6px 8px; text-align: left; }
  .num { text-align: right; }
  tbody tr:nth-child(odd) td { background: #fafafa; }
  .wrap { word-break: break-word; }
`;

/* ---------- Shared audit renderer ---------- */

function renderAudit(a: Partial<AuditFields>) {
  const rows: string[] = [];
  if (a.createdBy || a.createdAt) {
    rows.push(`<div class="label">Created By</div><div class="val">${fmt(a.createdBy)}</div>`);
    rows.push(`<div class="label">Created At</div><div class="val">${fmtDate(a.createdAt)}</div>`);
  }
  if (a.updatedBy || a.updatedAt) {
    rows.push(`<div class="label">Updated By</div><div class="val">${fmt(a.updatedBy)}</div>`);
    rows.push(`<div class="label">Updated At</div><div class="val">${fmtDate(a.updatedAt)}</div>`);
  }
  if (a.deletedBy || a.deletedAt) {
    rows.push(`<div class="label">Deleted By</div><div class="val">${fmt(a.deletedBy)}</div>`);
    rows.push(`<div class="label">Deleted At</div><div class="val">${fmtDate(a.deletedAt)}</div>`);
  }
  if (!rows.length) return '';
  return `<div class="section"><div class="grid">${rows.join('')}</div></div>`;
}

/* ===========================
   VEHICLE PRINTS
   =========================== */

export function printVehicle(v: Vehicle) {
  const w = openWin(800, 600); if (!w) return;

  // ID removed (as requested)
  const html = `<!doctype html>
  <html><head><title>${v.vehicleNumber ?? 'Vehicle'}</title>
  <style>${singleEntityStyle}</style></head>
  <body>
    <h2>Vehicle ${fmt(v.vehicleNumber)}</h2>

    <div class="grid">
      <div class="label">Type</div><div class="val">${fmt(v.vehicleType)}</div>
      <div class="label">Brand</div><div class="val">${fmt(v.brand)}</div>
      <div class="label">Model</div><div class="val">${fmt(v.model)}</div>
      <div class="label">Chassis</div><div class="val">${fmt(v.chassisNumber)}</div>
      <div class="label">Engine</div><div class="val">${fmt(v.engineNumber)}</div>
      <div class="label">Manufacture Date</div><div class="val">${fmtDate(v.manufactureDate)}</div>
      <div class="label">Odometer (reg / current)</div><div class="val">${odoLabel(v)}</div>
      <div class="label">Fuel Efficiency</div><div class="val">${fmt(v.fuelEfficiency)}</div>
      <div class="label">Condition</div><div class="val">${fmt(v.presentCondition)}</div>
      <div class="label">Status</div><div class="val">${fmt(v.status)}</div>
    </div>

    ${renderAudit(v)}

    <div class="section small">Printed: ${new Date().toLocaleString()}</div>
  </body></html>`;
  writeAndPrint(w.document, html);
}

export function printVehicleList(list: Vehicle[], showDeleted = false) {
  const w = openWin(1100, 700); if (!w) return;

  // ID column removed; numeric columns right-aligned
  const rows = (list || []).map((v, i) => `
    <tr>
      <td class="num">${i + 1}</td>
      <td class="wrap">${fmt(v.vehicleNumber)}</td>
      <td class="wrap">${fmt(v.vehicleType)}</td>
      <td class="wrap">${fmt(v.brand)}</td>
      <td class="wrap">${fmt(v.model)}</td>
      <td class="wrap">${fmt(v.chassisNumber)}</td>
      <td class="wrap">${fmt(v.engineNumber)}</td>
      <td>${fmtDate(v.manufactureDate)}</td>
      <td class="num">${odoLabel(v)}</td>
      <td class="num">${fmt(v.fuelEfficiency)}</td>
      <td class="wrap">${fmt(v.presentCondition)}</td>
      <td>${fmt(v.status)}</td>
    </tr>
  `).join('');

  const html = `<!doctype html>
  <html><head><title>Vehicles</title>
  <style>${listStyle}</style></head>
  <body>
    <h2>${showDeleted ? 'Deleted' : 'Active'} Vehicles (${list.length})</h2>
    <div class="meta">Printed on ${new Date().toLocaleString()}</div>

    <table>
      <colgroup>
        <col style="width:48px" />
        <col style="width:120px" />
        <col style="width:90px" />
        <col style="width:110px" />
        <col style="width:110px" />
        <col style="width:150px" />
        <col style="width:150px" />
        <col style="width:100px" />
        <col style="width:85px" />
        <col style="width:85px" />
        <col style="width:150px" />
        <col style="width:95px" />
      </colgroup>

      <thead>
        <tr>
          <th class="num">#</th>
          <th>Number</th>
          <th>Type</th>
          <th>Brand</th>
          <th>Model</th>
          <th>Chassis</th>
          <th>Engine</th>
          <th>Mfg Date</th>
          <th class="num">Odo (reg / current)</th>
          <th class="num">Fuel Eff.</th>
          <th>Condition</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  </body></html>`;
  writeAndPrint(w.document, html);
}

/* ===========================
   DRIVER PRINTS
   =========================== */

export function printDriver(d: Driver) {
  const w = openWin(800, 600); if (!w) return;
  const html = `<!doctype html>
  <html><head><title>${d.name ?? 'Driver'}</title>
  <style>${singleEntityStyle}</style></head>
  <body>
    <h2>Driver ${fmt(d.name)}</h2>
    <div class="grid">
      <div class="label">Employee ID</div><div class="val">${fmt(d.employeeId)}</div>
      <div class="label">Phone</div><div class="val">${fmt(d.phone)}</div>
      <div class="label">Email</div><div class="val">${fmt(d.email)}</div>
      <div class="label">License #</div><div class="val">${fmt(d.licenseNumber)}</div>
      <div class="label">License Expiry</div><div class="val">${fmtDate(d.licenseExpiryDate)}</div>
      <div class="label">Experience</div><div class="val">${fmt(d.drivingExperience)} years</div>
      <div class="label">Status</div><div class="val">${fmt(d.status)}</div>
    </div>

    ${renderAudit(d)}

    <div class="section small">Printed: ${new Date().toLocaleString()}</div>
  </body></html>`;
  writeAndPrint(w.document, html);
}

export function printDriverList(list: Driver[], showDeleted = false) {
  const w = openWin(1000, 700); if (!w) return;
  const rows = (list || []).map((d, i) => `
    <tr>
      <td class="num">${i + 1}</td>
      <td>${fmt(d.employeeId)}</td>
      <td class="wrap">${fmt(d.name)}</td>
      <td>${fmt(d.phone)}</td>
      <td class="wrap">${fmt(d.email)}</td>
      <td>${fmt(d.licenseNumber)}</td>
      <td>${fmtDate(d.licenseExpiryDate)}</td>
      <td class="num">${fmt(d.drivingExperience)}</td>
      <td>${fmt(d.status)}</td>
    </tr>
  `).join('');

  const html = `<!doctype html>
  <html><head><title>Drivers</title>
  <style>${listStyle}</style></head>
  <body>
    <h2>${showDeleted ? 'Deleted' : 'Active'} Drivers (${list.length})</h2>
    <div class="meta">Printed on ${new Date().toLocaleString()}</div>
    <table>
      <thead>
        <tr>
          <th class="num">#</th><th>Employee ID</th><th>Name</th><th>Phone</th><th>Email</th>
          <th>License</th><th>Expiry</th><th class="num">Experience</th><th>Status</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  </body></html>`;
  writeAndPrint(w.document, html);
}

// ADD near bottom of file, after other exports
import type { UsageRequest } from '../services/types';

export function printUsageSlip(r: UsageRequest) {
  const w = (window as any).open('', '', 'width=800,height=600'); if (!w) return;
  const style = `
    :root { --brand:#ea580c; --ink:#111827; --muted:#6b7280; --line:#e5e7eb; }
    * { box-sizing:border-box } body { font-family: Arial, sans-serif; color:var(--ink); padding:20px }
    h2 { color:var(--brand); margin:0 0 8px } .sec{margin-top:10px;padding-top:10px;border-top:1px solid var(--line)}
    .grid{display:grid;grid-template-columns:200px 1fr; gap:6px 12px}
    .label{color:var(--muted);font-weight:700} .val{word-break:break-word}
  `;
  const fmt = (v:any)=> (v===null||v===undefined||v==='')?'-':String(v);
  const fmtD = (s?:string|null)=> s? new Date(s).toLocaleString(): '-';
  const travelDates = r.returnDate && r.returnDate !== r.dateOfTravel
    ? `${fmt(r.dateOfTravel)} → ${fmt(r.returnDate)}`
    : fmt(r.dateOfTravel);
  const html = `<!doctype html><html><head><title>${r.requestCode}</title><style>${style}</style></head><body>
    <h2>Transport Slip • ${r.requestCode}</h2>
    <div class="grid">
      <div class="label">Applicant</div><div class="val">${fmt(r.applicantName)} (${fmt(r.employeeId)})</div>
      <div class="label">Department</div><div class="val">${fmt(r.department)}</div>
      <div class="label">Travel</div><div class="val">${travelDates} • ${fmt(r.timeFrom)} – ${fmt(r.timeTo)}</div>
      <div class="label">Route</div><div class="val">${fmt(r.fromLocation)} → ${fmt(r.toLocation)}</div>
      <div class="label">Trip Description</div><div class="val">${fmt(r.officialDescription)}</div>
      <div class="label">Goods</div><div class="val">${fmt(r.goods)}</div>
    </div>
    <div class="sec grid">
      <div class="label">Vehicle</div><div class="val">${fmt(r.assignedVehicleNumber)}</div>
      <div class="label">Driver</div><div class="val">${fmt(r.assignedDriverName)} ${r.assignedDriverPhone?`• ${r.assignedDriverPhone}`:''}</div>
      <div class="label">Pickup</div><div class="val">${fmtD(r.scheduledPickupAt)}</div>
      <div class="label">Return</div><div class="val">${fmtD(r.scheduledReturnAt)}</div>
    </div>
    <div class="sec grid">
      <div class="label">Gate Exit</div><div class="val">${fmtD(r.gateExitAt)} • Odometer: ${fmt(r.exitOdometer)}</div>
      <div class="label">Gate Entry</div><div class="val">${fmtD(r.gateEntryAt)} • Odometer: ${fmt(r.entryOdometer)}</div>
    </div>
    <div class="sec" style="font-size:12px;color:var(--muted)">Printed on ${new Date().toLocaleString()}</div>
  </body></html>`;
  w.document.write(html); w.document.close();
  setTimeout(()=>{ try{ w.print(); w.close(); } catch{} }, 120);
}
