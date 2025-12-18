'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import SearchBar from '../../components/SearchBar';
import { Th, Td } from '../../components/ThTd';
import AssignVehicleModal from '../../components/AssignVehicleModal';
import { listByStatus } from '../../services/usageService';
import type { UsageRequest } from '../../services/types';
import { printUsageSlip } from '../../utils/print';

const fmt = (v?: string | null) => (v == null || v === '' ? '—' : v);

export default function SchedulingPage() {
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
      <div className="bg-white rounded-xl border border-orange-200 p-4 space-y-3 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-800">Assign Vehicle</h1>
            <p className="text-sm text-orange-700">Approved requests ready for vehicle/driver assignment.</p>
          </div>
          <button className="px-3 py-2 rounded bg-orange-600 text-white text-sm font-semibold" onClick={load}>
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
                <Th>Route / Travel</Th>
                <Th>Status</Th>
                <Th>Current Assignment</Th>
                <Th className="text-center">Actions</Th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map(r => (
                <tr key={r.id} className="hover:bg-orange-50">
                  <Td className="font-semibold text-orange-900">{fmt(r.requestCode)}</Td>
                  <Td>
                    <div className="font-semibold text-gray-900">{fmt(r.applicantName)}</div>
                    <div className="text-xs text-gray-600">Emp ID: {fmt(r.employeeId)}</div>
                  </Td>
                  <Td>{fmt(r.department)}</Td>
                  <Td>
                    <div className="font-medium">{fmt(r.fromLocation)} → {fmt(r.toLocation)}</div>
                    <div className="text-xs text-gray-600">{fmt(r.dateOfTravel)} • {fmt(r.timeFrom)} - {fmt(r.timeTo)}</div>
                  </Td>
                  <Td>{fmt(r.status)}</Td>
                  <Td>
                    <div className="font-semibold text-gray-900">{fmt(r.assignedVehicleNumber)}</div>
                    <div className="text-xs text-gray-600">{fmt(r.assignedDriverName)}</div>
                    {r.assignedDriverPhone && <div className="text-[11px] text-gray-500">{r.assignedDriverPhone}</div>}
                  </Td>
                  <Td className="text-center">
                    <div className="flex flex-col gap-1 items-center">
                      <button
                        className="px-3 py-1 rounded bg-orange-600 text-white text-sm font-semibold"
                        onClick={() => setAssignFor(r)}
                      >
                        Assign / Edit
                      </button>
                      <button
                        className="px-3 py-1 rounded bg-green-600 text-white text-sm font-semibold"
                        onClick={() => printUsageSlip(r as any)}
                      >
                        Print Slip
                      </button>
                    </div>
                  </Td>
                </tr>
              ))}
              {!filtered.length && (
                <tr>
                  <Td colSpan={7} className="text-center text-gray-500 py-6">
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
