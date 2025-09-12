'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { X, CalendarClock, Car, User2, Phone, Info } from 'lucide-react';
import { assignVehicle, type AssignPayload } from '../../Transport/services/usageService';

type Props = {
  open: boolean;
  onClose: () => void;
  requestId: number;
  defaultValues?: Partial<{
    vehicleId: number | null;
    vehicleNumber: string;
    driverId: number | null;
    driverName: string;
    driverPhone: string;
    pickupAt: string;          // "YYYY-MM-DDTHH:mm"
    expectedReturnAt: string;  // "YYYY-MM-DDTHH:mm"
    instructions: string;
  }>;
  onAssigned?: () => void;
};

export default function AssignVehicleModal({
  open, onClose, requestId, defaultValues, onAssigned,
}: Props) {
  const [vehicleId, setVehicleId] = useState<number | ''>('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [driverId, setDriverId] = useState<number | ''>('');
  const [driverName, setDriverName] = useState('');
  const [driverPhone, setDriverPhone] = useState('');
  const [pickupAt, setPickupAt] = useState('');             // local "YYYY-MM-DDTHH:mm"
  const [expectedReturnAt, setExpectedReturnAt] = useState('');
  const [instructions, setInstructions] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setVehicleId(defaultValues?.vehicleId ?? '');
    setVehicleNumber(defaultValues?.vehicleNumber ?? '');
    setDriverId(defaultValues?.driverId ?? '');
    setDriverName(defaultValues?.driverName ?? '');
    setDriverPhone(defaultValues?.driverPhone ?? '');
    setPickupAt(defaultValues?.pickupAt ?? '');
    setExpectedReturnAt(defaultValues?.expectedReturnAt ?? '');
    setInstructions(defaultValues?.instructions ?? '');
    setErr(null);
  }, [open, defaultValues]);

  const canSubmit = useMemo(() => {
    if (!pickupAt || !expectedReturnAt) return false;
    // must provide either vehicleId or vehicleNumber
    if (!vehicleId && !vehicleNumber.trim()) return false;
    // basic time ordering check
    try {
      const a = new Date(pickupAt);
      const b = new Date(expectedReturnAt);
      if (!(b.getTime() > a.getTime())) return false;
    } catch { return false; }
    return true;
  }, [pickupAt, expectedReturnAt, vehicleId, vehicleNumber]);

  const submit = async () => {
    setSubmitting(true); setErr(null);
    try {
      const payload: AssignPayload = {
        vehicleId: typeof vehicleId === 'number' ? vehicleId : undefined,
        vehicleNumber: vehicleNumber || undefined,
        driverId: typeof driverId === 'number' ? driverId : undefined,
        driverName: driverName || undefined,
        driverPhone: driverPhone || undefined,
        pickupAt,                 // keep as "YYYY-MM-DDTHH:mm" (no Z)
        expectedReturnAt,
        instructions: instructions || undefined,
      };
      await assignVehicle(requestId, payload);
      onAssigned?.();
    } catch (e: any) {
      setErr(e?.message || 'Failed to assign');
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  const L = (s: string) => <label className="block text-[13px] font-medium text-orange-800 mb-1">{s}</label>;

  return (
    <div className="fixed inset-0 bg-black/40 grid place-items-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl overflow-hidden" onClick={e=>e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b bg-orange-50">
          <h3 className="font-bold text-orange-900">Assign Vehicle</h3>
          <button className="p-2 rounded hover:bg-orange-100" onClick={onClose} aria-label="Close"><X size={18}/></button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {err && (
            <div className="text-sm rounded border border-red-300 bg-red-50 text-red-800 px-3 py-2">
              {err}
            </div>
          )}

          {/* Schedule */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              {L('Pickup At *')}
              <div className="relative">
                <CalendarClock size={16} className="absolute left-2 top-2.5 text-orange-600"/>
                <input
                  type="datetime-local"
                  className="w-full border rounded pl-8 pr-3 py-2 border-orange-200"
                  value={pickupAt}
                  onChange={e => setPickupAt(e.target.value)}
                />
              </div>
            </div>
            <div>
              {L('Expected Return At *')}
              <div className="relative">
                <CalendarClock size={16} className="absolute left-2 top-2.5 text-orange-600"/>
                <input
                  type="datetime-local"
                  className="w-full border rounded pl-8 pr-3 py-2 border-orange-200"
                  value={expectedReturnAt}
                  onChange={e => setExpectedReturnAt(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Vehicle / Driver */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              {L('Vehicle Number * (or Vehicle ID)')}
              <div className="relative">
                <Car size={16} className="absolute left-2 top-2.5 text-orange-600"/>
                <input
                  className="w-full border rounded pl-8 pr-3 py-2 border-orange-200"
                  placeholder="e.g. SPC-1234"
                  value={vehicleNumber}
                  onChange={e => setVehicleNumber(e.target.value)}
                />
              </div>
              <div className="text-[11px] text-orange-700 mt-1 flex items-center gap-1">
                <Info size={12}/> You may leave number blank if you enter Vehicle ID below.
              </div>
              <input
                className="mt-2 w-full border rounded px-3 py-2 border-orange-200"
                placeholder="Vehicle ID (optional)"
                value={vehicleId}
                onChange={e => setVehicleId(e.target.value ? Number(e.target.value) : '')}
              />
            </div>

            <div>
              {L('Driver (optional)')}
              <div className="relative mb-2">
                <User2 size={16} className="absolute left-2 top-2.5 text-orange-600"/>
                <input
                  className="w-full border rounded pl-8 pr-3 py-2 border-orange-200"
                  placeholder="Driver name"
                  value={driverName}
                  onChange={e => setDriverName(e.target.value)}
                />
              </div>
              <div className="relative mb-2">
                <Phone size={16} className="absolute left-2 top-2.5 text-orange-600"/>
                <input
                  className="w-full border rounded pl-8 pr-3 py-2 border-orange-200"
                  placeholder="Driver phone"
                  value={driverPhone}
                  onChange={e => setDriverPhone(e.target.value)}
                />
              </div>
              <input
                className="w-full border rounded px-3 py-2 border-orange-200"
                placeholder="Driver ID (optional)"
                value={driverId}
                onChange={e => setDriverId(e.target.value ? Number(e.target.value) : '')}
              />
            </div>
          </div>

          <div>
            {L('Instructions / Notes (optional)')}
            <textarea
              rows={3}
              className="w-full border border-orange-200 rounded px-3 py-2"
              value={instructions}
              onChange={e => setInstructions(e.target.value)}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t bg-orange-50 flex justify-end gap-2">
          <button className="px-4 py-2 rounded border" onClick={onClose}>Cancel</button>
          <button
            disabled={!canSubmit || submitting}
            onClick={submit}
            className="px-4 py-2 rounded bg-orange-600 text-white disabled:opacity-60"
          >
            {submitting ? 'Saving…' : 'Save Assignment'}
          </button>
        </div>
      </div>
    </div>
  );
}
