'use client';

import React, { useEffect, useState } from 'react';
import { X, CalendarClock, MapPin, UserRound, Car } from 'lucide-react';
import { fetchVehicles } from '../services/VehicleService';
import { fetchDrivers } from '../services/driverService';
import type { Vehicle, Driver, UsageRequest } from '../services/types';
import { assignVehicle, AssignPayload, getRequest } from '../services/usageService';
import { fetchDriverAvailability, fetchVehicleAvailability } from '../services/availabilityService';
import { login } from '../../../../../lib/auth';

const toInput = (val?: string | Date | null) => {
  if (!val) return '';
  const d = val instanceof Date ? val : new Date(val);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const datePart = (val?: string) => (val ? val.split('T')[0] : '');
const timePart = (val?: string) => {
  if (!val) return '';
  const raw = val.includes('T') ? val.split('T')[1] : val;
  return raw.slice(0, 5);
};

export default function AssignVehicleModal({
  open, onClose, requestId, defaultValues, onAssigned, lockedReason,
}: {
  open: boolean;
  onClose: () => void;
  requestId: number;
  defaultValues?: Partial<AssignPayload>;
  onAssigned?: () => void;
  lockedReason?: string | null;
}) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [availableVehicles, setAvailableVehicles] = useState<Vehicle[]>([]);
  const [availableDrivers, setAvailableDrivers] = useState<Driver[]>([]);
  const [request, setRequest] = useState<UsageRequest | null>(null);
  const [vehicleNumber, setVehicleNumber] = useState<string>(defaultValues?.vehicleNumber || '');
  const [driverName, setDriverName] = useState<string>(defaultValues?.driverName || '');
  const [driverPhone, setDriverPhone] = useState<string>(defaultValues?.driverPhone || '');
  const [pickupAt, setPickupAt] = useState<string>('');
  const [expectedReturnAt, setExpectedReturnAt] = useState<string>('');
  const [instructions, setInstructions] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // load request + lists when opening
  useEffect(() => {
    if (!open) return;
    setErr(null);

    (async () => {
      try {
        const [req, vList, dList] = await Promise.all([
          getRequest(requestId).catch(() => null),
          fetchVehicles().catch(() => []),
          fetchDrivers().catch(() => []),
        ]);
        setRequest(req);
        const safeVehicles = Array.isArray(vList) ? vList : [];
        const safeDrivers = Array.isArray(dList) ? dList : [];
        setVehicles(safeVehicles);
        setDrivers(safeDrivers);
        setAvailableVehicles(safeVehicles);
        setAvailableDrivers(safeDrivers);
      } catch {
        setVehicles([]);
        setDrivers([]);
        setAvailableVehicles([]);
        setAvailableDrivers([]);
      }
    })();
  }, [open, requestId]);

  // keep inputs in sync when modal is reused for another request
  useEffect(() => {
    if (!open) return;
    const fallbackPickup =
      defaultValues?.pickupAt ||
      toInput(request?.scheduledPickupAt || (request?.dateOfTravel && request?.timeFrom ? `${request.dateOfTravel}T${request.timeFrom}` : null));
    const fallbackReturn =
      defaultValues?.expectedReturnAt ||
      toInput(
        request?.scheduledReturnAt ||
        (request?.returnDate && request?.timeTo ? `${request.returnDate}T${request.timeTo}` : null) ||
        (request?.dateOfTravel && request?.timeTo ? `${request.dateOfTravel}T${request.timeTo}` : null)
      );

    setVehicleNumber(defaultValues?.vehicleNumber || '');
    setDriverName(defaultValues?.driverName || '');
    setDriverPhone(defaultValues?.driverPhone || '');
    setPickupAt(fallbackPickup || '');
    setExpectedReturnAt(fallbackReturn || '');
    setInstructions(defaultValues?.instructions || '');
    setPassword('');
  }, [
    open,
    defaultValues?.vehicleNumber,
    defaultValues?.driverName,
    defaultValues?.driverPhone,
    defaultValues?.pickupAt,
    defaultValues?.expectedReturnAt,
    defaultValues?.instructions,
    request?.id,
    request?.scheduledPickupAt,
    request?.scheduledReturnAt,
    request?.dateOfTravel,
    request?.returnDate,
    request?.timeFrom,
    request?.timeTo,
  ]);

  // filter vehicles/drivers by availability for selected window
  useEffect(() => {
    if (!open) return;
    const date = datePart(pickupAt) || request?.dateOfTravel;
    const from = timePart(pickupAt) || request?.timeFrom;
    const to = timePart(expectedReturnAt) || request?.timeTo;
    if (!date) {
      setAvailableVehicles(vehicles);
      setAvailableDrivers(drivers);
      return;
    }

    const params: { date: string; from?: string; to?: string } = { date };
    if (from) params.from = from.length === 5 ? `${from}:00` : from;
    if (to) params.to = to.length === 5 ? `${to}:00` : to;

    Promise.all([
      fetchVehicleAvailability(params).catch(() => []),
      fetchDriverAvailability(params).catch(() => []),
    ]).then(([busyVehicles, busyDrivers]) => {
      const busyVehicleSet = new Set(
        (busyVehicles || [])
          .filter(v => (v.busy || []).some(b => !request?.requestCode || b.requestCode !== request.requestCode))
          .map(v => (v.vehicleNumber || '').toUpperCase())
          .filter(Boolean)
      );
      const busyDriverSet = new Set(
        (busyDrivers || [])
          .filter(d => (d.busy || []).some(b => !request?.requestCode || b.requestCode !== request.requestCode))
          .map(d => (d.driverName || '').toUpperCase())
          .filter(Boolean)
      );
      setAvailableVehicles((vehicles || []).filter(v => !busyVehicleSet.has((v.vehicleNumber || '').toUpperCase())));
      setAvailableDrivers((drivers || []).filter(d => !busyDriverSet.has((d.name || '').toUpperCase())));
    }).catch(() => {
      setAvailableVehicles(vehicles);
      setAvailableDrivers(drivers);
    });
  }, [open, pickupAt, expectedReturnAt, vehicles, drivers, request?.dateOfTravel, request?.timeFrom, request?.timeTo, request?.requestCode]);

  if (!open) return null;

  const vehicleOptions = (() => {
    const base = availableVehicles.length ? availableVehicles : vehicles;
    if (vehicleNumber && !base.some(v => v.vehicleNumber === vehicleNumber)) {
      const current = vehicles.find(v => v.vehicleNumber === vehicleNumber);
      return current ? [current, ...base] : base;
    }
    return base;
  })();

  const driverOptions = (() => {
    const base = availableDrivers.length ? availableDrivers : drivers;
    if (driverName && !base.some(d => d.name === driverName)) {
      const current = drivers.find(d => d.name === driverName);
      return current ? [current, ...base] : base;
    }
    return base;
  })();

  const travelDates = request
    ? (request.returnDate ? `${request.dateOfTravel} → ${request.returnDate}` : request.dateOfTravel || '—')
    : '—';
  const timeWindow = request ? `${request.timeFrom || '--:--'} – ${request.timeTo || '--:--'}` : '—';
  const route = request ? `${request.fromLocation || '—'} → ${request.toLocation || '—'}` : '—';

  const doAssign = async () => {
    setErr(null);
    if (lockedReason) {
      setErr(lockedReason);
      return;
    }
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

    if (!password.trim()) {
      setErr('Please confirm your password before saving changes.');
      return;
    }

    setSubmitting(true);
    try {
      // lightweight re-auth to confirm identity before editing a schedule
      const username = typeof window !== 'undefined' ? window.localStorage.getItem('username') : null;
      if (!username) {
        throw new Error('Session username missing. Please re-login.');
      }
      await login({ username, password });

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
      <div className="bg-white rounded-xl shadow-xl w-full max-w-5xl overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-3 border-b bg-orange-50">
          <h3 className="font-bold text-orange-900">Assign Vehicle & Driver</h3>
          <button className="p-2 rounded hover:bg-orange-100" onClick={onClose} aria-label="Close"><X size={18} /></button>
        </div>

        {lockedReason && (
          <div className="px-5 py-3 bg-red-50 border-b border-red-200 text-sm text-red-800">
            {lockedReason}
          </div>
        )}

        <div className="p-5 space-y-5">
          {request && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 grid grid-cols-1 md:grid-cols-3 gap-3 text-sm text-orange-900">
              <div className="space-y-1">
                <div className="text-xs uppercase tracking-wide text-orange-700 font-semibold">Assign Vehicle • {request.requestCode}</div>
                <div className="flex items-center gap-2 text-orange-800"><UserRound size={14} /> <span>{request.applicantName} ({request.employeeId})</span></div>
                <div className="text-orange-700 text-xs">Department: {request.department || '—'}</div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2"><CalendarClock size={14} /><span>Travel Dates: {travelDates}</span></div>
                <div className="text-orange-800 text-sm">Time Window: {timeWindow}</div>
                {request.overnight ? <div className="text-xs text-emerald-700 font-semibold">Overnight</div> : null}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2"><MapPin size={14} /><span>{route}</span></div>
                <div className="text-orange-800 text-sm truncate">Purpose: {request.officialDescription || '—'}</div>
                <div className="text-orange-700 text-xs">Goods: {request.goods || '—'}</div>
              </div>
            </div>
          )}

          {/* schedule first */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              {L('Pickup (date & time)')}
              <input
                type="datetime-local"
                className="w-full border border-orange-200 rounded px-3 py-2"
                value={pickupAt}
                onChange={e => !lockedReason && setPickupAt(e.target.value)}
                disabled={!!lockedReason}
              />
            </div>
            <div>
              {L('Expected Return')}
              <input
                type="datetime-local"
                className="w-full border border-orange-200 rounded px-3 py-2"
                value={expectedReturnAt}
                onChange={e => !lockedReason && setExpectedReturnAt(e.target.value)}
                disabled={!!lockedReason}
              />
            </div>
            <div className="md:col-span-2">
              {L('Instructions')}
              <input
                className="w-full border border-orange-200 rounded px-3 py-2"
                value={instructions}
                onChange={e => !lockedReason && setInstructions(e.target.value)}
                placeholder="Optional…"
                disabled={!!lockedReason}
              />
            </div>
          </div>

          {/* vehicles & drivers */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-orange-800 mb-1">Vehicle (available in this window)</label>
              <input
                readOnly
                value={vehicleNumber || 'Not selected'}
                className="w-full border border-orange-200 rounded px-3 py-2 mb-2 bg-white"
                disabled={!!lockedReason}
              />
              <div className="max-h-64 overflow-auto border rounded">
                <select
                  size={8}
                  className="w-full text-sm px-3 py-2 focus:outline-none"
                  value={vehicleNumber}
                  onChange={e => !lockedReason && setVehicleNumber(e.target.value)}
                  disabled={!!lockedReason}
                >
                  {vehicleOptions.map(v => (
                    <option key={String(v.id ?? v.vehicleNumber)} value={v.vehicleNumber}>
                      {v.vehicleNumber} — {[v.vehicleType, v.brand, v.model].filter(Boolean).join(' ')}
                    </option>
                  ))}
                </select>
                {!vehicleOptions.length && <div className="px-3 py-4 text-center text-gray-500 text-sm">No vehicles</div>}
              </div>
              <p className="text-[11px] text-gray-600 mt-1 flex items-center gap-1"><Car size={12} /> Selected: {vehicleNumber || '—'}</p>
              {availableVehicles.length === 0 && vehicles.length > 0 && (
                <p className="text-xs text-red-700 mt-1">All vehicles are busy for the selected time.</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-orange-800 mb-1">Driver (available in this window)</label>
              <input
                readOnly
                value={driverName ? `${driverName}${driverPhone ? ` (${driverPhone})` : ''}` : 'Not selected'}
                className="w-full border border-orange-200 rounded px-3 py-2 mb-2 bg-white"
                disabled={!!lockedReason}
              />
              <div className="max-h-64 overflow-auto border rounded">
                <select
                  size={8}
                  className="w-full text-sm px-3 py-2 focus:outline-none"
                  value={driverName}
                  onChange={e => {
                    if (lockedReason) return;
                    const chosen = drivers.find(d => d.name === e.target.value);
                    setDriverName(e.target.value);
                    setDriverPhone(chosen?.phone || '');
                  }}
                  disabled={!!lockedReason}
                >
                  {driverOptions.map(d => (
                    <option key={d.employeeId ?? d.name} value={d.name}>
                      {d.name} {d.employeeId ? `— ${d.employeeId}` : ''} {d.phone ? `(${d.phone})` : ''}
                    </option>
                  ))}
                </select>
                {!driverOptions.length && <div className="px-3 py-4 text-center text-gray-500 text-sm">No drivers</div>}
              </div>
              <p className="text-[11px] text-gray-600 mt-1 flex items-center gap-1"><UserRound size={12} /> Selected: {driverName || '—'} {driverPhone ? `(${driverPhone})` : ''}</p>
              {availableDrivers.length === 0 && drivers.length > 0 && (
                <p className="text-xs text-red-700 mt-1">All drivers are busy for the selected time.</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {L('Confirm with your password to save changes')}
            <input
              type="password"
              className="w-full border border-orange-200 rounded px-3 py-2"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter your account password"
              autoComplete="new-password"
            />
            {err && (
              <div className="text-sm rounded border border-red-300 bg-red-50 text-red-800 px-3 py-2">
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
            disabled={submitting || !!lockedReason}
          >
            {submitting ? 'Assigning…' : 'Assign'}
          </button>
        </div>
      </div>
    </div>
  );
}
