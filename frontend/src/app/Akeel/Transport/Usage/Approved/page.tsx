'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import SearchBar from '../../components/SearchBar';
import { Th, Td } from '../../components/ThTd';
import AssignVehicleModal from '../../components/AssignVehicleModal';
import { listByStatus } from '../../services/usageService';
import type { UsageRequest } from '../../services/types';

export default function ApprovedRequestsPage() {
  const [rows, setRows] = useState<UsageRequest[]>([]);
  const [q, setQ] = useState('');
  const [assignFor, setAssignFor] = useState<UsageRequest | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const list = await listByStatus('APPROVED');
      setRows(list || []);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to load approved requests');
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
        r.requestCode, r.applicantName, r.employeeId, r.department,
        r.fromLocation, r.toLocation, r.assignedVehicleNumber, r.assignedDriverName
      ]
      .map(v => (v ?? '').toString().toLowerCase())
      .join(' ')
      .includes(s)
    );
  }, [rows, q]);

  return (
    <div className="min-h-screen bg-orange-50 p-4">
      <div className="bg-white rounded-xl border border-orange-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-xl font-bold text-gray-800">Approved Requests</h1>
            <p className="text-sm text-orange-700">Assign vehicle & driver, and set pickup/return.</p>
          </div>
          <button className="px-3 py-2 rounded bg-orange-600 text-white" onClick={load}>
            {loading ? 'Loading…' : 'Refresh'}
          </button>
        </div>

        <SearchBar value={q} onChange={setQ} placeholder="Search code, applicant, route, vehicle, driver…" />

        <div className="mt-3 overflow-x-auto rounded-lg border border-orange-100">
          <table className="w-full text-sm">
            <thead className="bg-orange-50">
              <tr>
                <Th>Code</Th>
                <Th>Applicant</Th>
                <Th>Dept</Th>
                <Th>Route</Th>
                <Th>Date/Time</Th>
                <Th className="text-center">Action</Th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map(r => (
                <tr key={r.id} className="hover:bg-orange-50">
                  <Td className="font-semibold">{r.requestCode}</Td>
                  <Td>
                    <div className="text-orange-900">{r.applicantName}</div>
                    <div className="text-xs text-orange-700/70">{r.employeeId}</div>
                  </Td>
                  <Td>{r.department}</Td>
                  <Td>{r.fromLocation} → {r.toLocation}</Td>
                  <Td>{r.dateOfTravel} {r.timeFrom}-{r.timeTo}</Td>
                  <Td className="text-center">
                    <button className="px-3 py-1 rounded bg-orange-600 text-white" onClick={() => setAssignFor(r)}>
                      Assign
                    </button>
                  </Td>
                </tr>
              ))}
              {!filtered.length && (
                <tr>
                  <Td colSpan={6} className="text-center text-gray-500 py-6">
                    {loading ? 'Loading…' : 'No approved requests'}
                  </Td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {assignFor && (
        <AssignVehicleModal
          open
          onClose={() => setAssignFor(null)}
          requestId={assignFor.id}
          defaultValues={{
            vehicleNumber: assignFor.assignedVehicleNumber ?? '',
            driverName: assignFor.assignedDriverName ?? '',
            driverPhone: assignFor.assignedDriverPhone ?? '',
          }}
          onAssigned={() => {
            toast.success('Assignment saved');
            setAssignFor(null);
            load();
          }}
        />
      )}
    </div>
  );
}
