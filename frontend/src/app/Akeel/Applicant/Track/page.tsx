'use client';

import * as React from 'react';
import { listMyRequests, listAllRequests } from '../../Transport/services/usageService';
import type { UsageRequest } from '../../Transport/services/types';
import { Th, Td } from '../../Transport/components/ThTd';
import { Printer, X } from 'lucide-react';
import WorkspaceSearchBar from '../../../../../components/workspace/WorkspaceSearchBar';
import { printDocument, escapeHtml, guessPrintedBy } from '../../../../../lib/print';

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

const formatPrintValue = (value?: string | number | null) => {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return escapeHtml(trimmed.length ? trimmed : '—');
  }
  return escapeHtml(String(value));
};

/* ---- helpers for details ---- */
const cleanPhone = (p?: string) =>
  (p ?? '')
    .replace(/[^\d+()\-\s./;]/g, '')
    .replace(/^[;,\s-]+/, '')
    .replace(/\s{2,}/g, ' ')
    .trim();

/** Strip any "Travelling Officer: ..." line(s) and trailing phone/tel fragments */
function purposeWithoutOfficer(r: any): string {
  const raw = String(r?.officialDescription ?? '');
  let cleaned = raw
    .split(/\r?\n/)
    .filter((line) => !/travell?ing\s+officer\s*:/i.test(line))
    .join('\n');
  cleaned = cleaned.replace(/\b(?:Phone|Tel)\s*:\s*[\+\d()\-\s./;]+/gi, '');
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
    return {
      withOfficer: true,
      name: r.officerName || undefined,
      id: r.officerId || undefined,
      phone: cleanPhone(r.officerPhone) || undefined,
    };
  }
  const text = `${r?.officialDescription || ''}\n${r?.remarks || ''}`;
  const m =
    /Travelling Officer:\s*([^\(\n,]+)?(?:\s*\((?:Employee\s*ID|Emp\.?\s*ID|ID)\s*:\s*([^)]+)\))?(?:,\s*(?:Phone|Tel)\s*:\s*([^\n]+))?/i.exec(
      text
    );
  if (m) return { withOfficer: true, name: m[1]?.trim() || undefined, id: m[2]?.trim() || undefined, phone: cleanPhone(m[3]) || undefined };
  return { withOfficer: false };
}

const TRACK_PRINT_STYLES = `
  .track-table th {
    white-space: nowrap;
  }
  .rq {
    font-weight: 600;
    color: #9a3412;
  }
  .sub {
    color: #6b7280;
    font-size: 0.78rem;
  }
  .mono {
    font-family: 'JetBrains Mono', 'Fira Mono', Consolas, monospace;
  }
`;

export default function TrackRequestPage() {
  const [items, setItems] = React.useState<UsageRequest[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [q, setQ] = React.useState('');
  const [view, setView] = React.useState<UsageRequest | null>(null);

  React.useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const all: any[] = await listAllRequests();
        const seen = new Set<string>();
        const deduped = (all || []).filter((r: any) => {
          const k = String(r?.id ?? r?.requestCode ?? '');
          if (!k || seen.has(k)) return false;
          seen.add(k);
          return true;
        }).sort((a: any, b: any) => (Date.parse(b?.createdAt || '') || 0) - (Date.parse(a?.createdAt || '') || 0));

        setItems(deduped);
      } catch {
        setItems([]);
      }
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
    const rowsHtml = filtered
      .map((r: any, index) => {
        const driverLine = [
          r.assignedDriverName || '—',
          r.assignedDriverPhone ? ` (${r.assignedDriverPhone})` : '',
        ].join('');
        return `
  <tr>
    <td>${formatPrintValue(index + 1)}</td>
    <td>
      <div class="rq">${formatPrintValue(r.requestCode)}</div>
      <div class="sub">${escapeHtml(appliedLabel(r))}</div>
    </td>
    <td class="center">${formatPrintValue(r.status)}</td>
    <td>
      <div>${formatPrintValue(r.assignedVehicleNumber)}</div>
      <div class="sub">${formatPrintValue(driverLine)}</div>
    </td>
    <td>
      <div>P: ${escapeHtml(fmtDT(r.scheduledPickupAt))}</div>
      <div class="sub">R: ${escapeHtml(fmtDT(r.scheduledReturnAt))}</div>
    </td>
    <td>
      <div>Exit: ${escapeHtml(fmtDT(r.gateExitAt))} <span class="sub">• O ${formatPrintValue(r.exitOdometer)}</span></div>
      <div>Entry: ${escapeHtml(fmtDT(r.gateEntryAt))} <span class="sub">• O ${formatPrintValue(r.entryOdometer)}</span></div>
    </td>
  </tr>`;
      })
      .join('');

    const contentHtml = rowsHtml
      ? `<table class="spc-table track-table">
          <thead>
            <tr>
              <th>#</th>
              <th>RQ ID / Applied</th>
              <th>Status</th>
              <th>Assignment</th>
              <th>Schedule</th>
              <th>Gate Activity</th>
            </tr>
          </thead>
          <tbody>${rowsHtml}</tbody>
        </table>`
      : '<div class="spc-empty">No requests match the current filters.</div>';

    printDocument({
      title: 'Applicant Request Tracker',
      subtitle: `Records shown: ${filtered.length}`,
      contentHtml,
      printedBy: guessPrintedBy(),
      pageOrientation: 'landscape',
      extraCss: TRACK_PRINT_STYLES,
    });
  }, [filtered]);

  const printOne = React.useCallback((r: any) => {
    const off = extractOfficer(r);
    const assignment = [
      formatPrintValue(r.assignedVehicleNumber),
      '/',
      formatPrintValue(r.assignedDriverName),
      r.assignedDriverPhone ? ` (${escapeHtml(r.assignedDriverPhone)})` : '',
    ]
      .join(' ')
      .trim();

    const contentHtml = `
      <div class="spc-section">
        <p class="spc-section__title">Overview</p>
        <table class="spc-definition">
          <tr><td>Request Code</td><td>${formatPrintValue(r.requestCode)}</td></tr>
          <tr><td>Status</td><td>${formatPrintValue(r.status)}</td></tr>
          <tr><td>Applied</td><td>${escapeHtml(appliedLabel(r))}</td></tr>
          <tr><td>Applicant</td><td>${formatPrintValue(r.applicantName)} (${formatPrintValue(r.employeeId)})</td></tr>
          <tr><td>Department</td><td>${formatPrintValue(r.department)}</td></tr>
        </table>
      </div>
      <div class="spc-section">
        <p class="spc-section__title">Travel & Route</p>
        <table class="spc-definition">
          <tr><td>Date of Travel</td><td>${formatPrintValue(r.dateOfTravel)}</td></tr>
          <tr><td>Time</td><td>${formatPrintValue(r.timeFrom)} – ${formatPrintValue(r.timeTo)} ${r.overnight ? '(overnight)' : ''}</td></tr>
          <tr><td>Route</td><td>${formatPrintValue(r.fromLocation)} → ${formatPrintValue(r.toLocation)}</td></tr>
          <tr><td>Official Description</td><td>${escapeHtml(purposeWithoutOfficer(r))}</td></tr>
          <tr><td>Goods</td><td>${formatPrintValue(r.goods)}</td></tr>
        </table>
      </div>
      <div class="spc-section">
        <p class="spc-section__title">Officer & Assignment</p>
        <table class="spc-definition">
          <tr><td>Travelling with Officer</td><td>${off.withOfficer ? 'Yes' : 'No'}</td></tr>
          <tr><td>Officer</td><td>${off.withOfficer ? `${escapeHtml(off.name || '—')}${off.id ? ` (${escapeHtml(off.id)})` : ''}${off.phone ? `, ${escapeHtml(off.phone)}` : ''}` : '—'}</td></tr>
          <tr><td>Vehicle / Driver</td><td>${assignment}</td></tr>
          <tr><td>Pickup</td><td>${escapeHtml(fmtDT(r.scheduledPickupAt))}</td></tr>
          <tr><td>Return</td><td>${escapeHtml(fmtDT(r.scheduledReturnAt))}</td></tr>
        </table>
      </div>
      <div class="spc-section">
        <p class="spc-section__title">Gate Logs</p>
        <table class="spc-definition">
          <tr><td>Gate Exit</td><td>${escapeHtml(fmtDT(r.gateExitAt))} • O ${formatPrintValue(r.exitOdometer)}</td></tr>
          <tr><td>Gate Entry</td><td>${escapeHtml(fmtDT(r.gateEntryAt))} • O ${formatPrintValue(r.entryOdometer)}</td></tr>
        </table>
      </div>
    `;

    printDocument({
      title: 'Transport Request',
      subtitle: `Code: ${r.requestCode || '—'}`,
      contentHtml,
      printedBy: guessPrintedBy(),
      extraCss: TRACK_PRINT_STYLES,
    });
  }, []);

  /* widen status column to avoid overlap */
  const COLS = React.useMemo(() => ['15%','12%','22%','21%','24%','6%'], []);

  return (
    <div className="space-y-4 text-[13px]">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-orange-700">Track</p>
          <h1 className="text-2xl font-bold text-orange-900">Request progress</h1>
          <p className="text-sm text-gray-600">Monitor assignments, schedule and gate activity in one place.</p>
        </div>
        <div className="flex w-full flex-col gap-2 lg:w-auto lg:flex-row lg:items-center">
          <WorkspaceSearchBar
            value={q}
            onChange={setQ}
            placeholder="Search code, vehicle, driver, gate…"
            className="w-full lg:w-80"
          />
          <button
            type="button"
            onClick={printAllCurrent}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-600 px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-orange-700"
            title="Print all (current filter)"
          >
            <Printer size={14} />
            Print
          </button>
        </div>
      </div>

        {!items.length && (
          <div className="mb-3 text-[11px] rounded bg-yellow-50 border border-yellow-200 text-yellow-800 px-2 py-1">
            Tip: after your first submission, your Employee ID is remembered automatically.
          </div>
        )}

        <div className="bg-white rounded-2xl border border-orange-200 shadow-sm overflow-x-auto">
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
      {view && <DetailsModal request={view} onClose={() => setView(null)} />}
    </div>
  );
}

/* Details Modal (same structure as Requests) */
function DetailsModal({ request, onClose }: { request: UsageRequest; onClose: () => void }) {
  const off = extractOfficer(request as any);
  const yn = (b?: boolean) => (b ? 'Yes' : 'No');

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
              <div className="text-orange-800 font-semibold mb-1">Applicant & Status</div>
              <div><b>Applicant:</b> {(request as any).applicantName || '—'} <span className="text-[11px] text-gray-600">({(request as any).employeeId || '—'})</span></div>
              <div><b>Department:</b> {(request as any).department || '—'}</div>
              <div><b>Status:</b> {(request as any).status}</div>
              <div><b>Applied:</b> {appliedLabel(request as any)}</div>
            </section>

            <section>
              <div className="text-orange-800 font-semibold mb-1">Travel Plan</div>
              <div><b>Date of Travel:</b> {(request as any).dateOfTravel || '—'}</div>
              <div><b>Time:</b> {(request as any).timeFrom || '—'} – {(request as any).timeTo || '—'} {(request as any).overnight ? '(overnight)' : ''}</div>
              <div><b>Route:</b> {(request as any).fromLocation || '—'} → {(request as any).toLocation || '—'}</div>
            </section>

            <section className="md:col-span-2 border border-orange-100 rounded-lg p-3">
              <div className="text-orange-800 font-semibold mb-2">Official Description / Goods</div>
              <div className="text-orange-900 break-words break-all mb-1">{purposeWithoutOfficer(request as any)}</div>
              <div className="text-[11px] text-gray-700">Goods: {(request as any).goods || '—'}</div>
            </section>

            <section>
              <div className="text-orange-800 font-semibold mb-1">Officer</div>
              <div><b>Travelling with Officer:</b> {yn((request as any).travelWithOfficer || off.withOfficer)}</div>
              <div className="break-words break-all">
                <b>Officer:</b>{' '}
                {off.withOfficer ? (
                  <>
                    {off.name || '—'} {off.id ? <span className="text-[11px] text-gray-600">({off.id})</span> : null}
                    {off.phone ? `, ${off.phone}` : ''}
                  </>
                ) : '—'}
              </div>
            </section>

            <section>
              <div className="text-orange-800 font-semibold mb-1">Assignment & Schedule</div>
              <div><b>Vehicle:</b> {(request as any).assignedVehicleNumber || '—'}</div>
              <div><b>Driver:</b> {(request as any).assignedDriverName || '—'}{(request as any).assignedDriverPhone ? ` (${(request as any).assignedDriverPhone})` : ''}</div>
              <div><b>Pickup:</b> {fmtDT((request as any).scheduledPickupAt)}</div>
              <div><b>Return:</b> {fmtDT((request as any).scheduledReturnAt)}</div>
            </section>

            <section className="md:col-span-2">
              <div className="text-orange-800 font-semibold mb-1">Gate / Trip</div>
              <div><b>Exit:</b> {fmtDT((request as any).gateExitAt)} • <span className="text-[11px] text-gray-600">O {(request as any).exitOdometer ?? '—'}</span></div>
              <div><b>Entry:</b> {fmtDT((request as any).gateEntryAt)} • <span className="text-[11px] text-gray-600">O {(request as any).entryOdometer ?? '—'}</span></div>
            </section>

            <section className="md:col-span-2 border border-orange-100 rounded-lg p-3">
              <div className="text-orange-800 font-semibold mb-1">Audit</div>
              <div><b>Created by:</b> {(request as any).createdBy || '—'}</div>
              <div><b>Created at:</b> {fmtDT((request as any).createdAt)}</div>
              <div><b>Updated by:</b> {(request as any).updatedBy || '—'}</div>
              <div><b>Updated at:</b> {(request as any).updatedAt ? fmtDT((request as any).updatedAt) : '—'}</div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
