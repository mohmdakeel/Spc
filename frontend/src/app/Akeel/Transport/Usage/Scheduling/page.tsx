'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import SearchBar from '../../components/SearchBar';
import { Th, Td } from '../../components/ThTd';
import AssignVehicleModal from '../../components/AssignVehicleModal';
import { listByStatus } from '../../services/usageService';
import type { UsageRequest } from '../../services/types';
import { printUsageSlip } from '../../utils/print';

const fmtDT = (s?: string | null) => (s ? new Date(s).toLocaleString() : '-');

export default function SchedulingPage() {
  const [rows, setRows] = useState<UsageRequest[]>([]);
  const [q, setQ] = useState('');
  const [editFor, setEditFor] = useState<UsageRequest | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const list = await listByStatus('SCHEDULED');
      setRows(list || []);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to load scheduled trips');
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
      [
        r.requestCode, r.assignedVehicleNumber, r.assignedDriverName,
        r.fromLocation, r.toLocation, r.applicantName
      ].map(v => (v ?? '').toString().toLowerCase()).join(' ').includes(s)
    );
  }, [rows, q]);

  return (
    <div className="min-h-screen bg-orange-50 p-4">
      <div className="bg-white rounded-xl border border-orange-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-xl font-bold text-gray-800">Vehicle Scheduling</h1>
            <p className="text-sm text-orange-700">Review/edit assignments before Gate dispatch.</p>
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
                <Th>Pickup</Th>
                <Th>Return</Th>
                <Th className="text-center">Actions</Th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map(r => (
                <tr key={r.id}>
                  <Td className="font-semibold">{r.requestCode}</Td>
                  <Td>{r.assignedVehicleNumber || '-'}</Td>
                  <Td>
                    <div className="text-orange-900">{r.assignedDriverName || '-'}</div>
                    <div className="text-xs text-orange-700/70">{r.assignedDriverPhone || ''}</div>
                  </Td>
                  <Td>{fmtDT(r.scheduledPickupAt)}</Td>
                  <Td>{fmtDT(r.scheduledReturnAt)}</Td>
                  <Td className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button className="px-3 py-1 rounded bg-green-600 text-white" onClick={() => printUsageSlip(r)}>
                        Print Slip
                      </button>
                      <button className="px-3 py-1 rounded bg-orange-600 text-white" onClick={() => setEditFor(r)}>
                        Reassign
                      </button>
                    </div>
                  </Td>
                </tr>
              ))}
              {!filtered.length && (
                <tr>
                  <Td colSpan={6} className="text-center text-gray-500 py-6">
                    {loading ? 'Loading…' : 'No scheduled trips'}
                  </Td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editFor && (
        <AssignVehicleModal
          open
          onClose={() => setEditFor(null)}
          requestId={editFor.id}
          defaultValues={{
            vehicleNumber: editFor.assignedVehicleNumber || undefined,
            driverName: editFor.assignedDriverName || undefined,
            driverPhone: editFor.assignedDriverPhone || undefined,
          }}
          onAssigned={() => {
            toast.success('Assignment updated');
            setEditFor(null);
            load();
          }}
        />
      )}
    </div>
  );
}
