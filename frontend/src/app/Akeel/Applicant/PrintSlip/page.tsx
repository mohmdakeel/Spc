'use client';

import * as React from 'react';
import { Printer } from 'lucide-react';
import { listMyRequests } from '../../Transport/services/usageService';
import type { UsageRequest } from '../../Transport/services/types';
import { Th, Td } from '../../Transport/components/ThTd';
import WorkspaceSearchBar from '../../../../../components/workspace/WorkspaceSearchBar';
import { printDocument, escapeHtml, guessPrintedBy } from '../../../../../lib/print';

const READY_STATUSES = ['APPROVED', 'SCHEDULED', 'DISPATCHED', 'COMPLETED'];
const fmtDT = (s?: string | null) => (s ? new Date(s).toLocaleString() : '—');

const extractOfficer = (r?: Partial<UsageRequest> | null) => {
  if (!r) return { withOfficer: false };
  const anyr = r as any;
  if (anyr.travelWithOfficer || anyr.officerName || anyr.officerId) {
    return { withOfficer: true, name: anyr.officerName || undefined, id: anyr.officerId || undefined };
  }
  const text = `${anyr?.officialDescription ?? ''}\n${anyr?.remarks ?? ''}`;
  const m = /Travelling Officer:\s*([^\(\n,]+)?(?:\s*\((?:Employee\s*ID|ID)\s*:\s*([^)]+)\))?/i.exec(text);
  if (m) return { withOfficer: true, name: m[1]?.trim(), id: m[2]?.trim() };
  return { withOfficer: false };
};

const formatPrintValue = (value?: string | number | null) => {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return escapeHtml(trimmed.length ? trimmed : '—');
  }
  return escapeHtml(String(value));
};

const SLIP_PRINT_STYLES = `
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

export default function ApplicantPrintSlipPage() {
  const [items, setItems] = React.useState<UsageRequest[]>([]);
  const [employeeId, setEmployeeId] = React.useState('');
  const [search, setSearch] = React.useState('');
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const id =
      (typeof window !== 'undefined' && (localStorage.getItem('employeeId') || localStorage.getItem('actor'))) || '';
    setEmployeeId(id || '');
    if (!id) {
      setItems([]);
      setLoading(false);
      return;
    }

    (async () => {
      setLoading(true);
      let all: UsageRequest[] = [];
      let page = 0;
      let totalPages = 1;
      try {
        while (page < totalPages) {
          const resp = await listMyRequests(id, page, 100);
          all = all.concat(resp?.content || []);
          totalPages = (resp?.totalPages as number) ?? 1;
          page = ((resp?.number as number) ?? page) + 1;
        }
        all.sort((a: any, b: any) => (Date.parse(b?.createdAt || '') || 0) - (Date.parse(a?.createdAt || '') || 0));
      } finally {
        setItems(all);
        setLoading(false);
      }
    })();
  }, []);

  const ready = React.useMemo(() => items.filter((r) => READY_STATUSES.includes(r?.status || '')), [items]);

  const filtered = React.useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return ready;
    return ready.filter((r: any) => {
      const off = extractOfficer(r);
      return [
        r?.requestCode,
        r?.status,
        r?.applicantName,
        r?.employeeId,
        r?.fromLocation,
        r?.toLocation,
        r?.assignedVehicleNumber,
        r?.assignedDriverName,
        r?.dateOfTravel,
        off.name,
        off.id,
      ]
        .map((v) => (v ?? '').toString().toLowerCase())
        .join(' ')
        .includes(term);
    });
  }, [ready, search]);

  const printAllCurrent = React.useCallback(() => {
    const rows = filtered
      .map((r: any) => {
        const off = extractOfficer(r);
        const officerLine = off.withOfficer
          ? `${formatPrintValue(off.name)} <span class="sub">(${formatPrintValue(off.id)})</span>`
          : '—';
        const applied = escapeHtml(r?.appliedDate ?? (r?.createdAt ? fmtDT(r.createdAt) : '—'));
        return `
  <tr>
    <td>
      <div class="rq">${formatPrintValue(r.requestCode)}</div>
      <div class="sub">${applied}</div>
    </td>
    <td>
      <div><strong>Applicant:</strong> ${formatPrintValue(r.applicantName)} <span class="sub">(${formatPrintValue(r.employeeId)})</span></div>
      <div><strong>Officer:</strong> ${officerLine}</div>
    </td>
    <td>${formatPrintValue(r.fromLocation)} → ${formatPrintValue(r.toLocation)}</td>
    <td>
      <div>${formatPrintValue(r.assignedVehicleNumber)}</div>
      <div class="sub">${formatPrintValue(r.assignedDriverName)}</div>
    </td>
    <td>
      <div>${formatPrintValue(r.dateOfTravel)}</div>
      <div class="sub mono">${formatPrintValue(r.timeFrom)} – ${formatPrintValue(r.timeTo)} ${r.overnight ? '(overnight)' : ''}</div>
    </td>
    <td class="center">${formatPrintValue(r.status)}</td>
  </tr>`;
      })
      .join('');

    const contentHtml = rows
      ? `<table class="spc-table">
          <thead>
            <tr>
              <th>RQ ID / Applied</th>
              <th>People</th>
              <th>Route</th>
              <th>Vehicle</th>
              <th>Travel</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>`
      : '<div class="spc-empty">No requests ready for slips.</div>';

    printDocument({
      title: 'Requests Ready for Slip',
      subtitle: `Results: ${filtered.length}`,
      contentHtml,
      pageOrientation: 'landscape',
      printedBy: guessPrintedBy(),
      extraCss: SLIP_PRINT_STYLES,
    });
  }, [filtered]);

  const printOne = React.useCallback((r: UsageRequest) => {
    const off = extractOfficer(r);
    const officerLine = off.withOfficer
      ? `${formatPrintValue(off.name)}${off.id ? ` (${formatPrintValue(off.id)})` : ''}`
      : '—';

    const contentHtml = `
      <div class="spc-section">
        <p class="spc-section__title">Applicant & Status</p>
        <table class="spc-definition">
          <tr><td>Applicant</td><td>${formatPrintValue(r.applicantName)} (${formatPrintValue(r.employeeId)})</td></tr>
          <tr><td>Status</td><td>${formatPrintValue(r.status)}</td></tr>
          <tr><td>Officer</td><td>${officerLine}</td></tr>
        </table>
      </div>
      <div class="spc-section">
        <p class="spc-section__title">Route & Travel</p>
        <table class="spc-definition">
          <tr><td>Route</td><td>${formatPrintValue(r.fromLocation)} → ${formatPrintValue(r.toLocation)}</td></tr>
          <tr><td>Travel</td><td>${formatPrintValue(r.dateOfTravel)} • ${formatPrintValue(r.timeFrom)} – ${formatPrintValue(r.timeTo)} ${
            r.overnight ? '(overnight)' : ''
          }</td></tr>
        </table>
      </div>
      <div class="spc-section">
        <p class="spc-section__title">Assignment & Schedule</p>
        <table class="spc-definition">
          <tr><td>Vehicle</td><td>${formatPrintValue(r.assignedVehicleNumber)}</td></tr>
          <tr><td>Driver</td><td>${formatPrintValue(r.assignedDriverName)}${
            r.assignedDriverPhone ? ` (${formatPrintValue(r.assignedDriverPhone)})` : ''
          }</td></tr>
          <tr><td>Pickup</td><td>${escapeHtml(fmtDT(r.scheduledPickupAt))}</td></tr>
          <tr><td>Return</td><td>${escapeHtml(fmtDT(r.scheduledReturnAt))}</td></tr>
          <tr><td>Gate / Odometer</td><td>Exit: ${escapeHtml(fmtDT(r.gateExitAt))} • O ${formatPrintValue(r.exitOdometer)}<br/>Entry: ${escapeHtml(
            fmtDT(r.gateEntryAt)
          )} • O ${formatPrintValue(r.entryOdometer)}</td></tr>
        </table>
      </div>
    `;

    printDocument({
      title: 'Transport Request Slip',
      subtitle: `Code: ${r?.requestCode || '—'}`,
      contentHtml,
      printedBy: guessPrintedBy(),
      extraCss: SLIP_PRINT_STYLES,
    });
  }, []);


  return (
    <div className="space-y-4 text-[13px]">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-orange-700">Print slips</p>
          <h1 className="text-2xl font-bold text-orange-900">Ready for dispatch</h1>
          <p className="text-sm text-gray-600">Only approved, scheduled or completed requests appear here.</p>
        </div>
        <div className="flex w-full flex-col gap-2 lg:w-auto lg:flex-row lg:items-center">
          <WorkspaceSearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search code, applicant, route…"
            className="w-full lg:w-72"
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

      {!employeeId && (
        <div className="text-xs text-yellow-800 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2">
          Submit a request first to save your Employee ID locally, then slips will appear here.
        </div>
      )}

      <div className="bg-white rounded-2xl border border-orange-200 shadow-sm overflow-x-auto">
        <table className="w-full table-fixed text-[12px] leading-tight">
          <colgroup>
            <col className="w-32" />
            <col className="w-60" />
            <col className="w-44" />
            <col className="w-36" />
            <col className="w-40" />
            <col className="w-36" />
          </colgroup>
          <thead className="bg-orange-50">
            <tr className="text-[12px]">
              <Th className="px-2 py-1 text-left">RQ ID / Applied</Th>
              <Th className="px-2 py-1 text-left">People</Th>
              <Th className="px-2 py-1 text-left">Route</Th>
              <Th className="px-2 py-1 text-left">Vehicle</Th>
              <Th className="px-2 py-1 text-left">Travel</Th>
              <Th className="px-2 py-1 text-center">Status / Print</Th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading && (
              <tr>
                <Td colSpan={6} className="px-2 py-6 text-center text-gray-500">
                  Loading…
                </Td>
              </tr>
            )}

            {!loading &&
              filtered.map((r: any, i: number) => {
                const off = extractOfficer(r);
                const key =
                  r?.id ??
                  r?.requestCode ??
                  `${r?.employeeId ?? 'row'}|${r?.dateOfTravel ?? ''}|${r?.timeFrom ?? ''}|${r?.createdAt ?? ''}|${i}`;
                return (
                  <tr key={String(key)} className="align-top hover:bg-orange-50/40">
                    <Td className="px-2 py-1">
                      <div className="font-semibold text-orange-900 truncate">{r?.requestCode || '—'}</div>
                      <div className="text-[11px] text-gray-600 truncate">
                        {r?.appliedDate ?? (r?.createdAt ? fmtDT(r.createdAt) : '—')}
                      </div>
                    </Td>
                    <Td className="px-2 py-1">
                      <div className="truncate">
                        <span className="font-medium text-orange-900">{r?.applicantName || '—'}</span>{' '}
                        <span className="text-gray-600 text-[11px]">({r?.employeeId || '—'})</span>
                      </div>
                      <div className="text-[11px] text-gray-700 truncate">
                        <span className="font-medium">Officer:</span>{' '}
                        {off.withOfficer ? (
                          <>
                            {off.name || '-'}
                            <span className="text-gray-600 text-[10px]"> ({off.id || '-'})</span>
                          </>
                        ) : (
                          '—'
                        )}
                      </div>
                    </Td>
                    <Td className="px-2 py-1">
                      <div className="truncate">{(r?.fromLocation || '—') + ' → ' + (r?.toLocation || '—')}</div>
                    </Td>
                    <Td className="px-2 py-1">
                      <div>{r?.assignedVehicleNumber || '—'}</div>
                      <div className="text-[11px] text-gray-700 truncate">{r?.assignedDriverName || '—'}</div>
                    </Td>
                    <Td className="px-2 py-1">
                      <div>{r?.dateOfTravel || '—'}</div>
                      <div className="text-[11px] text-gray-600">
                        <span className="font-mono">{r?.timeFrom || '—'}</span>–
                        <span className="font-mono">{r?.timeTo || '—'}</span> {r?.overnight ? '(overnight)' : ''}
                      </div>
                    </Td>
                    <Td className="px-2 py-1 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <span className="inline-flex items-center justify-center rounded bg-orange-100 px-2 py-[2px] text-[11px] text-orange-800">
                          {(r?.status || '—').replaceAll('_', ' ')}
                        </span>
                        <button
                          type="button"
                          className="inline-flex items-center justify-center w-7 h-7 rounded bg-orange-600 text-white hover:bg-orange-700"
                          title="Print this slip"
                          onClick={(e) => {
                            e.stopPropagation();
                            printOne(r);
                          }}
                        >
                          <Printer size={13} />
                        </button>
                      </div>
                    </Td>
                  </tr>
                );
              })}

            {!loading && !filtered.length && (
              <tr>
                <Td colSpan={6} className="px-2 py-6 text-center text-gray-500">
                  No printable requests.
                </Td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
