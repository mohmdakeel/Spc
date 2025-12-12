'use client';

import React, { useEffect, useMemo, useState } from 'react';
import GateSearchBar from '../components/GateSearchBar';
import { Th, Td } from '../../Transport/components/ThTd';
import { PlusCircle, LogOut } from 'lucide-react';
import { toast } from 'react-toastify';
import {
  CompanyVehicle,
  createCompanyVehicle,
  exitCompanyVehicle,
  listCompanyVehicles,
} from '../../Transport/services/gateLogsService';

const fmtDT = (s?: string | null) => (s ? new Date(s).toLocaleString() : '—');

export default function GateCompanyPage() {
  const [rows, setRows] = useState<CompanyVehicle[]>([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ vehicleNumber: '', driverName: '', department: '', purpose: '' });
  const [showAdd, setShowAdd] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await listCompanyVehicles();
      setRows(data);
    } catch (e: any) {
      toast.error(e?.message || 'Failed to load company vehicles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const add = async () => {
    const vehicle = form.vehicleNumber.trim();
    if (!vehicle) return;
    try {
      await createCompanyVehicle({
        vehicleNumber: vehicle,
        driverName: form.driverName.trim() || undefined,
        department: form.department.trim() || undefined,
        purpose: form.purpose.trim() || undefined,
      });
      setForm({ vehicleNumber: '', driverName: '', department: '', purpose: '' });
      setShowAdd(false);
      toast.success('Company vehicle saved');
      load();
    } catch (e: any) {
      toast.error(e?.message || 'Failed to add company vehicle');
    }
  };

  const markExit = async (id: number) => {
    try {
      await exitCompanyVehicle(id);
      toast.success('Exit recorded');
      load();
    } catch (e: any) {
      toast.error(e?.message || 'Failed to mark exit');
    }
  };

  /* ---------- search + ordering (active first, newest first) ---------- */
  const ordered = useMemo(() => {
    const copy = rows.slice();
    copy.sort((a, b) => {
      const aActive = !a.timeOut, bActive = !b.timeOut;
      if (aActive !== bActive) return aActive ? -1 : 1; // active first
      return new Date(b.timeIn).getTime() - new Date(a.timeIn).getTime(); // newest first
    });
    return copy;
  }, [rows]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return ordered;
    return ordered.filter((r) =>
      [r.vehicleNumber, r.driverName, r.department, r.purpose]
        .map((x) => (x ?? '').toString().toLowerCase())
        .join(' ')
        .includes(s)
    );
  }, [ordered, q]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-[14px] md:text-lg font-bold text-orange-900">Company Vehicles (Ad-hoc)</h1>
        <div className="flex items-center gap-2">
          <GateSearchBar value={q} onChange={setQ} placeholder="Search vehicle, driver, department, purpose…" />
          <button
            className="inline-flex items-center gap-1 h-8 px-3 rounded bg-orange-600 text-white text-[12px] hover:bg-orange-700"
            onClick={() => setShowAdd(true)}
          >
            <PlusCircle size={14} /> Add Vehicle
          </button>
        </div>
      </div>
      <p className="text-[11px] text-orange-700">
        Use for internal vehicles not tied to a usage request.
      </p>

      {/* ------- Table ------- */}
      <div className="bg-white rounded-xl border border-orange-200 overflow-auto">
        {/* Keep colgroup on one line to avoid hydration whitespace warnings */}
        <table className="min-w-[860px] w-full table-fixed text-[10px] leading-[1.15]">
          <colgroup><col className="w-28"/><col className="w-32"/><col className="w-32"/><col className="w-[16rem]"/><col className="w-32"/><col className="w-32"/><col className="w-28"/></colgroup>
          <thead className="bg-orange-50">
            <tr className="text-[9.5px]">
              <Th className="px-2 py-1 text-left">Vehicle</Th>
              <Th className="px-2 py-1 text-left">Driver</Th>
              <Th className="px-2 py-1 text-left">Department</Th>
              <Th className="px-2 py-1 text-left">Purpose</Th>
              <Th className="px-2 py-1 text-left">Time In</Th>
              <Th className="px-2 py-1 text-left">Time Out</Th>
              <Th className="px-2 py-1 text-center">Action</Th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading && (
              <tr>
                <Td colSpan={7} className="px-2 py-6 text-center text-gray-500">Loading…</Td>
              </tr>
            )}

            {!loading && filtered.map((r) => (
              <tr key={r.id} className="hover:bg-orange-50/40">
                <Td className="px-2 py-1 font-semibold text-orange-900">{r.vehicleNumber}</Td>
                <Td className="px-2 py-1">{r.driverName || '-'}</Td>
                <Td className="px-2 py-1">{r.department || '-'}</Td>
                <Td className="px-2 py-1 truncate" title={r.purpose || '-'}>
                  {r.purpose || '-'}
                </Td>
                <Td className="px-2 py-1">{fmtDT(r.timeIn)}</Td>
                <Td className="px-2 py-1">{fmtDT(r.timeOut)}</Td>
                <Td className="px-2 py-1 text-center">
                  {!r.timeOut && (
                    <button
                      className="px-2.5 py-[6px] rounded bg-green-600 text-white hover:bg-green-700 inline-flex items-center gap-1 text-[10px]"
                      onClick={() => markExit(r.id)}
                      title="Mark vehicle exit"
                    >
                      <LogOut size={14} /> Mark Exit
                    </button>
                  )}
                </Td>
              </tr>
            ))}

            {!loading && !filtered.length && (
              <tr>
                <Td colSpan={7} className="px-2 py-6 text-center text-gray-500">
                  No records
                </Td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <AddCompanyModal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        form={form}
        setForm={setForm}
        onSubmit={add}
        loading={loading}
      />
    </div>
  );
}

function AddCompanyModal({
  open,
  onClose,
  form,
  setForm,
  onSubmit,
  loading,
}: {
  open: boolean;
  onClose: () => void;
  form: { vehicleNumber: string; driverName: string; department: string; purpose: string };
  setForm: React.Dispatch<React.SetStateAction<{ vehicleNumber: string; driverName: string; department: string; purpose: string }>>;
  onSubmit: () => void;
  loading: boolean;
}) {
  if (!open) return null;
  const disabled = !form.vehicleNumber.trim() || loading;

  return (
    <div className="fixed inset-0 bg-black/40 grid place-items-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-3 border-b bg-orange-50">
          <h3 className="font-bold text-orange-900">Add Company Vehicle</h3>
          <button className="p-2 rounded hover:bg-orange-100" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <div className="p-5 grid grid-cols-1 gap-3">
          <div className="space-y-1">
            <label className="text-[12px] font-semibold text-orange-800">Vehicle Number *</label>
            <input
              className="border border-orange-200 rounded px-3 py-2 text-[13px] uppercase"
              placeholder="Vehicle Number"
              value={form.vehicleNumber}
              onChange={(e) => setForm((f) => ({ ...f, vehicleNumber: e.target.value }))}
              autoFocus
            />
          </div>
          <div className="space-y-1">
            <label className="text-[12px] font-semibold text-orange-800">Driver</label>
            <input
              className="border border-orange-200 rounded px-3 py-2 text-[13px]"
              placeholder="Driver name"
              value={form.driverName}
              onChange={(e) => setForm((f) => ({ ...f, driverName: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[12px] font-semibold text-orange-800">Department</label>
              <input
                className="border border-orange-200 rounded px-3 py-2 text-[13px]"
                placeholder="Department"
                value={form.department}
                onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[12px] font-semibold text-orange-800">Purpose</label>
              <input
                className="border border-orange-200 rounded px-3 py-2 text-[13px]"
                placeholder="Purpose"
                value={form.purpose}
                onChange={(e) => setForm((f) => ({ ...f, purpose: e.target.value }))}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 px-5 py-3 border-t bg-orange-50">
          <button className="px-4 py-2 rounded border" onClick={onClose}>Cancel</button>
          <button
            className="px-4 py-2 rounded bg-orange-600 text-white disabled:opacity-60"
            disabled={disabled}
            onClick={onSubmit}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
