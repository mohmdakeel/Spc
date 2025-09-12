'use client';

import React, { useEffect, useMemo, useState } from 'react';
import GateSidebar from '../components/GateSidebar';
import { Th, Td } from '../../Transport/components/ThTd';
import { listByStatus, gateExit, gateEntry } from '../../Transport/services/usageService';
import type { UsageRequest } from '../../Transport/services/types';
import SearchBar from '../../Transport/components/SearchBar';
import GateExitEntryModal from '../../Transport/components/GateExitEntryModal';
import { toast } from 'react-toastify';

const fmtDT = (s?: string | null) => (s ? new Date(s).toLocaleString() : '-');

export default function GateScheduledPage() {
  const [scheduled, setScheduled] = useState<UsageRequest[]>([]);
  const [dispatched, setDispatched] = useState<UsageRequest[]>([]);
  const [q, setQ] = useState('');
  const [openExitFor, setOpenExitFor] = useState<UsageRequest | null>(null);
  const [openEntryFor, setOpenEntryFor] = useState<UsageRequest | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [sch, disp] = await Promise.all([listByStatus('SCHEDULED'), listByStatus('DISPATCHED')]);

      // sort: scheduled by pickup asc; dispatched by exit desc
      setScheduled(
        (sch || [])
          .slice()
          .sort(
            (a, b) =>
              (a.scheduledPickupAt ? new Date(a.scheduledPickupAt).getTime() : 0) -
              (b.scheduledPickupAt ? new Date(b.scheduledPickupAt).getTime() : 0)
          )
      );
      setDispatched(
        (disp || [])
          .slice()
          .sort(
            (a, b) =>
              (b.gateExitAt ? new Date(b.gateExitAt).getTime() : 0) -
              (a.gateExitAt ? new Date(a.gateExitAt).getTime() : 0)
          )
      );
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
  }, []);

  const filterFn = (r: UsageRequest) =>
    [
      r.requestCode,
      r.assignedVehicleNumber,
      r.assignedDriverName,
      r.assignedDriverPhone,
      r.dateOfTravel,
      r.timeFrom,
      r.timeTo,
      r.fromLocation,
      r.toLocation,
      r.department,
    ]
      .map((x) => (x ?? '').toString().toLowerCase())
      .join(' ')
      .includes(q.trim().toLowerCase());

  const filteredScheduled = useMemo(() => (q ? scheduled.filter(filterFn) : scheduled), [scheduled, q]);
  const filteredDispatched = useMemo(() => (q ? dispatched.filter(filterFn) : dispatched), [dispatched, q]);

  return (
    <div className="flex min-h-screen bg-orange-50">
      <GateSidebar />
      <main className="p-3 md:p-4 flex-1 space-y-5">
        <div className="flex items-center justify-between">
          <h1 className="text-[14px] md:text-lg font-bold text-orange-900">Gate • Schedules & Trips</h1>
          <SearchBar
            value={q}
            onChange={setQ}
            placeholder="Search code, vehicle, driver, route…"
            className="h-8"
          />
        </div>

        {/* ===== Scheduled Vehicles ===== */}
        <section>
          <h2 className="text-[12px] md:text-sm font-semibold text-orange-900 mb-1.5">Scheduled Vehicles</h2>
          <div className="bg-white rounded-lg border border-orange-200 overflow-auto">
            {/* Keep colgroup on one line to avoid hydration whitespace warnings */}
            <table className="w-full table-fixed text-[10px] leading-[1.15]">
              <colgroup>
                <col className="w-40" /><col className="w-40" /><col className="w-44" />
                <col className="w-44" /><col className="w-44" /><col className="w-28" />
              </colgroup>
              <thead className="bg-orange-50">
                <tr className="text-[9.5px]">
                  <Th className="px-2 py-1 text-left">RQ Code</Th>
                  <Th className="px-2 py-1 text-left">Vehicle</Th>
                  <Th className="px-2 py-1 text-left">Driver</Th>
                  <Th className="px-2 py-1 text-left">Pickup (Sched.)</Th>
                  <Th className="px-2 py-1 text-left">Return (Sched.)</Th>
                  <Th className="px-2 py-1 text-center">Action</Th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {loading && (
                  <tr>
                    <Td colSpan={6} className="px-2 py-6 text-center text-gray-500">Loading…</Td>
                  </tr>
                )}

                {!loading &&
                  filteredScheduled.map((r) => (
                    <tr key={r.id} className="hover:bg-orange-50/40">
                      <Td className="px-2 py-1">{r.requestCode}</Td>
                      <Td className="px-2 py-1">{r.assignedVehicleNumber || '-'}</Td>
                      <Td className="px-2 py-1">
                        {r.assignedDriverName || '-'}
                        {r.assignedDriverPhone ? (
                          <span className="text-[9px] text-gray-600"> ({r.assignedDriverPhone})</span>
                        ) : null}
                      </Td>
                      <Td className="px-2 py-1">{fmtDT(r.scheduledPickupAt)}</Td>
                      <Td className="px-2 py-1">{fmtDT(r.scheduledReturnAt)}</Td>
                      <Td className="px-2 py-1 text-center">
                        <button
                          className="px-2.5 py-[6px] rounded bg-orange-600 text-white hover:bg-orange-700 text-[10px]"
                          onClick={() => setOpenExitFor(r)}
                          title="Mark vehicle exit"
                        >
                          Mark Exit
                        </button>
                      </Td>
                    </tr>
                  ))}

                {!loading && !filteredScheduled.length && (
                  <tr>
                    <Td colSpan={6} className="px-2 py-6 text-center text-gray-500">
                      No scheduled vehicles
                    </Td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* ===== Dispatched (On Trip) ===== */}
        <section>
          <h2 className="text-[12px] md:text-sm font-semibold text-orange-900 mb-1.5">On Trip (Dispatched)</h2>
          <div className="bg-white rounded-lg border border-orange-200 overflow-auto">
            {/* Keep colgroup on one line to avoid hydration whitespace warnings */}
            <table className="w-full table-fixed text-[10px] leading-[1.15]">
              <colgroup>
                <col className="w-40" /><col className="w-40" /><col className="w-44" />
                <col className="w-44" /><col className="w-36" /><col className="w-28" />
              </colgroup>
              <thead className="bg-orange-50">
                <tr className="text-[9.5px]">
                  <Th className="px-2 py-1 text-left">RQ Code</Th>
                  <Th className="px-2 py-1 text-left">Vehicle</Th>
                  <Th className="px-2 py-1 text-left">Driver</Th>
                  <Th className="px-2 py-1 text-left">Exit Time</Th>
                  <Th className="px-2 py-1 text-left">Exit Odometer</Th>
                  <Th className="px-2 py-1 text-center">Action</Th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {loading && (
                  <tr>
                    <Td colSpan={6} className="px-2 py-6 text-center text-gray-500">Loading…</Td>
                  </tr>
                )}

                {!loading &&
                  filteredDispatched.map((r) => (
                    <tr key={r.id} className="hover:bg-orange-50/40">
                      <Td className="px-2 py-1">{r.requestCode}</Td>
                      <Td className="px-2 py-1">{r.assignedVehicleNumber || '-'}</Td>
                      <Td className="px-2 py-1">
                        {r.assignedDriverName || '-'}
                        {r.assignedDriverPhone ? (
                          <span className="text-[9px] text-gray-600"> ({r.assignedDriverPhone})</span>
                        ) : null}
                      </Td>
                      <Td className="px-2 py-1">{fmtDT(r.gateExitAt)}</Td>
                      <Td className="px-2 py-1">{r.exitOdometer ?? '-'}</Td>
                      <Td className="px-2 py-1 text-center">
                        <button
                          className="px-2.5 py-[6px] rounded bg-green-600 text-white hover:bg-green-700 text-[10px]"
                          onClick={() => setOpenEntryFor(r)}
                          title="Mark vehicle entry"
                        >
                          Mark Entry
                        </button>
                      </Td>
                    </tr>
                  ))}

                {!loading && !filteredDispatched.length && (
                  <tr>
                    <Td colSpan={6} className="px-2 py-6 text-center text-gray-500">None</Td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {/* EXIT modal */}
      {openExitFor && (
        <GateExitEntryModal
          mode="exit"
          open
          onClose={() => setOpenExitFor(null)}
          onSubmit={async (p) => {
            try {
              await gateExit(openExitFor.id, {
                odometerStartKm: p.odometer ?? undefined,
                fuelBefore: p.fuel ?? undefined,
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
              await gateEntry(openEntryFor.id, {
                odometerEndKm: p.odometer ?? undefined,
                fuelAfter: p.fuel ?? undefined,
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
