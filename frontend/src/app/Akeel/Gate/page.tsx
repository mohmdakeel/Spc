'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { listByStatus } from '../Transport/services/usageService';
import type { UsageRequest } from '../Transport/services/types';
import { Car, Clock } from 'lucide-react';

const fmtDT = (s?: string | null) => (s ? new Date(s).toLocaleString() : '-');

export default function GateDashboard() {
  const [scheduled, setScheduled] = useState<UsageRequest[]>([]);
  const [dispatched, setDispatched] = useState<UsageRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [sch, disp] = await Promise.all([listByStatus('SCHEDULED'), listByStatus('DISPATCHED')]);
        setScheduled(sch || []);
        setDispatched(disp || []);
      } finally { setLoading(false); }
    };
    load();
  }, []);

  const kpis = useMemo(() => ([
    { label: 'Scheduled', val: scheduled.length, icon: <Clock size={18} className="text-blue-600" /> },
    { label: 'On Trip (Dispatched)', val: dispatched.length, icon: <Car size={18} className="text-emerald-600" /> },
  ]), [scheduled, dispatched]);

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-bold text-orange-900">Gate Security Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(k => (
          <div key={k.label} className="rounded-lg border border-orange-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="text-sm text-orange-700">{k.label}</div>
              {k.icon}
            </div>
            <div className="text-3xl font-bold text-orange-900 mt-1">{loading ? '—' : k.val}</div>
          </div>
        ))}
      </div>

      <section className="rounded-lg border border-orange-200 bg-white overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-orange-100">
          <h2 className="text-md font-semibold text-orange-900">Scheduled Next</h2>
          <p className="text-xs text-gray-500">Upcoming pickups and returns</p>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-orange-50">
            <tr>
              <th className="px-4 py-2 text-left">Code</th>
              <th className="px-4 py-2 text-left">Vehicle</th>
              <th className="px-4 py-2 text-left">Driver</th>
              <th className="px-4 py-2 text-left">Pickup</th>
              <th className="px-4 py-2 text-left">Return</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {scheduled.slice(0, 8).map(r => (
              <tr key={r.id}>
                <td className="px-4 py-2">{r.requestCode}</td>
                <td className="px-4 py-2">{r.assignedVehicleNumber || '-'}</td>
                <td className="px-4 py-2">{r.assignedDriverName || '-'}</td>
                <td className="px-4 py-2">{fmtDT(r.scheduledPickupAt)}</td>
                <td className="px-4 py-2">{fmtDT(r.scheduledReturnAt)}</td>
              </tr>
            ))}
            {!loading && !scheduled.length && (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-gray-500">None</td></tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
