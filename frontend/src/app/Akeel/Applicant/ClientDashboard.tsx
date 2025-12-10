'use client';

import * as React from 'react';
import Link from 'next/link';
import { listMyRequests, hodApprove, hodReject } from '../Transport/services/usageService';
import { login } from '../../../../lib/auth';
import type { UsageRequest } from '../Transport/services/types';
import { Th, Td } from '../Transport/components/ThTd';
import {
  Search as SearchIcon,
  FileText,
  PlusCircle,
  ClipboardList,
  CalendarClock,
  Navigation2,
  CheckCircle2,
  BellRing,
  X,
} from 'lucide-react';

/* ---------- helpers ---------- */
const chip = (s: string) => (
  <span className="inline-block whitespace-nowrap text-[10px] px-1.5 py-[2px] rounded bg-orange-100 text-orange-800 leading-none">
    {s}
  </span>
);
const fmtDT = (s?: string | null) => (s ? new Date(s).toLocaleString() : '-');

/** Prefer appliedDate+appliedTime, fallback to createdAt */
const appliedLabel = (r: any) => {
  const d = r?.appliedDate || r?.applied_on || r?.appliedOn;
  const t = r?.appliedTime || r?.applied_time;
  if (d && t) return `${d} ${t}`;
  if (d && r?.createdAt) {
    const tt = new Date(r.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return `${d} ${tt}`;
  }
  if (r?.createdAt) return fmtDT(r.createdAt);
  return '-';
};

/** Extract officer info from explicit fields OR parse "Travelling Officer:" from description/remarks */
function extractOfficer(r?: Partial<UsageRequest> | null): {
  withOfficer: boolean;
  name?: string;
  id?: string;
  phone?: string;
} {
  if (!r) return { withOfficer: false };

  if ((r as any).travelWithOfficer || (r as any).officerName || (r as any).officerId || (r as any).officerPhone) {
    return {
      withOfficer: !!((r as any).travelWithOfficer || (r as any).officerName || (r as any).officerId || (r as any).officerPhone),
      name: (r as any).officerName || undefined,
      id: (r as any).officerId || undefined,
      phone: (r as any).officerPhone || undefined,
    };
  }

  const text = `${(r as any)?.officialDescription ?? ''}\n${(r as any)?.remarks ?? ''}`;
  const m = /Travelling Officer:\s*([^\(\n,]+)?(?:\s*\(Employee ID:\s*([^)]+)\))?(?:,\s*Phone:\s*([^\s,]+))?/i.exec(text);
  if (m) return { withOfficer: true, name: m[1]?.trim(), id: m[2]?.trim(), phone: m[3]?.trim() };

  return { withOfficer: false };
}

/** Stable key even if id is missing */
const rowKey = (r: Partial<UsageRequest> | undefined, i: number) =>
  String(
    (r as any)?.id ??
      (r as any)?.requestCode ??
      `${(r as any)?.employeeId ?? 'row'}|${(r as any)?.dateOfTravel ?? ''}|${(r as any)?.createdAt ?? ''}|${i}`
  );

const parseDate = (value?: string | null) => {
  if (!value) return undefined;
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return undefined;
  return dt;
};

const getRequestDate = (r?: Partial<UsageRequest> | null) => {
  if (!r) return undefined;
  const created = parseDate((r as any)?.createdAt);
  if (created) return created;

  const appliedDate = (r as any)?.appliedDate || (r as any)?.applied_on || (r as any)?.appliedOn;
  if (!appliedDate) return undefined;

  const appliedTime = (r as any)?.appliedTime || (r as any)?.applied_time || '00:00';
  return parseDate(`${appliedDate}T${appliedTime}`);
};

/** Resolve account username from record */
const resolveAccountUser = (r: any): string => {
  const cleaned = [r?.createdBy, r?.created_by, r?.actor]
    .map((v) => (v === undefined || v === null ? '' : String(v).trim()))
    .find((v) => v && !['system', 'null', 'undefined', '-'].includes(v.toLowerCase()));
  return cleaned || '—';
};

/** Resolve who last updated the record */
const resolveUpdatedBy = (r: any, submitter: string): string => {
  const raw = r?.updatedBy ?? r?.updated_by;
  const val = raw === undefined || raw === null ? '' : String(raw).trim();
  if (val && !['system', 'null', 'undefined', '-'].includes(val.toLowerCase())) return val;
  return submitter || '—';
};

export default function ClientDashboard() {
  const [items, setItems] = React.useState<UsageRequest[]>([]);
  const [employeeId, setEmployeeId] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [view, setView] = React.useState<UsageRequest | null>(null);

  const loadAll = React.useCallback(async () => {
    const id = localStorage.getItem('employeeId') || localStorage.getItem('actor') || '';
    setEmployeeId(id);

    if (!id) {
      setItems([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    let all: UsageRequest[] = [];
    let page = 0;
    let totalPages = 1;
    try {
      while (page < totalPages) {
        const p = await listMyRequests(id, page, 100);
        all = all.concat(p?.content || []);
        totalPages = (p?.totalPages as number) ?? 1;
        page = ((p?.number as number) ?? page) + 1;
      }
      // newest first
      all.sort((a: any, b: any) => {
        const ta = a?.createdAt ? Date.parse(a.createdAt) : 0;
        const tb = b?.createdAt ? Date.parse(b.createdAt) : 0;
        return tb - ta;
      });
    } finally {
      setItems(all);
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadAll();
  }, [loadAll]);

  const statusCounts = React.useMemo(() => {
    return items.reduce((acc, item) => {
      const status = item?.status;
      if (!status) return acc;
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }, [items]);

  const count = React.useCallback((s: string) => statusCounts[s] ?? 0, [statusCounts]);

  const filteredItems = React.useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return items;
    return items.filter((r) => {
      const safe = [
        r?.requestCode,
        r?.employeeId,
        r?.applicantName,
        r?.fromLocation,
        r?.toLocation,
        r?.assignedVehicleNumber,
        r?.status,
      ]
        .filter(Boolean)
        .map((v) => v!.toString().toLowerCase())
        .join(' ');
      return safe.includes(term);
    });
  }, [items, searchTerm]);

  const tableRows = filteredItems.slice(0, 15);
  const totalRequests = items.length;
  const scheduledCount = statusCounts['SCHEDULED'] ?? 0;
  const dispatchedCount = statusCounts['DISPATCHED'] ?? 0;
  const activeTrips = scheduledCount + dispatchedCount;
  const approvalCount = statusCounts['APPROVED'] ?? 0;
  const pendingTotal = (statusCounts['PENDING_HOD'] ?? 0) + (statusCounts['PENDING_MANAGEMENT'] ?? 0);
  const completionStatuses = ['RETURNED', 'COMPLETED'];
  const completedCount = completionStatuses.reduce((sum, key) => sum + (statusCounts[key] ?? 0), 0);
  const completionRate = totalRequests ? Math.round((completedCount / totalRequests) * 100) : 0;
  const approvalRate = totalRequests ? Math.round((approvalCount / totalRequests) * 100) : 0;

  const monthlyActivity = React.useMemo(() => {
    const base = new Date();
    base.setDate(1);
    const months: { key: string; label: string }[] = [];
    for (let i = 5; i >= 0; i -= 1) {
      const d = new Date(base.getFullYear(), base.getMonth() - i, 1);
      months.push({
        key: `${d.getFullYear()}-${d.getMonth()}`,
        label: d.toLocaleString(undefined, { month: 'short' }),
      });
    }

    const counts = items.reduce((acc, r) => {
      const dt = getRequestDate(r);
      if (!dt) return acc;
      const key = `${dt.getFullYear()}-${dt.getMonth()}`;
      acc.set(key, (acc.get(key) || 0) + 1);
      return acc;
    }, new Map<string, number>());

    return months.map((m) => ({
      label: m.label,
      key: m.key,
      value: counts.get(m.key) ?? 0,
    }));
  }, [items]);

  const monthlyMax = monthlyActivity.reduce((max, m) => Math.max(max, m.value), 0) || 1;
  const currentMonthRequests =
    monthlyActivity.length > 0 ? monthlyActivity[monthlyActivity.length - 1]?.value ?? 0 : 0;
  const previousMonthRequests =
    monthlyActivity.length > 1 ? monthlyActivity[monthlyActivity.length - 2]?.value ?? 0 : 0;
  const monthTrend = currentMonthRequests - previousMonthRequests;
  const monthTrendText =
    monthTrend === 0 ? 'Even vs last month' : `${monthTrend > 0 ? '+' : ''}${monthTrend} vs last month`;
  const monthTrendClass = monthTrend > 0 ? 'text-emerald-600' : monthTrend < 0 ? 'text-rose-600' : 'text-gray-600';

  const summaryCards = [
    {
      label: 'Total Requests',
      value: totalRequests,
      helper: `${approvalRate || 0}% approved overall`,
      icon: ClipboardList,
    },
    {
      label: 'This Month',
      value: currentMonthRequests,
      helper: monthTrendText,
      icon: CalendarClock,
    },
    {
      label: 'Active Trips',
      value: activeTrips,
      helper: `${scheduledCount} scheduled · ${dispatchedCount} dispatched`,
      icon: Navigation2,
    },
  ];

  const recentApprovals = React.useMemo(() => {
    const approvals = items.filter((r) => r.status === 'APPROVED');
    if (!approvals.length) return [];
    const cutoff = Date.now() - 1000 * 60 * 60 * 24 * 14;
    const filtered = approvals.filter((r) => {
      const dt = getRequestDate(r);
      return dt ? dt.getTime() >= cutoff : false;
    });
    return (filtered.length ? filtered : approvals).slice(0, 4);
  }, [items]);

  return (
    <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-orange-200 shadow-sm p-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="w-full lg:max-w-xl">
                <p className="text-xs font-semibold text-orange-800 uppercase tracking-wide mb-1">
                  Search Requests
                </p>
                <div className="flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-xl px-3 py-2">
                  <SearchIcon size={16} className="text-orange-500" />
                  <input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by code, location, vehicle or status..."
                    className="flex-1 bg-transparent outline-none text-sm text-orange-900 placeholder:text-orange-400"
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-2 justify-end">
                <Link
                  href="/Akeel/Applicant/NewRequest"
                  className="inline-flex items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-700 transition-all"
                >
                  <PlusCircle size={16} />
                  New Request
                </Link>
                <Link
                  href="/Akeel/Applicant/MyRequests"
                  className="inline-flex items-center gap-2 border border-orange-300 text-orange-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-50 transition-all"
                >
                  <FileText size={16} />
                  My Requests
                </Link>
              </div>
            </div>
          </div>

          {!employeeId ? (
            <div className="text-[12px] text-yellow-800 bg-yellow-50 border border-yellow-200 rounded px-3 py-2">
              Submit a request first — your Employee ID will be remembered and your dashboard will populate.
            </div>
          ) : loading ? (
            <div className="text-sm text-gray-500">Loading…</div>
          ) : null}

          {employeeId ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {summaryCards.map(({ label, value, helper, icon: Icon }) => (
                  <div
                    key={label}
                    className="bg-white rounded-2xl border border-orange-200 shadow-sm p-4 flex flex-col gap-2"
                  >
                    <div className="flex items-center justify-between text-xs font-semibold text-orange-700 uppercase">
                      <span>{label}</span>
                      <Icon size={16} className="text-orange-500" />
                    </div>
                    <div className="text-3xl font-semibold text-orange-900">{value}</div>
                    <div className="text-[11px] text-gray-600">{helper}</div>
                  </div>
                ))}
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <div className="bg-white rounded-2xl border border-orange-200 shadow-sm p-4 md:col-span-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-orange-900">Monthly activity</p>
                    <span className={`text-[11px] font-medium ${monthTrendClass}`}>{monthTrendText}</span>
                  </div>
                  <div className="mt-4 space-y-2">
                    {monthlyActivity.map((entry) => (
                      <div key={entry.key} className="flex items-center gap-3 text-[11px]">
                        <span className="w-10 font-medium text-orange-700">{entry.label}</span>
                        <div className="flex-1 h-2 rounded-full bg-orange-100 overflow-hidden">
                          <div
                            className="h-full bg-orange-500 rounded-full transition-[width]"
                            style={{ width: `${(entry.value / monthlyMax) * 100 || 0}%` }}
                          />
                        </div>
                        <span className="w-6 text-right font-semibold text-orange-900">{entry.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="bg-white rounded-2xl border border-orange-200 shadow-sm p-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-orange-900">
                      <CheckCircle2 size={16} className="text-emerald-500" />
                      Completion stats
                    </div>
                    <div className="mt-3">
                      <div className="text-3xl font-semibold text-orange-900">
                        {completionRate}
                        <span className="text-base font-medium text-gray-500">%</span>
                      </div>
                      <p className="text-[11px] text-gray-600">Trips fully returned this cycle</p>
                      <div className="mt-2 h-2 w-full bg-orange-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full transition-[width]"
                          style={{ width: `${completionRate}%` }}
                        />
                      </div>
                      <dl className="mt-3 grid grid-cols-3 gap-2 text-xs text-orange-900">
                        <div>
                          <dt className="text-[10px] text-gray-600 uppercase">Completed</dt>
                          <dd className="font-semibold">{completedCount}</dd>
                        </div>
                        <div>
                          <dt className="text-[10px] text-gray-600 uppercase">Pending</dt>
                          <dd className="font-semibold">{pendingTotal}</dd>
                        </div>
                        <div>
                          <dt className="text-[10px] text-gray-600 uppercase">Active</dt>
                          <dd className="font-semibold">{activeTrips}</dd>
                        </div>
                      </dl>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl border border-orange-200 shadow-sm p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm font-semibold text-orange-900">
                        <BellRing size={16} className="text-orange-500" />
                        Recent approvals
                      </div>
                      <span className="text-[10px] uppercase text-gray-500">Last 2 weeks</span>
                    </div>
                    <div className="mt-3 space-y-2">
                      {recentApprovals.length ? (
                        recentApprovals.map((r, i) => (
                          <div
                            key={rowKey(r, i)}
                            className="border border-orange-100 rounded-xl px-3 py-2 flex items-center justify-between gap-2 text-[11px]"
                          >
                            <div>
                              <div className="text-sm font-semibold text-orange-900">{r?.requestCode || '—'}</div>
                              <div className="text-gray-600">{r?.applicantName || 'Applicant'}</div>
                            </div>
                            <div className="text-right text-[10px] text-gray-500">
                              <div>{appliedLabel(r)}</div>
                              <div className="text-emerald-600 font-semibold flex items-center gap-1 justify-end">
                                <CheckCircle2 size={12} />
                                Approved
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-[11px] text-gray-500">No approvals in the last two weeks.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : null}

          {/* compact KPI cards */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-2 md:gap-3">
            {([
              ['Pending HOD', 'PENDING_HOD'],
              ['Pending Mgmt', 'PENDING_MANAGEMENT'],
              ['Approved', 'APPROVED'],
            ['Scheduled', 'SCHEDULED'],
            ['Dispatched', 'DISPATCHED'],
            ['Returned', 'RETURNED'],
          ] as const).map(([label, key]) => (
            <div key={key} className="bg-white border border-orange-200 rounded-lg px-3 py-2">
              <div className="text-[11px] text-orange-700 truncate">{label}</div>
              <div className="text-2xl md:text-3xl font-bold text-orange-900">{count(key)}</div>
            </div>
            ))}
          </div>

          {/* recent table (ultra-compact) */}
          <div className="bg-white rounded-lg border border-orange-200 overflow-auto">
            <table className="w-full table-fixed text-[10px] leading-[1.15]">
            {/* keep on one line to avoid whitespace text nodes in colgroup */}
            <colgroup><col className="w-28"/><col className="w-52"/><col className="w-40"/><col className="w-36"/><col className="w-24"/></colgroup>
            <thead className="bg-orange-50">
              <tr className="text-[9.5px]">
                <Th className="px-2 py-1 text-left">Code</Th>
                <Th className="px-2 py-1 text-left">APPLICANT / OFFICER</Th>
                <Th className="px-2 py-1 text-left">Route</Th>
                <Th className="px-2 py-1 text-left">Travel</Th>
                <Th className="px-2 py-1 text-center">Status</Th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading && (
                <tr>
                  <Td colSpan={5} className="px-2 py-6 text-center text-gray-500">Loading…</Td>
                </tr>
              )}

              {!loading && tableRows.map((r: any, i: number) => {
                const off = extractOfficer(r);
                return (
                  <tr
                    key={rowKey(r, i)}
                    className="align-top hover:bg-orange-50/40 cursor-pointer"
                    onClick={() => setView(r)}
                  >
                    <Td className="px-2 py-1">
                      <div className="font-semibold text-orange-900 truncate" title={r?.requestCode || ''}>
                        {r?.requestCode || '—'}
                      </div>
                      <div className="text-[9px] text-gray-600 truncate" title={appliedLabel(r)}>
                        {appliedLabel(r)}
                      </div>
                    </Td>

                    <Td className="px-2 py-1">
                      <div className="truncate" title={`${r?.applicantName || ''} (${r?.employeeId || ''})`}>
                        <span className="font-medium text-orange-900">Applicant:</span> {r?.applicantName || '—'}
                        <span className="text-gray-600 text-[9px]"> ({r?.employeeId || '—'})</span>
                      </div>
                      <div
                        className="text-[9.5px] text-gray-700 truncate"
                        title={off.withOfficer ? `${off.name || '-'} (${off.id || '-'})${off.phone ? `, ${off.phone}` : ''}` : '—'}
                      >
                        <span className="font-medium">Officer:</span>{' '}
                        {off.withOfficer ? (
                          <>
                            {off.name || '-'}
                            <span className="text-gray-600 text-[9px]"> ({off.id || '-'})</span>
                            {off.phone ? <span className="text-gray-600 text-[9px]">, {off.phone}</span> : null}
                          </>
                        ) : (
                          '—'
                        )}
                      </div>
                    </Td>

                    <Td className="px-2 py-1">
                      <div className="truncate" title={`${r?.fromLocation || ''} → ${r?.toLocation || ''}`}>
                        {(r?.fromLocation || '—')} → {(r?.toLocation || '—')}
                      </div>
                      <div className="text-[9px] text-gray-600 truncate" title={r?.assignedVehicleNumber || '—'}>
                        {r?.assignedVehicleNumber || '—'}
                      </div>
                    </Td>

                    <Td className="px-2 py-1">
                      <div className="truncate">{r?.dateOfTravel || '—'}</div>
                      <div className="text-[9px] text-gray-600">
                        <span className="font-mono">{r?.timeFrom || '—'}</span>–<span className="font-mono">{r?.timeTo || '—'}</span>{' '}
                        {r?.overnight ? '(overnight)' : ''}
                      </div>
                    </Td>

                    <Td className="px-2 py-1 text-center">{chip(r?.status || '—')}</Td>
                  </tr>
                );
              })}

              {!loading && !tableRows.length && (
                <tr>
                  <Td colSpan={5} className="px-2 py-6 text-center text-gray-500">No recent requests</Td>
                </tr>
              )}
            </tbody>
          </table>
          </div>
          {view ? <DetailsModal request={view} onClose={() => setView(null)} onRefresh={loadAll} /> : null}
    </div>
  );
}

/* ------------ Details modal ------------ */
function DetailsModal({ request, onClose, onRefresh }: { request: UsageRequest; onClose: () => void; onRefresh: () => Promise<void> | void }) {
  const off = extractOfficer(request as any);
  const submitterAccount = resolveAccountUser(request as any);
  const updatedAccount = resolveUpdatedBy(request as any, submitterAccount);
  const yn = (b?: boolean) => (b ? 'Yes' : 'No');
  const [remarks, setRemarks] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [actionError, setActionError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const allowAction = ['PENDING_HOD', 'PENDING_MANAGEMENT'].includes((request as any)?.status || '');

  const perform = async (kind: 'approve' | 'reject') => {
    setActionError(null);
    const username = (typeof window !== 'undefined' && (localStorage.getItem('username') || localStorage.getItem('actor') || localStorage.getItem('employeeId'))) || '';
    if (!username) {
      setActionError('No username/actor found. Please log in again.');
      return;
    }
    if (!password.trim()) {
      setActionError('Enter your account password to continue.');
      return;
    }

    setBusy(true);
    try {
      await login({ username, password });
      if (kind === 'approve') {
        await hodApprove((request as any).id, remarks || 'Approved via dashboard');
      } else {
        await hodReject((request as any).id, remarks || 'Rejected via dashboard');
      }
      await onRefresh();
      onClose();
    } catch (err: any) {
      setActionError(err?.message || 'Action failed. Check your password and try again.');
    } finally {
      setBusy(false);
    }
  };

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
                <span className="font-medium text-orange-900">Applicant:</span> {(request as any).applicantName || '—'}
                <span className="text-gray-600 text-[11px]"> ({(request as any).employeeId || '—'})</span>
              </div>
              <div className="truncate"><span className="font-medium">Department:</span> {(request as any).department || '—'}</div>
              <div><span className="font-medium">Status:</span> {(request as any).status || '—'}</div>
              <div><span className="font-medium">Applied:</span> {appliedLabel(request as any)}</div>
            </section>

            <section>
              <div className="text-orange-800 font-semibold mb-1">Travel Plan</div>
              <div><b>Date of Travel:</b> {(request as any).dateOfTravel || '—'}</div>
              <div><b>Time:</b> {(request as any).timeFrom || '—'} – {(request as any).timeTo || '—'} {(request as any).overnight ? '(overnight)' : ''}</div>
              <div><b>Route:</b> {(request as any).fromLocation || '—'} → {(request as any).toLocation || '—'}</div>
              <div><b>Assigned Vehicle:</b> {(request as any).assignedVehicleNumber || '—'}</div>
              <div><b>Driver:</b> {(request as any).assignedDriverName || '—'}{(request as any).assignedDriverPhone ? ` (${(request as any).assignedDriverPhone})` : ''}</div>
            </section>

            <section className="md:col-span-2 border border-orange-100 rounded-lg p-3">
              <div className="text-orange-800 font-semibold mb-2">Official Description / Goods</div>
              <div className="text-orange-900 break-words break-all mb-1">{(request as any).officialDescription || '—'}</div>
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
              <div className="text-orange-800 font-semibold mb-1">Schedule & Gate</div>
              <div><b>Pickup:</b> {fmtDT((request as any).scheduledPickupAt)}</div>
              <div><b>Return:</b> {fmtDT((request as any).scheduledReturnAt)}</div>
              <div><b>Exit:</b> {fmtDT((request as any).gateExitAt)} • <span className="text-[11px] text-gray-600">O {(request as any).exitOdometer ?? '—'}</span></div>
              <div><b>Entry:</b> {fmtDT((request as any).gateEntryAt)} • <span className="text-[11px] text-gray-600">O {(request as any).entryOdometer ?? '—'}</span></div>
            </section>

            <section className="md:col-span-2 border border-orange-100 rounded-lg p-3">
              <div className="text-orange-800 font-semibold mb-1">Account Trail</div>
              <div><b>Submitted by account:</b> {submitterAccount}</div>
              <div><b>Created at:</b> {fmtDT((request as any).createdAt)}</div>
              <div><b>Last updated by:</b> {updatedAccount}</div>
              <div><b>Updated at:</b> {(request as any).updatedAt ? fmtDT((request as any).updatedAt) : '—'}</div>
            </section>

            {allowAction && (
              <section className="md:col-span-2 border border-orange-100 rounded-lg p-3 space-y-3">
                <div className="text-orange-800 font-semibold mb-1">Approval</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <label className="text-sm text-gray-700">
                    Remarks (optional)
                    <textarea
                      className="w-full mt-1 border border-orange-200 rounded px-2 py-1 text-[12px]"
                      rows={2}
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                    />
                  </label>
                  <label className="text-sm text-gray-700">
                    Account password
                    <input
                      type="password"
                      className="w-full mt-1 border border-orange-200 rounded px-2 py-1 text-[12px]"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Re-enter password"
                    />
                  </label>
                </div>
                {actionError ? <div className="text-[11px] text-red-600">{actionError}</div> : null}
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded bg-emerald-600 text-white px-3 py-2 text-[12px] font-semibold hover:bg-emerald-700 disabled:opacity-60"
                    onClick={() => perform('approve')}
                    disabled={busy}
                    title="Approve & send forward"
                  >
                    <CheckCircle2 size={14} />
                    {busy ? 'Working…' : 'Approve'}
                  </button>
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded bg-rose-600 text-white px-3 py-2 text-[12px] font-semibold hover:bg-rose-700 disabled:opacity-60"
                    onClick={() => perform('reject')}
                    disabled={busy}
                    title="Reject"
                  >
                    <X size={14} />
                    {busy ? 'Working…' : 'Reject'}
                  </button>
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
