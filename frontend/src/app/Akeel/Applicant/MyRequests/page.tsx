'use client';

import * as React from 'react';
import { listMyRequests, listAllRequests } from '../../Transport/services/usageService';
import type { UsageRequest } from '../../Transport/services/types';
import { Th, Td } from '../../Transport/components/ThTd';
import { Printer, X } from 'lucide-react';
import WorkspaceSearchBar from '../../../../../components/workspace/WorkspaceSearchBar';
import { printDocument, escapeHtml, guessPrintedBy } from '../../../../../lib/print';
import { readCache, writeCache } from '../../../../../lib/cache';

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

/** Resolve the account username that created the request, with sensible fallbacks */
const resolveAccountUser = (r: any): string => {
  const cleaned = [r?.createdBy, r?.created_by, r?.actor]
    .map((v) => (v === undefined || v === null ? '' : String(v).trim()))
    .find((v) => v && !['system', 'null', 'undefined', '-'].includes(v.toLowerCase()));
  return cleaned || '—';
};

/** Resolve who last updated the record; fall back to submitter so the trail is never blank */
const resolveUpdatedBy = (r: any, submitter: string): string => {
  const raw = r?.updatedBy ?? r?.updated_by;
  const val = raw === undefined || raw === null ? '' : String(raw).trim();
  if (val && !['system', 'null', 'undefined', '-'].includes(val.toLowerCase())) return val;
  return submitter || '—';
};

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

const formatPrintValue = (value?: string | number | null) => {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return escapeHtml(trimmed.length ? trimmed : '—');
  }
  return escapeHtml(String(value));
};

const MY_REQUESTS_PRINT_STYLES = `
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

export default function RequestsPage() {
  const bootstrapIds =
    typeof window !== 'undefined'
      ? Array.from(
          new Set(
            [
              localStorage.getItem('employeeId') || '',
              localStorage.getItem('actor') || '',
              localStorage.getItem('username') || '',
            ].filter(Boolean)
          )
        )
      : [];
  const cachedMine = bootstrapIds.flatMap(
    (id) => readCache<UsageRequest[]>(`cache:applicant:requests:${id}`) || []
  );
  const cachedAll = readCache<UsageRequest[]>('cache:applicant:requests:all') || [];
  const initialItems = cachedMine.length ? cachedMine : cachedAll;

  const [items, setItems] = React.useState<UsageRequest[]>(initialItems);
  const [ids, setIds] = React.useState<string[]>(bootstrapIds);
  const [loading, setLoading] = React.useState(!initialItems.length);
  const [q, setQ] = React.useState('');
  const [view, setView] = React.useState<UsageRequest | null>(null);

  React.useEffect(() => {
    const eid = (typeof window !== 'undefined' && (localStorage.getItem('employeeId') || '')) || '';
    const actor = (typeof window !== 'undefined' && (localStorage.getItem('actor') || '')) || '';
    const username = (typeof window !== 'undefined' && (localStorage.getItem('username') || '')) || '';
    const uniqueIds = Array.from(new Set([eid, actor, username].filter(Boolean)));
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

      try {
        const all: any[] = await listAllRequests();
        const filtered = all.filter((u: any) => {
          const created = u?.createdBy ?? u?.created_by ?? '';
          return uniqueIds.includes(u?.employeeId) || uniqueIds.includes(created);
        });
        merged = merged.concat(filtered);
      } catch {}

      const seen = new Set<string>();
      merged = merged.filter((r: any) => {
        const k = String(r?.id ?? r?.requestCode ?? '');
        if (!k || seen.has(k)) return false;
        seen.add(k);
        return true;
      });
      merged.sort((a: any, b: any) => (Date.parse(b?.createdAt || '') || 0) - (Date.parse(a?.createdAt || '') || 0));

      // Cache per-user and combined so the workspace opens instantly next time
      uniqueIds.forEach((id) => writeCache(`cache:applicant:requests:${id}`, merged));
      writeCache('cache:applicant:requests:all', merged);

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
        const submitterAccount = resolveAccountUser(r);
        const officerText = off.withOfficer
          ? `${formatPrintValue(off.name)}${off.id ? ` <span class="sub">(${formatPrintValue(off.id)})</span>` : ''}${
              off.phone ? `, ${formatPrintValue(off.phone)}` : ''
            }`
          : '—';
        return `
  <tr>
    <td>
      <div class="rq">${formatPrintValue(r.requestCode)}</div>
      <div class="sub">${escapeHtml(appliedLabel(r))}</div>
    </td>
    <td>
      ${formatPrintValue(r.applicantName)} <span class="sub">(${formatPrintValue(r.employeeId)})</span>
      <div class="sub">${formatPrintValue(r.department)}</div>
      <div class="sub">Account: ${formatPrintValue(submitterAccount)}</div>
    </td>
    <td class="center">${formatPrintValue(r.status)}</td>
    <td>
      <div>${formatPrintValue(r.dateOfTravel)}</div>
      <div class="sub mono">${formatPrintValue(r.timeFrom)} – ${formatPrintValue(r.timeTo)} ${
          r.overnight ? '(overnight)' : ''
        }</div>
    </td>
    <td>${formatPrintValue(r.fromLocation)} → ${formatPrintValue(r.toLocation)}</td>
    <td>${officerText}</td>
    <td>
      <div>${escapeHtml(purposeWithoutOfficer(r))}</div>
      <div class="sub">${formatPrintValue(r.goods)}</div>
    </td>
  </tr>`;
      })
      .join('');

    const contentHtml = rowsHtml
      ? `<table class="spc-table">
          <thead>
            <tr>
              <th>RQ ID / Applied</th>
              <th>Applicant / Dept</th>
              <th>Status</th>
              <th>Travel</th>
              <th>Route</th>
              <th>Officer</th>
              <th>Purpose / Goods</th>
            </tr>
          </thead>
          <tbody>${rowsHtml}</tbody>
        </table>`
      : '<div class="spc-empty">No requests match the current filters.</div>';

    printDocument({
      title: 'Applicant Requests',
      subtitle: `Records shown: ${filtered.length}`,
      contentHtml,
      pageOrientation: 'landscape',
      printedBy: guessPrintedBy(),
      extraCss: MY_REQUESTS_PRINT_STYLES,
    });
  }, [filtered]);

  const printOne = React.useCallback((r: any) => {
    const off = extractOfficer(r);
    const submitterAccount = resolveAccountUser(r);
    const updatedAccount = resolveUpdatedBy(r, submitterAccount);
    const officerDetails = off.withOfficer
      ? `${formatPrintValue(off.name)}${off.id ? ` (${formatPrintValue(off.id)})` : ''}${
          off.phone ? `, ${formatPrintValue(off.phone)}` : ''
        }`
      : '—';

    const contentHtml = `
      <div class="spc-section">
        <p class="spc-section__title">Applicant Details</p>
        <table class="spc-definition">
          <tr><td>Applicant</td><td>${formatPrintValue(r.applicantName)} (${formatPrintValue(r.employeeId)})</td></tr>
          <tr><td>Department</td><td>${formatPrintValue(r.department)}</td></tr>
          <tr><td>Status</td><td>${formatPrintValue(r.status)}</td></tr>
          <tr><td>Applied</td><td>${escapeHtml(appliedLabel(r))}</td></tr>
          <tr><td>Account Username</td><td>${escapeHtml(submitterAccount)}</td></tr>
          <tr><td>Last Updated By</td><td>${escapeHtml(updatedAccount)}</td></tr>
        </table>
      </div>
      <div class="spc-section">
        <p class="spc-section__title">Travel Plan</p>
        <table class="spc-definition">
          <tr><td>Date of Travel</td><td>${formatPrintValue(r.dateOfTravel)}</td></tr>
          <tr><td>Time</td><td>${formatPrintValue(r.timeFrom)} – ${formatPrintValue(r.timeTo)} ${r.overnight ? '(overnight)' : ''}</td></tr>
          <tr><td>Route</td><td>${formatPrintValue(r.fromLocation)} → ${formatPrintValue(r.toLocation)}</td></tr>
          <tr><td>Pickup</td><td>${escapeHtml(fmtDT(r.scheduledPickupAt))}</td></tr>
          <tr><td>Return</td><td>${escapeHtml(fmtDT(r.scheduledReturnAt))}</td></tr>
        </table>
      </div>
      <div class="spc-section">
        <p class="spc-section__title">Officer & Purpose</p>
        <table class="spc-definition">
          <tr><td>Travelling Officer</td><td>${officerDetails}</td></tr>
          <tr><td>Official Description</td><td>${escapeHtml(purposeWithoutOfficer(r))}</td></tr>
          <tr><td>Goods</td><td>${formatPrintValue(r.goods)}</td></tr>
        </table>
      </div>
      <div class="spc-section">
        <p class="spc-section__title">Gate</p>
        <table class="spc-definition">
          <tr><td>Exit</td><td>${escapeHtml(fmtDT(r.gateExitAt))} • O ${formatPrintValue(r.exitOdometer)}</td></tr>
          <tr><td>Entry</td><td>${escapeHtml(fmtDT(r.gateEntryAt))} • O ${formatPrintValue(r.entryOdometer)}</td></tr>
        </table>
      </div>
    `;

    printDocument({
      title: 'Transport Request',
      subtitle: `Code: ${r.requestCode || '—'}`,
      contentHtml,
      printedBy: guessPrintedBy(),
      extraCss: MY_REQUESTS_PRINT_STYLES,
    });
  }, []);

  const COLS = React.useMemo(() => ['12%','17%','10%','12%','15%','14%','14%','6%'], []);

  return (
    <div className="space-y-4 text-[13px]">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-orange-700">Requests</p>
          <h1 className="text-2xl font-bold text-orange-900">My submissions</h1>
          <p className="text-sm text-gray-600">Search, print or drill into your transport requests.</p>
        </div>
        <div className="flex w-full flex-col gap-2 lg:w-auto lg:flex-row lg:items-center">
          <WorkspaceSearchBar
            value={q}
            onChange={setQ}
            placeholder="Search code, applicant, dept, route…"
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

        {!ids.length && (
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
                      <div className="text-[10px] text-gray-500">Account: {resolveAccountUser(r)}</div>
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
      {view && <DetailsModal request={view} onClose={() => setView(null)} />}
    </div>
  );
}

/* ========== Details Modal ========== */
function DetailsModal({ request, onClose }: { request: UsageRequest; onClose: () => void }) {
  const off = extractOfficer(request as any);
  const submitterAccount = resolveAccountUser(request as any);
  const updatedAccount = resolveUpdatedBy(request as any, submitterAccount);
  const submitterName = `${(request as any).applicantName || '—'}${
    (request as any).employeeId ? ` (${(request as any).employeeId})` : ''
  }`;
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
            <section className="md:col-span-2 border border-orange-100 rounded-lg p-3">
              <div className="text-orange-800 font-semibold mb-1">Account trail</div>
              <div><b>Submitted by account:</b> {submitterAccount}</div>
              <div className="text-[11px] text-gray-600"><b>Applicant:</b> {submitterName}</div>
              <div><b>Created at:</b> {fmtDT((request as any).createdAt)}</div>
              <div><b>Last updated by:</b> {updatedAccount}</div>
              <div><b>Updated at:</b> {(request as any).updatedAt ? fmtDT((request as any).updatedAt) : '—'}</div>
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
