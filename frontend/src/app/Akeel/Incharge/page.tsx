'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { metrics } from '../Transport/services/usageService';
import type { MetricsDto } from '../Transport/services/usageService';
import { Calendar, Car, User } from 'lucide-react';
import SearchBar from './components/SearchBar';

export default function InchargeDashboard() {
  const [m, setM] = useState<MetricsDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        setM(await metrics());
      } catch (e: any) {
        setError(e?.message || 'Failed to load metrics');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const kpis = useMemo(() => [
    { label: 'Total Requests', val: m?.total ?? 0, icon: <Calendar size={18} className="text-orange-600" /> },
    { label: 'Approved (awaiting assign)', val: m?.byStatus?.APPROVED ?? 0, icon: <User size={18} className="text-green-600" /> },
    { label: 'Scheduled', val: m?.byStatus?.SCHEDULED ?? 0, icon: <Car size={18} className="text-blue-600" /> },
    { label: 'Dispatched', val: m?.byStatus?.DISPATCHED ?? 0, icon: <Car size={18} className="text-emerald-600" /> },
  ], [m]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-orange-900">Vehicle In-Charge Dashboard</h1>
          {error ? <p className="text-sm text-red-600">{error}</p> : <p className="text-sm text-gray-600">Overview and quick search</p>}
        </div>
        <SearchBar
          value={q}
          onChange={setQ}
          placeholder="Search requests by code / vehicle / driver"
          className="w-full sm:w-72"
        />
      </div>

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
          <div>
            <h2 className="text-md font-semibold text-orange-900">Tomorrow&apos;s Top Pickups</h2>
            <p className="text-xs text-gray-500">Next day assignments</p>
          </div>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-orange-50">
            <tr>
              <th className="px-4 py-2 text-left">Code</th>
              <th className="px-4 py-2 text-left">Vehicle</th>
              <th className="px-4 py-2 text-left">Driver</th>
              <th className="px-4 py-2 text-left">Pickup At</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {(m?.nextDayTop10 ?? []).map(r => (
              <tr key={r.id}>
                <td className="px-4 py-2">{r.requestCode}</td>
                <td className="px-4 py-2">{r.assignedVehicleNumber ?? '-'}</td>
                <td className="px-4 py-2">{r.assignedDriverName ?? '-'}</td>
                <td className="px-4 py-2">
                  {r.scheduledPickupAt ? new Date(r.scheduledPickupAt).toLocaleString() : '-'}
                </td>
              </tr>
            ))}
            {!loading && !(m?.nextDayTop10?.length) && (
              <tr><td className="px-4 py-6 text-center text-gray-500" colSpan={4}>No upcoming pickups</td></tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
