'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Th, Td } from '../../Transport/components/ThTd';
import SearchBar from '../components/SearchBar';
import type { UsageRequest } from '../../Transport/services/types';
import { listByStatus } from '../../Transport/services/usageService';
import { Clock3, Car, UserRound } from 'lucide-react';

/* ---------------- helpers ---------------- */
const fmtDT = (s?: string | null) => (s ? new Date(s).toLocaleString() : '—');

const matchesQuery = (q: string) => (r: UsageRequest) =>
  [
    r.requestCode,
    r.assignedVehicleNumber,
    r.assignedDriverName,
    r.assignedDriverPhone,
    r.department,
    r.fromLocation,
    r.toLocation,
    r.dateOfTravel,
    r.timeFrom,
    r.timeTo,
    r.gateExitAt,
  ]
    .map((x) => (x ?? '').toString().toLowerCase())
    .join(' ')
    .includes(q.trim().toLowerCase());

const startIsoFor = (r: UsageRequest) =>
  r.gateExitAt ||
  r.scheduledPickupAt ||
  (r.dateOfTravel && r.timeFrom ? `${r.dateOfTravel}T${r.timeFrom}` : null);

const startLabel = (r: UsageRequest) => fmtDT(startIsoFor(r));

const elapsedLabel = (startIso?: string | null, now?: Date | null) => {
  if (!startIso || !now) return '—';
  const ms = now.getTime() - new Date(startIso).getTime();
  if (Number.isNaN(ms) || ms < 0) return '—';
  const mins = Math.floor(ms / 60000);
  const hours = Math.floor(mins / 60);
  const rem = mins % 60;
  return hours ? `${hours}h ${rem}m` : `${rem}m`;
};

/* ---------------- page ---------------- */
export default function InchargeActiveVehiclesPage() {
  const [rows, setRows] = useState<UsageRequest[]>([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState<Date | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [dispatched, scheduled] = await Promise.all([
        listByStatus('DISPATCHED'),
        listByStatus('SCHEDULED'),
      ]);

      // "Active" := exited, not yet returned
      const active = [...(dispatched || []), ...(scheduled || [])]
        .filter((r: any) => r?.gateExitAt && !r?.gateEntryAt)
        .sort(
          (a: any, b: any) =>
            (Date.parse(b?.gateExitAt || '') || 0) - (Date.parse(a?.gateExitAt || '') || 0)
        );

      setRows(active);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);

  const filtered = useMemo(
    () => (q ? rows.filter(matchesQuery(q)) : rows),
    [rows, q]
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-[14px] md:text-lg font-bold text-orange-900">Active Vehicles (On Trip)</h1>
        <SearchBar
          value={q}
          onChange={setQ}
          placeholder="Search code, vehicle, driver, route…"
          className="w-full sm:w-72"
        />
      </div>

      <div className="bg-white rounded-lg border border-orange-200">
        <div
          className="overflow-x-auto overflow-y-hidden
                     [&::-webkit-scrollbar]:h-2
                     [&::-webkit-scrollbar-thumb]:bg-orange-300
                     [&::-webkit-scrollbar-track]:bg-transparent
                     [scrollbar-width:thin]"
        >
          <table className="min-w-full table-fixed text-[10.5px] leading-[1.15]">
            {/* Keep <colgroup> on a single line (no whitespace text nodes) to avoid hydration warnings */}
            <colgroup><col className="w-40"/><col className="w-40"/><col className="w-48"/><col className="w-44"/><col className="w-20"/><col className="w-[18rem]"/></colgroup>

            <thead className="bg-orange-50">
              <tr className="text-[9.5px]">
                <Th className="px-2 py-1 text-left">RQ Code</Th>
                <Th className="px-2 py-1 text-left">Vehicle</Th>
                <Th className="px-2 py-1 text-left">Driver</Th>
                <Th className="px-2 py-1 text-left">Started / Elapsed</Th>
                <Th className="px-2 py-1 text-left">Exit Odo</Th>
                <Th className="px-2 py-1 text-left">Route</Th>
              </tr>
            </thead>

            <tbody className="divide-y">
              {loading && (
                <tr>
                  <Td colSpan={6} className="px-2 py-6 text-center text-gray-500">Loading…</Td>
                </tr>
              )}

              {!loading && filtered.map((r) => (
                <tr key={r.id} className="align-top hover:bg-orange-50/40">
                  <Td className="px-2 py-1">
                    <div className="font-semibold text-orange-900 truncate">{r.requestCode}</div>
                    <div className="text-[9px] text-gray-600 truncate">{r.department || '—'}</div>
                  </Td>

                  <Td className="px-2 py-1">
                    <div className="inline-flex items-center gap-1 truncate">
                      <Car size={12} className="text-orange-700" />
                      <span className="font-medium">{r.assignedVehicleNumber || '—'}</span>
                    </div>
                  </Td>

                  <Td className="px-2 py-1">
                    <div className="truncate inline-flex items-center gap-1">
                      <UserRound size={12} className="text-orange-700" />
                      <span>{r.assignedDriverName || '—'}</span>
                    </div>
                    <div className="text-[9px] text-gray-600 truncate">
                      {r.assignedDriverPhone ? `(${r.assignedDriverPhone})` : '—'}
                    </div>
                    {r.assignedDriverName && now ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-[2px] rounded-full mt-1">
                        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                        On trip
                      </span>
                    ) : null}
                  </Td>

                  <Td className="px-2 py-1">
                    <div className="inline-flex items-center gap-1">
                      <Clock3 size={12} className="text-orange-700" />
                      <span>{startLabel(r)}</span>
                    </div>
                    <div className="text-[9px] text-emerald-700 font-semibold">
                      Elapsed: {elapsedLabel(startIsoFor(r), now)}
                    </div>
                  </Td>

                  <Td className="px-2 py-1">{r.exitOdometer ?? '—'}</Td>

                  <Td className="px-2 py-1">
                    <div className="truncate">{r.fromLocation} → {r.toLocation}</div>
                    <div className="text-[9px] text-gray-600">
                      <span className="font-mono">{r.dateOfTravel || '—'}</span>{' '}
                      <span className="font-mono">{r.timeFrom || '—'}</span>–<span className="font-mono">{r.timeTo || '—'}</span>{' '}
                      {r.overnight ? '(overnight)' : ''}
                    </div>
                  </Td>
                </tr>
              ))}

              {!loading && !filtered.length && (
                <tr>
                  <Td colSpan={6} className="px-2 py-6 text-center text-gray-500">No active trips</Td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
