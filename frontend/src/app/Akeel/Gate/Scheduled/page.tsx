'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Th, Td } from '../../Transport/components/ThTd';
import { listByStatus, gateExit, gateEntry } from '../../Transport/services/usageService';
import type { UsageRequest } from '../../Transport/services/types';
import GateSearchBar from '../components/GateSearchBar';
import GateExitEntryModal from '../../Transport/components/GateExitEntryModal';
import { toast } from 'react-toastify';
import { login } from '../../../../../lib/auth';

/* ------------ helpers ------------ */
const fmtTime = (s?: string | null) =>
  s ? new Date(s).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—';

const chip = (label: 'Scheduled' | 'Departed' | 'Return') => {
  const styles =
    label === 'Scheduled'
      ? 'bg-yellow-200 text-yellow-900 ring-1 ring-yellow-400/70'
      : label === 'Departed'
      ? 'bg-blue-600 text-white ring-1 ring-blue-700/60'
      : 'bg-green-500 text-white ring-1 ring-green-600/60';
  return <span className={`inline-block text-[10px] px-2.5 py-1 rounded-full ${styles}`}>{label}</span>;
};

// light phone cleanup for display
const cleanPhone = (p?: string | null) =>
  (p ?? '')
    .replace(/[^\d+()\-\s./;]/g, '')
    .replace(/^[;,\s-]+/, '')
    .replace(/\s{2,}/g, ' ')
    .trim();

// try to resolve officerId from explicit field or text like "Travelling Officer: X (ID: 123)"
function resolveOfficerId(r: any): string | undefined {
  if (r?.officerId) return String(r.officerId);
  const text = `${r?.officialDescription || ''}\n${r?.remarks || ''}`;
  const m = /\(\s*(?:Employee\s*ID|Emp\.?\s*ID|ID)\s*:\s*([^)]+)\)/i.exec(text);
  return m?.[1]?.trim();
}

export default function GateScheduledPage() {
  const [rows, setRows] = useState<UsageRequest[]>([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [openExitFor, setOpenExitFor] = useState<UsageRequest | null>(null);
  const [openEntryFor, setOpenEntryFor] = useState<UsageRequest | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [scheduled, dispatched] = await Promise.all([
        listByStatus('SCHEDULED'),
        listByStatus('DISPATCHED'),
      ]);
      const merged = [...(scheduled || []), ...(dispatched || [])];

      // unique by id / requestCode
      const seen = new Set<string>();
      const uniq = merged.filter((r: any) => {
        const k = String(r?.id ?? r?.requestCode ?? '');
        if (!k || seen.has(k)) return false;
        seen.add(k);
        return true;
      });

      // smart sort (upcoming, then departed, then returned)
      uniq.sort((a, b) => {
        const aState = a.gateEntryAt ? 2 : a.gateExitAt ? 1 : 0;
        const bState = b.gateEntryAt ? 2 : b.gateExitAt ? 1 : 0;
        if (aState !== bState) return aState - bState;
        const tA =
          aState === 0
            ? a.scheduledPickupAt ? new Date(a.scheduledPickupAt).getTime() : 0
            : aState === 1
            ? a.gateExitAt ? new Date(a.gateExitAt).getTime() : 0
            : a.gateEntryAt ? new Date(a.gateEntryAt).getTime() : 0;
        const tB =
          bState === 0
            ? b.scheduledPickupAt ? new Date(b.scheduledPickupAt).getTime() : 0
            : bState === 1
            ? b.gateExitAt ? new Date(b.gateExitAt).getTime() : 0
            : b.gateEntryAt ? new Date(b.gateEntryAt).getTime() : 0;
        return tA - tB;
      });

      setRows(uniq);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter((r: any) =>
      [
        r.requestCode,
        r.assignedVehicleNumber,
        r.assignedDriverName,
        r.assignedDriverPhone,
        r.assignedDriverId,
        r.fromLocation,
        r.toLocation,
        r.department,
        resolveOfficerId(r) || '',
      ]
        .map((x) => (x ?? '').toString().toLowerCase())
        .join(' ')
        .includes(s)
    );
  }, [rows, q]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-[14px] md:text-lg font-bold text-orange-900">Scheduled &amp; Dispatched</h1>
        <GateSearchBar value={q} onChange={setQ} placeholder="Search code, vehicle, driver, route…" />
      </div>

      <div className="bg-white rounded-lg border border-orange-200 overflow-auto">
        <table className="min-w-[980px] w-full table-fixed text-[10px] leading-tight">
          {/* keep colgroup on one line to avoid whitespace text nodes */}
          <colgroup><col className="w-[12%]"/><col className="w-[22%]"/><col className="w-[19%]"/><col className="w-[13%]"/><col className="w-[12%]"/><col className="w-[11%]"/><col className="w-[11%]"/></colgroup>
          <thead className="bg-orange-50 text-[9px] uppercase tracking-wide">
            <tr>
              <Th className="px-3 py-2 text-left">Request</Th>
              <Th className="px-3 py-2 text-left">Schedule</Th>
              <Th className="px-3 py-2 text-left">Vehicle / Driver</Th>
              <Th className="px-3 py-2 text-left">Route</Th>
              <Th className="px-3 py-2 text-left">Odometer (km)</Th>
              <Th className="px-3 py-2 text-center">Status</Th>
              <Th className="px-3 py-2 text-center">Action</Th>
            </tr>
          </thead>

          <tbody className="divide-y">
            {loading && (
              <tr>
                <Td colSpan={7} className="px-3 py-6 text-center text-gray-500">Loading…</Td>
              </tr>
            )}

            {!loading && filtered.map((r) => {
              const isDeparted = !!r.gateExitAt && !r.gateEntryAt;
              const isReturned = !!r.gateEntryAt;
              const statusLabel: 'Scheduled' | 'Departed' | 'Return' =
                isReturned ? 'Return' : isDeparted ? 'Departed' : 'Scheduled';
              const driverPhone = cleanPhone(r.assignedDriverPhone);
              const officerId = resolveOfficerId(r);

              return (
                <tr key={r.id} className="align-top">
                  {/* Request */}
                  <Td className="px-3 py-2">
                    <div className="font-semibold text-orange-900 text-[11px]">{r.requestCode || '—'}</div>
                    <div className="text-[9px] text-gray-600">{r.department || '—'}</div>
                  </Td>

                  {/* Schedule (4 lines) */}
                  <Td className="px-3 py-2">
                    <div className="font-medium">Pickup: {r.timeFrom || fmtTime(r.scheduledPickupAt)}</div>
                    <div>Return: {r.timeTo || fmtTime(r.scheduledReturnAt)}</div>
                    <div className="text-blue-700">Departed: {fmtTime(r.gateExitAt)}</div>
                    <div className="text-green-600">Returned: {fmtTime(r.gateEntryAt)}</div>
                  </Td>

                  {/* Vehicle / Driver */}
                  <Td className="px-3 py-2">
                    <div className="font-medium">{r.assignedVehicleNumber || '—'}</div>
                    <div className="text-[10px] text-gray-800">
                      {r.assignedDriverName || '—'}
                      {r.assignedDriverId ? <span className="text-gray-600"> ({r.assignedDriverId})</span> : null}
                    </div>
                    <div className="text-[9px] text-gray-700">{driverPhone || '—'}</div>
                    {officerId ? (
                      <div className="text-[9px] text-gray-500">Officer ID: {officerId}</div>
                    ) : null}
                  </Td>

                  {/* Route */}
                  <Td className="px-3 py-2">
                    <div>{r.fromLocation || '—'} → {r.toLocation || '—'}</div>
                  </Td>

                  {/* Odometer */}
                  <Td className="px-3 py-2">
                    <div className="text-[10px] text-gray-800">Exit: {r.exitOdometer ?? '—'}</div>
                    <div className="text-[10px] text-gray-800">Entry: {r.entryOdometer ?? '—'}</div>
                    {r.exitOdometer != null && r.entryOdometer != null ? (
                      <div className="text-[9px] text-orange-700">Δ {Math.max(0, r.entryOdometer - r.exitOdometer)} km</div>
                    ) : null}
                  </Td>

                  {/* Status */}
                  <Td className="px-3 py-2 text-center">
                    {chip(statusLabel)}
                  </Td>

                  {/* Action */}
                  <Td className="px-3 py-2 text-center">
                    {!r.gateExitAt && (
                      <button
                        className="inline-flex items-center justify-center px-3 py-1.5 rounded bg-orange-600 hover:bg-orange-700 text-white text-[11px]"
                        onClick={() => setOpenExitFor(r)}
                        title="Mark vehicle exit"
                      >
                        Log Exit
                      </button>
                    )}
                    {isDeparted && (
                      <button
                        className="inline-flex items-center justify-center px-3 py-1.5 rounded bg-green-600 hover:bg-green-700 text-white text-[11px]"
                        onClick={() => setOpenEntryFor(r)}
                        title="Mark vehicle return"
                      >
                        Log Return
                      </button>
                    )}
                    {isReturned && <span className="text-gray-500 text-[10px]">Done</span>}
                  </Td>
                </tr>
              );
            })}

            {!loading && !filtered.length && (
              <tr>
                <Td colSpan={7} className="px-3 py-6 text-center text-gray-500">No active trips</Td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* EXIT modal */}
      {openExitFor && (
        <GateExitEntryModal
          mode="exit"
          open
          onClose={() => setOpenExitFor(null)}
          onSubmit={async (p) => {
            try {
              const username = typeof window !== 'undefined' ? window.localStorage.getItem('username') : null;
              if (!username) throw new Error('Session user missing. Please re-login.');
              await login({ username, password: p.password });
              await gateExit(openExitFor.id, {
                odometerStartKm: p.odometer ?? undefined,
                remarks: p.remarks ?? undefined,
              });
              toast.success('Exit logged');
              setOpenExitFor(null);
              load();
            } catch (e: any) {
              toast.error(e?.message || 'Failed to log exit');
            }
          }}
        />
      )}

      {/* ENTRY modal */}
      {openEntryFor && (
        <GateExitEntryModal
          mode="entry"
          open
          onClose={() => setOpenEntryFor(null)}
          onSubmit={async (p) => {
            try {
              const username = typeof window !== 'undefined' ? window.localStorage.getItem('username') : null;
              if (!username) throw new Error('Session user missing. Please re-login.');
              await login({ username, password: p.password });
              await gateEntry(openEntryFor.id, {
                odometerEndKm: p.odometer ?? undefined,
                remarks: p.remarks ?? undefined,
              });
              toast.success('Entry logged');
              setOpenEntryFor(null);
              load();
            } catch (e: any) {
              toast.error(e?.message || 'Failed to log entry');
            }
          }}
        />
      )}
    </div>
  );
}
