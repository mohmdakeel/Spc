'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { listAllRequests } from '../../services/usageService';
import type { UsageRequest, RequestStatus } from '../../services/types';
import { Th, Td } from '../../components/ThTd';
import SearchBar from '../../components/SearchBar';
import { toast } from 'react-toastify';

const SECTIONS: { label: string; status: RequestStatus }[] = [
  { label: 'Pending HOD', status: 'PENDING_HOD' },
  { label: 'Pending Management', status: 'PENDING_MANAGEMENT' },
  { label: 'Approved', status: 'APPROVED' },
  { label: 'Scheduled', status: 'SCHEDULED' },
  { label: 'Dispatched', status: 'DISPATCHED' },
  { label: 'Returned', status: 'RETURNED' },
];

export default function DepartmentRequestsPage() {
  const [rows, setRows] = useState<UsageRequest[]>([]);
  const [q, setQ] = useState('');

  const load = async () => {
    try {
      const all = await listAllRequests();
      setRows(Array.isArray(all) ? all : []);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to load requests');
      setRows([]);
    }
  };
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter(r =>
      [r.requestCode, r.applicantName, r.employeeId, r.department, r.fromLocation, r.toLocation, r.status]
        .map(v => (v ?? '').toString().toLowerCase()).join(' ').includes(s)
    );
  }, [rows, q]);

  return (
    <div className="min-h-screen bg-orange-50 p-4">
      <div className="bg-white rounded-xl border border-orange-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-xl font-bold text-gray-800">Department Requests (Overview)</h1>
            <p className="text-sm text-orange-700">Read-only overview by status.</p>
          </div>
          <button className="px-3 py-2 rounded bg-orange-600 text-white" onClick={load}>Refresh</button>
        </div>

        <SearchBar value={q} onChange={setQ} placeholder="Search any field…" />

        <div className="space-y-6 mt-4">
          {SECTIONS.map(sec => {
            const list = filtered.filter(r => r.status === sec.status);
            return (
              <div key={sec.status}>
                <h2 className="text-lg font-semibold text-orange-900 mb-2">{sec.label} <span className="text-sm text-orange-700">({list.length})</span></h2>
                <div className="overflow-x-auto rounded-lg border border-orange-100">
                  <table className="w-full text-sm">
                    <thead className="bg-orange-50">
                      <tr>
                        <Th>Code</Th>
                        <Th>Applicant</Th>
                        <Th>Dept</Th>
                        <Th>Route</Th>
                        <Th>Date/Time</Th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {list.map(r => (
                        <tr key={r.id}>
                          <Td className="font-semibold">{r.requestCode}</Td>
                          <Td>
                            <div className="text-orange-900">{r.applicantName}</div>
                            <div className="text-xs text-orange-700/70">{r.employeeId}</div>
                          </Td>
                          <Td>{r.department}</Td>
                          <Td>{r.fromLocation} → {r.toLocation}</Td>
                          <Td>{r.dateOfTravel} {r.timeFrom}-{r.timeTo}</Td>
                        </tr>
                      ))}
                      {!list.length && (
                        <tr><Td colSpan={5} className="text-center text-gray-500 py-6">No items</Td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
