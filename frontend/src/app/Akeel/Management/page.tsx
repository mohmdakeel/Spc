'use client';

import React, { useEffect, useMemo, useState } from 'react';
import ManagementSidebar from './components/ManagementSidebar';
import { listByStatus } from '../Transport/services/usageService';
import type { UsageRequest } from '../Transport/services/types';

export default function ManagementDashboardPage() {
  const [pending, setPending] = useState<UsageRequest[]>([]);
  const [approved, setApproved] = useState<UsageRequest[]>([]);
  const [rejected, setRejected] = useState<UsageRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(()=> {
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

  const cards = useMemo(()=>[
    { label: 'Pending (Management)', n: pending.length, hint: 'Awaiting your decision' },
    { label: 'Approved', n: approved.length, hint: 'Approved by Management' },
    { label: 'Rejected', n: rejected.length, hint: 'Rejected at Management' },
  ], [pending, approved, rejected]);

  return (
    <div className="flex min-h-screen bg-orange-50">
      <ManagementSidebar/>
      <main className="p-4 flex-1">
        <h1 className="text-lg font-bold text-orange-900 mb-4">Management Dashboard</h1>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {cards.map((c)=>(
            <div key={c.label} className="rounded-lg border border-orange-200 bg-white p-5">
              <div className="text-sm text-orange-700">{c.label}</div>
              <div className="text-3xl font-bold text-orange-900">{loading ? '—' : c.n}</div>
              <div className="text-xs text-orange-600 mt-1">{c.hint}</div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
