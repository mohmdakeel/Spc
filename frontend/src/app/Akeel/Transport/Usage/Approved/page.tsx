'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import SearchBar from '../../components/SearchBar';
import { Th, Td } from '../../components/ThTd';
import { listAllRequests } from '../../services/usageService';
import type { UsageRequest } from '../../services/types';
import { printUsageSlip } from '../../utils/print';

const fmtDT = (s?: string | null) => (s ? new Date(s).toLocaleString() : '—');
const fmt = (v?: string | number | null) => (v == null || v === '' ? '—' : String(v));

const chip = (raw?: string | null) => {
  const s = (raw || '—').toUpperCase();
  let label = s.replaceAll('_', ' ');
  if (s === 'PENDING_MANAGEMENT' || s === 'PENDING MANAGMENT') label = 'PENDING MGMT';
  if (s === 'SENT_TO_MANAGEMENT') label = 'SENT TO MGMT';
  return (
    <span className="inline-flex items-center px-2 py-[3px] rounded text-[11px] bg-orange-100 text-orange-800">
      {label}
    </span>
  );
};

export default function AllRequestsPage() {
  const [rows, setRows] = useState<UsageRequest[]>([]);
  const [q, setQ] = useState('');
  const [view, setView] = useState<UsageRequest | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const list = await listAllRequests();
      setRows(list || []);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to load requests');
      setRows([]);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter((r) =>
      [
        r.requestCode,
        r.applicantName,
        r.employeeId,
        r.department,
        r.fromLocation,
        r.toLocation,
        r.assignedVehicleNumber,
        r.assignedDriverName,
        r.status,
      ]
        .map((v) => (v ?? '').toString().toLowerCase())
        .join(' ')
        .includes(s)
    );
  }, [rows, q]);

  return (
    <div className="min-h-screen bg-orange-50 p-4">
      <div className="bg-white rounded-xl border border-orange-200 p-4 space-y-3 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-xl font-bold text-gray-800">All Requests</h1>
            <p className="text-sm text-orange-700">Track every applicant request with full details.</p>
          </div>
          <button className="px-3 py-2 rounded bg-orange-600 text-white text-sm font-semibold" onClick={load}>
            {loading ? 'Loading…' : 'Refresh'}
          </button>
        </div>

        <SearchBar value={q} onChange={setQ} placeholder="Search code, applicant, route, vehicle, driver, status…" />

        <div className="mt-3 overflow-x-auto rounded-lg border border-orange-100">
          <table className="w-full text-sm">
            <thead className="bg-orange-50">
              <tr>
                <Th>Request</Th>
                <Th>Applicant</Th>
                <Th>Route / Travel</Th>
                <Th>Status</Th>
                <Th>Assignment</Th>
                <Th>Schedule</Th>
                <Th>Gate</Th>
                <Th className="text-center">Actions</Th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((r) => (
                <tr key={r.id} className="hover:bg-orange-50">
                  <Td>
                    <div className="font-semibold text-orange-900">{fmt(r.requestCode)}</div>
                    <div className="text-[11px] text-gray-600">Applied: {fmtDT(r.createdAt)}</div>
                  </Td>
                  <Td>
                    <div className="font-semibold text-gray-900">{fmt(r.applicantName)}</div>
                    <div className="text-xs text-gray-600">Emp ID: {fmt(r.employeeId)}</div>
                    <div className="text-[11px] text-gray-500">{fmt(r.department)}</div>
                  </Td>
                  <Td>
                    <div className="font-medium">{fmt(r.fromLocation)} → {fmt(r.toLocation)}</div>
                    <div className="text-xs text-gray-600">
                      {fmt(r.dateOfTravel)} • {fmt(r.timeFrom)} - {fmt(r.timeTo)}
                    </div>
                  </Td>
                  <Td>{chip(r.status)}</Td>
                  <Td>
                    <div className="font-semibold text-gray-900">{fmt(r.assignedVehicleNumber)}</div>
                    <div className="text-xs text-gray-600">{fmt(r.assignedDriverName)}</div>
                    {r.assignedDriverPhone && <div className="text-[11px] text-gray-500">{r.assignedDriverPhone}</div>}
                  </Td>
                    <Td>
                      <div>Pickup: {fmtDT(r.scheduledPickupAt)}</div>
                      <div className="text-xs text-gray-600">Return: {fmtDT(r.scheduledReturnAt)}</div>
                    </Td>
                    <Td>
                      <div>Exit: {fmtDT(r.gateExitAt)} <span className="text-[11px] text-gray-600">• O {fmt(r.exitOdometer)}</span></div>
                      <div>Entry: {fmtDT(r.gateEntryAt)} <span className="text-[11px] text-gray-600">• O {fmt(r.entryOdometer)}</span></div>
                    </Td>
                  <Td className="text-center">
                    <div className="flex flex-col gap-1 items-center">
                      <button
                        className="px-3 py-1 rounded bg-orange-600 text-white text-sm font-semibold"
                        onClick={() => setView(r)}
                      >
                        View
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
                  <Td colSpan={8} className="text-center text-gray-500 py-6">
                    {loading ? 'Loading…' : 'No requests match your filters.'}
                  </Td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {view && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-orange-900">Request {fmt(view.requestCode)}</h2>
              <button
                className="px-3 py-1 rounded bg-orange-100 text-orange-800 text-sm"
                onClick={() => setView(null)}
              >
                Close
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <Detail label="Applicant" value={`${fmt(view.applicantName)} (${fmt(view.employeeId)})`} />
              <Detail label="Department" value={fmt(view.department)} />
              <Detail label="Travel Date" value={fmt(view.dateOfTravel)} />
              <Detail label="Time" value={`${fmt(view.timeFrom)} - ${fmt(view.timeTo)}`} />
              <Detail label="Route" value={`${fmt(view.fromLocation)} → ${fmt(view.toLocation)}`} />
              <Detail label="Purpose" value={fmt(view.officialDescription)} />
              <Detail label="Goods" value={fmt(view.goods)} />
              <Detail label="Status" value={fmt(view.status)} />
              <Detail label="Assigned Vehicle" value={fmt(view.assignedVehicleNumber)} />
              <Detail label="Assigned Driver" value={`${fmt(view.assignedDriverName)} ${view.assignedDriverPhone ? `(${view.assignedDriverPhone})` : ''}`} />
              <Detail label="Scheduled Pickup" value={fmtDT(view.scheduledPickupAt)} />
              <Detail label="Scheduled Return" value={fmtDT(view.scheduledReturnAt)} />
              <Detail label="Gate Exit" value={`${fmtDT(view.gateExitAt)} • O ${fmt(view.exitOdometer)}`} />
              <Detail label="Gate Entry" value={`${fmtDT(view.gateEntryAt)} • O ${fmt(view.entryOdometer)}`} />
              <Detail label="Created At" value={fmtDT(view.createdAt)} />
              <Detail label="Updated At" value={fmtDT(view.updatedAt)} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-orange-50 border border-orange-100 rounded-lg p-3">
      <div className="text-[11px] uppercase tracking-wide text-orange-700">{label}</div>
      <div className="text-sm text-gray-900">{value}</div>
    </div>
  );
}
