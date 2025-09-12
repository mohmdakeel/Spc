'use client';

import React, { useEffect, useMemo, useState } from 'react';
import GateSidebar from '../components/GateSidebar';
import SearchBar from '../../Transport/components/SearchBar';
import { Th, Td } from '../../Transport/components/ThTd';
import { PlusCircle, LogOut } from 'lucide-react';

type VisitorVehicle = {
  id: string;
  plate: string;
  driverName?: string;
  company?: string;
  purpose?: string;
  timeIn: string;          // ISO
  timeOut?: string | null; // ISO | null
};

const KEY = 'gate_visitor_vehicles';
const fmtDT = (s?: string | null) => (s ? new Date(s).toLocaleString() : '—');

export default function GateVisitorsPage() {
  const [rows, setRows] = useState<VisitorVehicle[]>([]);
  const [q, setQ] = useState('');
  const [form, setForm] = useState({ plate: '', driverName: '', company: '', purpose: '' });

  /* ---------- load & persist local-only list ---------- */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      setRows(raw ? JSON.parse(raw) : []);
    } catch {
      setRows([]);
    }
  }, []);

  const persist = (list: VisitorVehicle[]) => {
    setRows(list);
    try { localStorage.setItem(KEY, JSON.stringify(list)); } catch {}
  };

  /* ---------- actions ---------- */
  const add = () => {
    const plate = form.plate.trim().toUpperCase();
    if (!plate) return;

    const item: VisitorVehicle = {
      id: (crypto as any)?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      plate,
      driverName: form.driverName.trim() || undefined,
      company: form.company.trim() || undefined,
      purpose: form.purpose.trim() || undefined,
      timeIn: new Date().toISOString(),
      timeOut: null,
    };
    persist([item, ...rows]);
    setForm({ plate: '', driverName: '', company: '', purpose: '' });
  };

  const markExit = (id: string) =>
    persist(rows.map((r) => (r.id === id ? { ...r, timeOut: new Date().toISOString() } : r)));

  /* ---------- search + ordering (active first, newest first) ---------- */
  const ordered = useMemo(() => {
    const copy = rows.slice();
    copy.sort((a, b) => {
      // active (no timeOut) first
      const aActive = !a.timeOut, bActive = !b.timeOut;
      if (aActive !== bActive) return aActive ? -1 : 1;
      // within groups, newest timeIn first
      return new Date(b.timeIn).getTime() - new Date(a.timeIn).getTime();
    });
    return copy;
  }, [rows]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return ordered;
    return ordered.filter((r) =>
      [r.plate, r.driverName, r.company, r.purpose]
        .map((x) => (x ?? '').toString().toLowerCase())
        .join(' ')
        .includes(s)
    );
  }, [ordered, q]);

  /* ---------- UI ---------- */
  return (
    <div className="flex min-h-screen bg-orange-50">
      <GateSidebar />

      <main className="p-3 md:p-4 flex-1">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-[14px] md:text-lg font-bold text-orange-900">Visitor Vehicles</h1>
          <SearchBar value={q} onChange={setQ} placeholder="Search plate, driver, company, purpose…" className="h-8" />
        </div>
        <p className="text-[11px] text-orange-700 mb-3">
          Quick entry/exit log (stored in this browser only). Replace with API when available.
        </p>

        {/* ------- Add form ------- */}
        <div className="bg-white border border-orange-200 rounded-xl p-3 md:p-4 mb-3 grid grid-cols-1 md:grid-cols-5 gap-2 md:gap-3">
          <input
            className="border border-orange-200 rounded px-2.5 py-2 text-[12px] uppercase"
            placeholder="Plate *"
            value={form.plate}
            onChange={(e) => setForm((f) => ({ ...f, plate: e.target.value }))}
            onKeyDown={(e) => e.key === 'Enter' && add()}
          />
          <input
            className="border border-orange-200 rounded px-2.5 py-2 text-[12px]"
            placeholder="Driver"
            value={form.driverName}
            onChange={(e) => setForm((f) => ({ ...f, driverName: e.target.value }))}
            onKeyDown={(e) => e.key === 'Enter' && add()}
          />
          <input
            className="border border-orange-200 rounded px-2.5 py-2 text-[12px]"
            placeholder="Company"
            value={form.company}
            onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))}
            onKeyDown={(e) => e.key === 'Enter' && add()}
          />
          <input
            className="border border-orange-200 rounded px-2.5 py-2 text-[12px]"
            placeholder="Purpose"
            value={form.purpose}
            onChange={(e) => setForm((f) => ({ ...f, purpose: e.target.value }))}
            onKeyDown={(e) => e.key === 'Enter' && add()}
          />
          <button
            className="rounded bg-orange-600 text-white px-3 py-2 text-[12px] flex items-center justify-center gap-2 disabled:opacity-50"
            onClick={add}
            disabled={!form.plate.trim()}
            title="Add vehicle entry"
          >
            <PlusCircle size={16} /> Add
          </button>
        </div>

        {/* ------- Table ------- */}
        <div className="bg-white rounded-xl border border-orange-200 overflow-auto">
          {/* Keep colgroup on one line to avoid hydration whitespace warnings */}
          <table className="w-full table-fixed text-[10px] leading-[1.15]">
            <colgroup><col className="w-32"/><col className="w-44"/><col className="w-44"/><col className="w-[22rem]"/><col className="w-44"/><col className="w-44"/><col className="w-36"/></colgroup>
            <thead className="bg-orange-50">
              <tr className="text-[9.5px]">
                <Th className="px-2 py-1 text-left">Plate</Th>
                <Th className="px-2 py-1 text-left">Driver</Th>
                <Th className="px-2 py-1 text-left">Company</Th>
                <Th className="px-2 py-1 text-left">Purpose</Th>
                <Th className="px-2 py-1 text-left">Time In</Th>
                <Th className="px-2 py-1 text-left">Time Out</Th>
                <Th className="px-2 py-1 text-center">Action</Th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((r) => (
                <tr key={r.id} className="hover:bg-orange-50/40">
                  <Td className="px-2 py-1 font-semibold text-orange-900">{r.plate}</Td>
                  <Td className="px-2 py-1">{r.driverName || '-'}</Td>
                  <Td className="px-2 py-1">{r.company || '-'}</Td>
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

              {!filtered.length && (
                <tr>
                  <Td colSpan={7} className="px-2 py-6 text-center text-gray-500">
                    No records
                  </Td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
