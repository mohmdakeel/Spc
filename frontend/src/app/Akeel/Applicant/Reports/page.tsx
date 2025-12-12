'use client';

import * as React from 'react';
import { Search as SearchIcon, Filter, Download, RefreshCcw, CalendarDays } from 'lucide-react';
import { listMyRequests, listAllRequests } from '../../Transport/services/usageService';
import type { UsageRequest } from '../../Transport/services/types';
import { Th, Td } from '../../Transport/components/ThTd';
import { readCache, writeCache } from '../../../../../lib/cache';

const STATUS_SEGMENTS = [
  { key: 'PENDING', label: 'Pending', statuses: ['PENDING_HOD', 'PENDING_MANAGEMENT'], description: 'Awaiting approvals' },
  { key: 'APPROVED', label: 'Approved', statuses: ['APPROVED'], description: 'Ready for scheduling' },
  { key: 'ACTIVE', label: 'Active', statuses: ['SCHEDULED', 'DISPATCHED'], description: 'Currently scheduled/ongoing' },
  { key: 'COMPLETED', label: 'Completed', statuses: ['RETURNED', 'COMPLETED'], description: 'Trips returned & closed' },
  { key: 'REJECTED', label: 'Rejected', statuses: ['REJECTED'], description: 'Declined or cancelled' },
] as const;

const TIMEFRAME_OPTIONS = [
  { key: 'ALL', label: 'All time', days: null },
  { key: '365', label: 'Last 12 months', days: 365 },
  { key: '90', label: 'Last 90 days', days: 90 },
  { key: '30', label: 'Last 30 days', days: 30 },
] as const;

type StatusSegmentKey = (typeof STATUS_SEGMENTS)[number]['key'];
type TimeframeKey = (typeof TIMEFRAME_OPTIONS)[number]['key'];

const STATUS_LABELS: Record<string, string> = {
  PENDING_HOD: 'Pending HOD',
  PENDING_MANAGEMENT: 'Pending Management',
  APPROVED: 'Approved',
  SCHEDULED: 'Scheduled',
  DISPATCHED: 'Dispatched',
  RETURNED: 'Returned',
  COMPLETED: 'Completed',
  REJECTED: 'Rejected',
};

const STATUS_CLASSES: Record<string, string> = {
  PENDING_HOD: 'bg-amber-50 text-amber-700 border border-amber-200',
  PENDING_MANAGEMENT: 'bg-amber-50 text-amber-700 border border-amber-200',
  APPROVED: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  SCHEDULED: 'bg-sky-50 text-sky-700 border border-sky-200',
  DISPATCHED: 'bg-indigo-50 text-indigo-700 border border-indigo-200',
  RETURNED: 'bg-slate-100 text-slate-700 border border-slate-200',
  COMPLETED: 'bg-slate-100 text-slate-700 border border-slate-200',
  REJECTED: 'bg-rose-50 text-rose-700 border border-rose-200',
};

const fmtDT = (value?: string | null) => (value ? new Date(value).toLocaleString() : '');

const parseDate = (value?: string | null) => {
  if (!value) return undefined;
  const dt = new Date(value);
  return Number.isNaN(dt.getTime()) ? undefined : dt;
};

const getRequestDate = (payload?: Partial<UsageRequest> | null) => {
  if (!payload) return undefined;
  const created = parseDate(payload.createdAt as string | undefined);
  if (created) return created;
  const appliedDate = (payload as any)?.appliedDate || (payload as any)?.applied_on || (payload as any)?.appliedOn;
  if (!appliedDate) return undefined;
  const appliedTime = (payload as any)?.appliedTime || (payload as any)?.applied_time || '00:00';
  return parseDate(`${appliedDate}T${appliedTime}`);
};

const appliedLabel = (payload?: Partial<UsageRequest> | null) => {
  if (!payload) return '';
  const d = (payload as any)?.appliedDate || (payload as any)?.applied_on || (payload as any)?.appliedOn;
  const t = (payload as any)?.appliedTime || (payload as any)?.applied_time;
  if (d && t) return `${d} ${t}`;
  if (d && payload?.createdAt) {
    const tt = new Date(payload.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return `${d} ${tt}`;
  }
  if (payload?.createdAt) return fmtDT(payload.createdAt);
  return '';
};

const escapeCsv = (value: string | number | null | undefined) => {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (!/[",\n]/.test(str)) return str;
  return `"${str.replace(/"/g, '""')}"`;
};

const StatusPill = ({ status }: { status?: string | null }) => {
  const key = status ?? '';
  const cls = STATUS_CLASSES[key] ?? 'bg-gray-100 text-gray-700 border border-gray-200';
  const label = STATUS_LABELS[key] ?? (status || 'Unknown');
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${cls}`}>{label}</span>;
};

export default function ApplicantReportsPage() {
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
  const [initialized, setInitialized] = React.useState(false);
  const [loading, setLoading] = React.useState(!initialItems.length);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [timeframe, setTimeframe] = React.useState<TimeframeKey>('ALL');
  const [statusFilter, setStatusFilter] = React.useState<StatusSegmentKey[]>([]);

  React.useEffect(() => {
    const eid = (typeof window !== 'undefined' && (localStorage.getItem('employeeId') || '')) || '';
    const actor = (typeof window !== 'undefined' && (localStorage.getItem('actor') || '')) || '';
    const username = (typeof window !== 'undefined' && (localStorage.getItem('username') || '')) || '';
    const uniqueIds = Array.from(new Set([eid, actor, username].filter(Boolean)));
    setIds(uniqueIds);
    setInitialized(true);

    if (!uniqueIds.length) {
      setItems([]);
      setLoading(false);
      return;
    }

    (async () => {
      setLoading(true);
      let all: UsageRequest[] = [];
      try {
        // Primary: per-id "my requests"
        for (const uid of uniqueIds) {
          let page = 0;
          let totalPages = 1;
          while (page < totalPages) {
            const result = await listMyRequests(uid, page, 100);
            all = all.concat(result?.content || []);
            totalPages = (result?.totalPages as number) ?? 1;
            page = ((result?.number as number) ?? page) + 1;
          }
        }

        // Safety: also pull all and filter by employee/creator matches
        try {
          const everything = await listAllRequests();
          const filtered = (everything || []).filter((r: any) => {
            const created = r?.createdBy ?? r?.created_by ?? '';
            return uniqueIds.includes(r?.employeeId) || uniqueIds.includes(created);
          });
          all = all.concat(filtered);
        } catch {}

        // De-duplicate (prefer unique id/requestCode)
        const seen = new Set<string>();
        all = all.filter((r: any) => {
          const key = String(r?.id ?? r?.requestCode ?? `${r?.employeeId || ''}|${r?.dateOfTravel || ''}|${r?.timeFrom || ''}`);
          if (!key || seen.has(key)) return false;
          seen.add(key);
          return true;
        });

        all.sort((a, b) => {
          const ta = a?.createdAt ? Date.parse(a.createdAt) : 0;
          const tb = b?.createdAt ? Date.parse(b.createdAt) : 0;
          return tb - ta;
        });
      } finally {
        uniqueIds.forEach((id) => writeCache(`cache:applicant:requests:${id}`, all));
        writeCache('cache:applicant:requests:all', all);
        setItems(all);
        setLoading(false);
      }
    })();
  }, []);

  const statusCounts = React.useMemo(() => {
    return items.reduce((acc, item) => {
      const status = item?.status;
      if (!status) return acc;
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }, [items]);

  const timeframeMeta = React.useMemo(() => TIMEFRAME_OPTIONS.find((opt) => opt.key === timeframe) || TIMEFRAME_OPTIONS[0], [timeframe]);
  const statusSelection = React.useMemo(() => {
    if (!statusFilter.length) return null;
    const codes = new Set<string>();
    statusFilter.forEach((key) => {
      const seg = STATUS_SEGMENTS.find((s) => s.key === key);
      seg?.statuses.forEach((code) => codes.add(code));
    });
    return codes.size ? codes : null;
  }, [statusFilter]);

  const filteredItems = React.useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    const cutoff = timeframeMeta.days ? Date.now() - timeframeMeta.days * 24 * 60 * 60 * 1000 : null;

    return items.filter((request) => {
      if (statusSelection && (!request.status || !statusSelection.has(request.status))) return false;

      if (cutoff) {
        const dt = getRequestDate(request);
        if (!dt || dt.getTime() < cutoff) return false;
      }

      if (!term) return true;
      const haystack = [
        request.requestCode,
        request.applicantName,
        request.employeeId,
        request.fromLocation,
        request.toLocation,
        request.assignedVehicleNumber,
        request.status,
      ]
        .filter(Boolean)
        .map((val) => val!.toString().toLowerCase())
        .join(' ');
      return haystack.includes(term);
    });
  }, [items, searchTerm, statusSelection, timeframeMeta]);

  const pendingTotal = (statusCounts['PENDING_HOD'] || 0) + (statusCounts['PENDING_MANAGEMENT'] || 0);
  const approvedTotal = statusCounts['APPROVED'] || 0;
  const rejectedTotal = statusCounts['REJECTED'] || 0;
  const activeTotal = (statusCounts['SCHEDULED'] || 0) + (statusCounts['DISPATCHED'] || 0);
  const completedTotal = (statusCounts['RETURNED'] || 0) + (statusCounts['COMPLETED'] || 0);

  const summaryCards = [
    { label: 'Filtered results', value: filteredItems.length, helper: 'Match current filters' },
    { label: 'Pending', value: pendingTotal, helper: 'Awaiting approval' },
    { label: 'Approved', value: approvedTotal, helper: 'Ready to dispatch' },
    { label: 'Active trips', value: activeTotal, helper: 'Scheduled or dispatched' },
    { label: 'Completed', value: completedTotal, helper: 'Returned vehicles' },
    { label: 'Rejected', value: rejectedTotal, helper: 'Need revisions' },
  ];

  const hasFilters = Boolean(statusFilter.length || searchTerm.trim() || timeframe !== 'ALL');

  const toggleSegment = (key: StatusSegmentKey) => {
    setStatusFilter((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  };

  const resetFilters = () => {
    setStatusFilter([]);
    setSearchTerm('');
    setTimeframe('ALL');
  };

  const handleExport = React.useCallback(() => {
    if (!filteredItems.length) return;
    const header = ['Request Code', 'Status', 'Applicant', 'Employee ID', 'Route', 'Travel Date', 'Travel Time', 'Vehicle', 'Applied On'];
    const rows = filteredItems.map((request) => [
      request.requestCode || '',
      STATUS_LABELS[request.status] || request.status || '',
      request.applicantName || '',
      request.employeeId || '',
      [request.fromLocation, request.toLocation].filter(Boolean).join(' → '),
      request.dateOfTravel || '',
      [request.timeFrom, request.timeTo].filter(Boolean).join('-'),
      request.assignedVehicleNumber || '',
      appliedLabel(request),
    ]);

    const csv = [header, ...rows]
      .map((row) => row.map((cell) => escapeCsv(cell)).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'transport-requests-report.csv';
    a.click();
    URL.revokeObjectURL(url);
  }, [filteredItems]);

  const statusButton = (segment: (typeof STATUS_SEGMENTS)[number]) => {
    const isActive = statusFilter.includes(segment.key);
    const count = segment.statuses.reduce((sum, code) => sum + (statusCounts[code] || 0), 0);
    return (
      <button
        key={segment.key}
        type="button"
        onClick={() => toggleSegment(segment.key)}
        className={`px-3 py-2 rounded-xl border text-xs font-medium transition ${
          isActive ? 'bg-orange-600 border-orange-600 text-white shadow-sm' : 'bg-white border-orange-200 text-orange-900 hover:bg-orange-50'
        }`}
      >
        <div className="flex items-center gap-2">
          <span>{segment.label}</span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${
            isActive ? 'border-white/40 bg-white/10 text-white' : 'border-orange-200 bg-orange-50 text-orange-700'
          }`}
          >
            {count}
          </span>
        </div>
        <p className={`mt-1 text-[10px] ${isActive ? 'text-orange-50' : 'text-gray-500'}`}>{segment.description}</p>
      </button>
    );
  };

  if (!initialized) {
    return (
      <div className="bg-white rounded-2xl border border-orange-200 shadow-sm p-6 text-sm text-gray-600">
        Preparing your report workspace…
      </div>
    );
  }

  if (!ids.length) {
    return (
      <div className="bg-white rounded-2xl border border-orange-200 shadow-sm p-6">
        <p className="text-sm text-orange-900 font-semibold">Save your first request to unlock reporting</p>
        <p className="text-sm text-gray-600 mt-1">
          We could not find an Employee ID in this browser. Submit a request or log back in to view reports.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-orange-200 shadow-sm p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-orange-600">Applicant reports</p>
            <h1 className="text-2xl font-semibold text-orange-950">Usage request intelligence</h1>
            <p className="text-sm text-gray-600">
              Slice your transport requests by status or timeframe, then export a ready-to-share CSV.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={resetFilters}
              disabled={!hasFilters}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition ${
                hasFilters ? 'text-orange-700 border-orange-300 hover:bg-orange-50' : 'text-gray-400 border-gray-200 cursor-not-allowed'
              }`}
            >
              <RefreshCcw size={16} />
              Reset
            </button>
            <button
              type="button"
              onClick={handleExport}
              disabled={!filteredItems.length}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
                filteredItems.length ? 'bg-orange-600 text-white hover:bg-orange-700' : 'bg-gray-200 text-gray-500 cursor-not-allowed'
              }`}
            >
              <Download size={16} />
              Export CSV
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {summaryCards.map((card) => (
          <div key={card.label} className="bg-white border border-orange-200 rounded-2xl px-4 py-3">
            <p className="text-[11px] uppercase text-gray-500 font-semibold">{card.label}</p>
            <p className="text-3xl font-semibold text-orange-900">{card.value}</p>
            <p className="text-[11px] text-gray-500">{card.helper}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-orange-200 shadow-sm p-4 space-y-3">
        <div className="flex items-center gap-2 text-[11px] font-semibold text-orange-700 uppercase tracking-wide">
          <Filter size={14} />
          Status filters
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setStatusFilter([])}
            className={`px-4 py-2 rounded-xl border text-xs font-semibold ${
              statusFilter.length ? 'border-orange-200 text-orange-900 hover:bg-orange-50' : 'bg-orange-600 border-orange-600 text-white shadow-sm'
            }`}
          >
            All statuses
          </button>
          {STATUS_SEGMENTS.map((segment) => statusButton(segment))}
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <label className="flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-xl px-3 py-2">
            <SearchIcon size={16} className="text-orange-500" />
            <input
              className="flex-1 bg-transparent text-sm outline-none text-orange-900 placeholder:text-orange-400"
              placeholder="Search by code, employee, route or vehicle"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </label>
          <label className="flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-xl px-3 py-2">
            <CalendarDays size={16} className="text-orange-500" />
            <select
              className="flex-1 bg-transparent text-sm outline-none text-orange-900"
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value as TimeframeKey)}
            >
              {TIMEFRAME_OPTIONS.map((option) => (
                <option key={option.key} value={option.key} className="text-gray-900">
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <div className="text-sm text-gray-600 bg-orange-50 border border-dashed border-orange-200 rounded-xl px-3 py-2 flex items-center">
            {statusFilter.length ? (
              <span>
                Showing <strong>{filteredItems.length}</strong> rows across {statusFilter.length} selected filter
                {statusFilter.length > 1 ? 's' : ''}.
              </span>
            ) : (
              <span>
                Showing <strong>all statuses</strong> over {timeframeMeta.label.toLowerCase()}.
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-orange-200 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-orange-100">
          <div>
            <p className="text-sm font-semibold text-orange-900">Detailed request log</p>
            <p className="text-xs text-gray-500">{filteredItems.length} result(s)</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-orange-50 text-[11px] uppercase text-orange-700">
              <tr>
                <Th className="px-3 py-2 text-left">Request</Th>
                <Th className="px-3 py-2 text-left">Status</Th>
                <Th className="px-3 py-2 text-left">Route</Th>
                <Th className="px-3 py-2 text-left">Travel window</Th>
                <Th className="px-3 py-2 text-left">Vehicle</Th>
                <Th className="px-3 py-2 text-left">Applied / Updated</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-orange-100 text-[13px]">
              {loading ? (
                <tr>
                  <Td colSpan={6} className="px-3 py-6 text-center text-gray-500">Loading report…</Td>
                </tr>
              ) : !filteredItems.length ? (
                <tr>
                  <Td colSpan={6} className="px-3 py-6 text-center text-gray-500">No requests match the selected filters.</Td>
                </tr>
              ) : (
                filteredItems.map((request) => {
                  const applicantLine = [request.applicantName, request.employeeId].filter(Boolean).join(' • ');
                  const route = [request.fromLocation, request.toLocation].filter(Boolean).join(' → ');
                  const travelWindow = [request.timeFrom, request.timeTo].filter(Boolean).join(' – ');
                  const applied = appliedLabel(request);
                  const lastUpdated = fmtDT(request.updatedAt);
                  return (
                  <tr key={request.id} className="align-top">
                    <Td className="px-3 py-3">
                      <div className="font-semibold text-orange-900">{request.requestCode || ''}</div>
                      {applicantLine ? <div className="text-xs text-gray-500">{applicantLine}</div> : null}
                    </Td>
                    <Td className="px-3 py-3">
                      <StatusPill status={request.status} />
                      {request.department ? (
                        <div className="text-[11px] text-gray-500 mt-1">{request.department}</div>
                      ) : null}
                    </Td>
                    <Td className="px-3 py-3">
                      <div className="font-medium text-orange-900">{route}</div>
                      {request.officialDescription ? (
                        <div className="text-[11px] text-gray-500">{request.officialDescription}</div>
                      ) : null}
                    </Td>
                    <Td className="px-3 py-3">
                      <div>{request.dateOfTravel || ''}</div>
                      {travelWindow || request.overnight ? (
                        <div className="font-mono text-[11px] text-gray-600">
                          {travelWindow}
                          {request.overnight ? ' (overnight)' : ''}
                        </div>
                      ) : null}
                    </Td>
                    <Td className="px-3 py-3">
                      <div className="font-medium text-orange-900">{request.assignedVehicleNumber || ''}</div>
                      {request.assignedDriverName ? (
                        <div className="text-[11px] text-gray-500">{request.assignedDriverName}</div>
                      ) : null}
                    </Td>
                    <Td className="px-3 py-3">
                      <div className="font-medium text-orange-900">{applied}</div>
                      {lastUpdated ? (
                        <div className="text-[11px] text-gray-500">Updated {lastUpdated}</div>
                      ) : null}
                    </Td>
                  </tr>
                );
              })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
