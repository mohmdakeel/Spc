'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { listByStatus } from '../Transport/services/usageService';
import type { UsageRequest } from '../Transport/services/types';
import WorkspaceSearchBar from '../../../../components/workspace/WorkspaceSearchBar';
import { useSearchParams } from 'next/navigation';

const fmtDT = (s?: string | null) => (s ? new Date(s).toLocaleString() : '—');

export default function ManagementDashboardPage() {
  const [pending, setPending] = useState<UsageRequest[]>([]);
  const [approved, setApproved] = useState<UsageRequest[]>([]);
  const [rejected, setRejected] = useState<UsageRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const params = useSearchParams();

  useEffect(() => {
    const q = params.get('q') || params.get('search');
    if (q) setSearchTerm(q);
  }, [params]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [p, a, r] = await Promise.all([
          listByStatus('PENDING_MANAGEMENT'),
          listByStatus('APPROVED'),
          listByStatus('REJECTED'),
        ]);
        setPending(p || []);
        setApproved(a || []);
        setRejected(r || []);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const cards = useMemo(() => ([
    { label: 'Pending (Management)', n: pending.length, hint: 'Awaiting your decision' },
    { label: 'Approved', n: approved.length, hint: 'Approved by Management' },
    { label: 'Rejected', n: rejected.length, hint: 'Rejected at Management' },
  ]), [pending, approved, rejected]);

  const filterList = useCallback(
    (list: UsageRequest[]) => {
      const term = searchTerm.trim().toLowerCase();
      if (!term) return list;
      return list.filter((r) =>
        [
          r.requestCode,
          r.applicantName,
          r.employeeId,
          r.fromLocation,
          r.toLocation,
          r.assignedVehicleNumber,
          r.status,
        ]
          .filter(Boolean)
          .map((v) => v!.toString().toLowerCase())
          .some((text) => text.includes(term))
      );
    },
    [searchTerm]
  );

  const filteredPending = useMemo(() => filterList(pending), [pending, filterList]);
  const filteredApproved = useMemo(() => filterList(approved), [approved, filterList]);
  const filteredRejected = useMemo(() => filterList(rejected), [rejected, filterList]);

  const renderList = (title: string, data: UsageRequest[]) => (
    <section className="bg-white rounded-2xl border border-orange-200 shadow-sm p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-orange-900">{title}</h2>
          <p className="text-xs text-gray-500">{data.length} request(s)</p>
        </div>
        <span className="text-xs px-2 py-1 rounded-full bg-orange-50 text-orange-700 border border-orange-100">
          showing {Math.min(5, data.length)} of {data.length}
        </span>
      </div>
      <div className="divide-y">
        {data.slice(0, 5).map((r) => (
          <article key={r.id ?? r.requestCode} className="py-3 text-sm">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-orange-900">{r.requestCode}</p>
              <span className="text-xs text-gray-500">{fmtDT(r.createdAt)}</span>
            </div>
            <p className="text-gray-700">{r.applicantName} — {r.department}</p>
            <p className="text-xs text-gray-500">{r.fromLocation} → {r.toLocation}</p>
          </article>
        ))}
        {!data.length && (
          <p className="py-4 text-center text-xs text-gray-400">No records</p>
        )}
      </div>
    </section>
  );

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-orange-200 shadow-sm p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="w-full lg:max-w-xl">
            <p className="text-xs font-semibold text-orange-800 uppercase tracking-wide mb-1">Search queue</p>
            <WorkspaceSearchBar
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Search by code, applicant, department or route..."
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-lg border border-orange-200 bg-white p-5">
            <div className="text-sm text-orange-700">{c.label}</div>
            <div className="text-3xl font-bold text-orange-900">{loading ? '—' : c.n}</div>
            <div className="text-xs text-orange-600 mt-1">{c.hint}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {renderList('Pending', filteredPending)}
        {renderList('Recently Approved', filteredApproved)}
        {renderList('Recently Rejected', filteredRejected)}
      </div>
    </div>
  );
}
