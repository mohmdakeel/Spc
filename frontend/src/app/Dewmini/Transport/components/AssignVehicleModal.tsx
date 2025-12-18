'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { X, Search } from 'lucide-react';
import { fetchVehicles } from '../services/VehicleService';
import { fetchDrivers } from '../services/driverService';
import type { Vehicle, Driver } from '../services/types';
import { assignVehicle, AssignPayload } from '../services/usageService';

export default function AssignVehicleModal({
  open, onClose, requestId, defaultValues, onAssigned,
}: {
  open: boolean;
  onClose: () => void;
  requestId: number;
  defaultValues?: Partial<AssignPayload>;
  onAssigned?: () => void;
}) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vQuery, setVQuery] = useState('');
  const [dQuery, setDQuery] = useState('');

  const [vehicleNumber, setVehicleNumber] = useState<string>(defaultValues?.vehicleNumber || '');
  const [driverName, setDriverName] = useState<string>(defaultValues?.driverName || '');
  const [driverPhone, setDriverPhone] = useState<string>(defaultValues?.driverPhone || '');
  const [pickupAt, setPickupAt] = useState<string>('');
  const [expectedReturnAt, setExpectedReturnAt] = useState<string>('');
  const [instructions, setInstructions] = useState<string>('');

  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setErr(null);
    // refresh lists every open (cheap and avoids staleness)
    fetchVehicles().then(setVehicles).catch(() => setVehicles([]));
    fetchDrivers().then(setDrivers).catch(() => setDrivers([]));
  }, [open]);

  // keep inputs in sync when modal is reused for another request
  useEffect(() => {
    if (!open) return;
    setVehicleNumber(defaultValues?.vehicleNumber || '');
    setDriverName(defaultValues?.driverName || '');
    setDriverPhone(defaultValues?.driverPhone || '');
  }, [open, defaultValues?.vehicleNumber, defaultValues?.driverName, defaultValues?.driverPhone]);

  const vList = useMemo(() => {
    const q = vQuery.trim().toLowerCase();
    if (!q) return vehicles;
    return vehicles.filter(v =>
      [v.vehicleNumber, v.vehicleType, v.brand, v.model]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(q)
    );
  }, [vehicles, vQuery]);

  const dList = useMemo(() => {
    const q = dQuery.trim().toLowerCase();
    if (!q) return drivers;
    return drivers.filter(d =>
      [d.name, d.employeeId, d.phone].filter(Boolean).join(' ').toLowerCase().includes(q)
    );
  }, [drivers, dQuery]);

  if (!open) return null;

  const doAssign = async () => {
    setErr(null);
    if (!vehicleNumber || !driverName || !pickupAt || !expectedReturnAt) {
      setErr('Please fill vehicle, driver, pickup and expected return.');
      return;
    }
    const pDate = new Date(pickupAt);
    const rDate = new Date(expectedReturnAt);
    if (isNaN(pDate.getTime()) || isNaN(rDate.getTime())) {
      setErr('Invalid date/time values.');
      return;
    }
    if (rDate <= pDate) {
      setErr('Expected return must be after pickup.');
      return;
    }

    setSubmitting(true);
    try {
      await assignVehicle(requestId, {
        vehicleNumber,
        driverName,
        driverPhone: driverPhone || undefined,
        pickupAt: pDate,
        expectedReturnAt: rDate,
        instructions: instructions || undefined,
      });
      onAssigned?.();
      onClose();
    } catch (e: any) {
      setErr(e?.message || 'Failed to assign. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const L = (s: string) => <label className="block text-sm font-medium text-orange-800 mb-1">{s}</label>;

  return (
    <div className="fixed inset-0 bg-black/40 grid place-items-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-3 border-b bg-orange-50">
          <h3 className="font-bold text-orange-900">Assign Vehicle & Driver</h3>
          <button className="p-2 rounded hover:bg-orange-100" onClick={onClose} aria-label="Close"><X size={18} /></button>
        </div>

        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* vehicles */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Search size={16} className="text-orange-600" />
              <input
                placeholder="Search vehicles (number, type, brand…)"
                value={vQuery}
                onChange={e => setVQuery(e.target.value)}
                className="w-full border border-orange-200 rounded px-3 py-2"
              />
            </div>
            <div className="max-h-64 overflow-auto border rounded">
              <table className="w-full text-sm">
                <tbody>
                  {vList.map(v => (
                    <tr
                      key={String(v.id)}
                      className={`cursor-pointer hover:bg-orange-50 ${v.vehicleNumber === vehicleNumber ? 'bg-orange-100' : ''}`}
                      onClick={() => setVehicleNumber(v.vehicleNumber)}
                    >
                      <td className="px-3 py-2 font-medium">{v.vehicleNumber}</td>
                      <td className="px-3 py-2">{v.vehicleType}</td>
                      <td className="px-3 py-2">{[v.brand, v.model].filter(Boolean).join(' ')}</td>
                    </tr>
                  ))}
                  {!vList.length && <tr><td className="px-3 py-4 text-center text-gray-500">No vehicles</td></tr>}
                </tbody>
              </table>
            </div>
          </div>

          {/* drivers */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Search size={16} className="text-orange-600" />
              <input
                placeholder="Search drivers (name, ID, phone…)"
                value={dQuery}
                onChange={e => setDQuery(e.target.value)}
                className="w-full border border-orange-200 rounded px-3 py-2"
              />
            </div>
            <div className="max-h-64 overflow-auto border rounded">
              <table className="w-full text-sm">
                <tbody>
                  {dList.map(d => (
                    <tr
                      key={d.employeeId}
                      className={`cursor-pointer hover:bg-orange-50 ${d.name === driverName ? 'bg-orange-100' : ''}`}
                      onClick={() => { setDriverName(d.name); setDriverPhone(d.phone || ''); }}
                    >
                      <td className="px-3 py-2 font-medium">{d.name}</td>
                      <td className="px-3 py-2">{d.employeeId}</td>
                      <td className="px-3 py-2">{d.phone || '-'}</td>
                    </tr>
                  ))}
                  {!dList.length && <tr><td className="px-3 py-4 text-center text-gray-500">No drivers</td></tr>}
                </tbody>
              </table>
            </div>
          </div>

          {/* schedule */}
          <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              {L('Pickup (date & time)')}
              <input
                type="datetime-local"
                className="w-full border border-orange-200 rounded px-3 py-2"
                value={pickupAt}
                onChange={e => setPickupAt(e.target.value)}
              />
            </div>
            <div>
              {L('Expected Return')}
              <input
                type="datetime-local"
                className="w-full border border-orange-200 rounded px-3 py-2"
                value={expectedReturnAt}
                onChange={e => setExpectedReturnAt(e.target.value)}
              />
            </div>
            <div className="md:col-span-2">
              {L('Instructions')}
              <input
                className="w-full border border-orange-200 rounded px-3 py-2"
                value={instructions}
                onChange={e => setInstructions(e.target.value)}
                placeholder="Optional…"
              />
            </div>

            {err && (
              <div className="md:col-span-2 text-sm rounded border border-red-300 bg-red-50 text-red-800 px-3 py-2">
                {err}
              </div>
            )}
          </div>
        </div>

        <div className="px-5 py-3 border-t bg-orange-50 flex justify-end gap-2">
          <button className="px-4 py-2 rounded border" onClick={onClose}>Cancel</button>
          <button
            className="px-4 py-2 rounded bg-orange-600 text-white disabled:opacity-60"
            onClick={doAssign}
            disabled={submitting}
          >
            {submitting ? 'Assigning…' : 'Assign'}
          </button>
        </div>
      </div>
    </div>
  );
}
