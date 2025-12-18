'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import SearchBar from '../../components/SearchBar';
import { Th, Td } from '../../components/ThTd';
import { listByStatus } from '../../services/usageService';
import type { UsageRequest } from '../../services/types';

const fmtDT = (s?: string | null) => (s ? new Date(s).toLocaleString() : '-');

export default function ReceivePage() {
  const [rows, setRows] = useState<UsageRequest[]>([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const list = await listByStatus('DISPATCHED');
      setRows(list || []);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to load dispatched trips');
      setRows([]);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter(r =>
      [r.requestCode, r.assignedVehicleNumber, r.assignedDriverName, r.fromLocation, r.toLocation]
        .map(v => (v ?? '').toString().toLowerCase()).join(' ').includes(s)
    );
  }, [rows, q]);

  return (
    <div className="min-h-screen bg-orange-50 p-4">
      <div className="bg-white rounded-xl border border-orange-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-xl font-bold text-gray-800">Receive (On Trip)</h1>
            <p className="text-sm text-orange-700">Trips currently dispatched. Gate will mark Entry on return.</p>
          </div>
          <button className="px-3 py-2 rounded bg-orange-600 text-white" onClick={load}>
            {loading ? 'Loading…' : 'Refresh'}
          </button>
        </div>

        <SearchBar value={q} onChange={setQ} placeholder="Search code, vehicle, driver, route…" />

        <div className="mt-3 overflow-x-auto rounded-lg border border-orange-100">
          <table className="w-full text-sm">
            <thead className="bg-orange-50">
              <tr>
                <Th>Code</Th>
                <Th>Vehicle</Th>
                <Th>Driver</Th>
                <Th>Exit Time</Th>
                <Th>Exit Odometer</Th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map(r => (
                <tr key={r.id}>
                  <Td className="font-semibold">{r.requestCode}</Td>
                  <Td>{r.assignedVehicleNumber || '-'}</Td>
                  <Td>{r.assignedDriverName || '-'}</Td>
                  <Td>{fmtDT(r.gateExitAt)}</Td>
                  <Td>{r.exitOdometer ?? '-'}</Td>
                </tr>
              ))}
              {!filtered.length && (
                <tr><Td colSpan={5} className="text-center text-gray-500 py-6">
                  {loading ? 'Loading…' : 'No vehicles currently on trip'}
                </Td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
