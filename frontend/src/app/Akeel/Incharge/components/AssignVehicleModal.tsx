'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  X, Car, User2, ChevronDown, Search,
} from 'lucide-react';
import { fetchVehicles } from '../../Transport/services/VehicleService';
import { fetchDrivers } from '../../Transport/services/driverService';
import type { Vehicle, Driver, UsageRequest } from '../../Transport/services/types';
import { assignVehicle, type AssignPayload } from '../../Transport/services/usageService';

/* ---------------- helpers for Officer parsing / cleaning ---------------- */
const cleanPhone = (p?: string) =>
  (p ?? '')
    .replace(/[^\d+()\-\s./;]/g, '')
    .replace(/^[;,\s-]+/, '')
    .replace(/\s{2,}/g, ' ')
    .trim();

function extractOfficer(r?: Partial<UsageRequest> | null): {
  withOfficer: boolean; name?: string; id?: string; phone?: string;
} {
  if (!r) return { withOfficer: false };
  if ((r as any).travelWithOfficer || (r as any).officerName || (r as any).officerId || (r as any).officerPhone) {
    return {
      withOfficer: true,
      name: (r as any).officerName || undefined,
      id: (r as any).officerId || undefined,
      phone: cleanPhone((r as any).officerPhone) || undefined,
    };
  }
  const text = `${(r as any)?.officialDescription ?? ''}\n${(r as any)?.remarks ?? ''}`;
  const m =
    /Travelling Officer:\s*([^\(\n,]+)?(?:\s*\((?:Employee\s*ID|Emp\.?\s*ID|ID)\s*:\s*([^)]+)\))?(?:,\s*(?:Phone|Tel)\s*:\s*([^\n]+))?/i
      .exec(text);
  if (m) return { withOfficer: true, name: m[1]?.trim(), id: m[2]?.trim(), phone: cleanPhone(m[3]) };
  return { withOfficer: false };
}

function purposeWithoutOfficer(r: any): string {
  const raw = String(r?.officialDescription ?? '');
  let cleaned = raw.split(/\r?\n/).filter(l => !/travell?ing\s+officer\s*:/i.test(l)).join('\n');
  cleaned = cleaned.replace(/\b(?:Phone|Tel)\s*:\s*[\+\d()\-\s./;]+/gi, '').trim();
  return cleaned || '—';
}

/* ---------------- component ---------------- */
type Props = {
  open: boolean;
  onClose: () => void;
  requestId: number;
  request: UsageRequest;      // full request details
  defaultValues?: Partial<AssignPayload>;
  onAssigned?: () => void;
};

export default function AssignVehicleModal({
  open, onClose, requestId, request, defaultValues, onAssigned,
}: Props) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicleQuery, setVehicleQuery] = useState('');
  const [driverQuery, setDriverQuery] = useState('');

  const [vehicleNumber, setVehicleNumber] = useState(defaultValues?.vehicleNumber || '');
  const [driverName, setDriverName] = useState(defaultValues?.driverName || '');
  const [driverPhone, setDriverPhone] = useState(defaultValues?.driverPhone || '');
  const [pickupAt, setPickupAt] = useState('');
  const [expectedReturnAt, setExpectedReturnAt] = useState('');
  const [instructions, setInstructions] = useState('');

  const [openDropdown, setOpenDropdown] = useState<'vehicle' | 'driver' | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // derived officer info (explicit or parsed from purpose/remarks)
  const off = useMemo(() => extractOfficer(request), [request]);

  useEffect(() => {
    if (!open) return;
    fetchVehicles().then(setVehicles).catch(() => setVehicles([]));
    fetchDrivers().then(setDrivers).catch(() => setDrivers([]));
    setErr(null);
  }, [open]);

  const filteredVehicles = useMemo(() => {
    const q = vehicleQuery.trim().toLowerCase();
    if (!q) return vehicles;
    return vehicles.filter(v =>
      [v.vehicleNumber, v.vehicleType, v.brand, v.model]
        .filter(Boolean).join(' ').toLowerCase().includes(q)
    );
  }, [vehicles, vehicleQuery]);

  const filteredDrivers = useMemo(() => {
    const q = driverQuery.trim().toLowerCase();
    if (!q) return drivers;
    return drivers.filter(d =>
      [d.name, d.employeeId, d.phone].filter(Boolean).join(' ').toLowerCase().includes(q)
    );
  }, [drivers, driverQuery]);

  const canSubmit = useMemo(() => {
    if (!pickupAt || !expectedReturnAt) return false;
    if (!vehicleNumber.trim() || !driverName.trim()) return false;
    const a = new Date(pickupAt);
    const b = new Date(expectedReturnAt);
    return b > a;
  }, [pickupAt, expectedReturnAt, vehicleNumber, driverName]);

  const submit = async () => {
    setSubmitting(true);
    setErr(null);
    try {
      const payload: AssignPayload = {
        vehicleNumber,
        driverName,
        driverPhone: driverPhone || undefined,
        pickupAt,
        expectedReturnAt,
        instructions: instructions || undefined,
      };
      await assignVehicle(requestId, payload);
      onAssigned?.();
      onClose();
    } catch (e: any) {
      setErr(e?.message || 'Failed to assign');
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  const L = (s: string) => (
    <label className="block text-sm font-medium text-orange-800 mb-1">{s}</label>
  );

  return (
    <div className="fixed inset-0 bg-black/40 grid place-items-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-5xl overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b bg-orange-50">
          <h3 className="font-bold text-orange-900">Assign Vehicle • {request.requestCode}</h3>
          <button className="p-2 rounded hover:bg-orange-100" onClick={onClose}><X size={18} /></button>
        </div>

        {/* Full Request Details (now with parsed Officer + cleaned Purpose) */}
        <div className="px-5 py-4 bg-orange-50/30 border-b text-sm grid grid-cols-1 md:grid-cols-2 gap-3">
          <div><b>Applicant:</b> {request.applicantName} ({request.employeeId})</div>
          <div><b>Department:</b> {request.department || '—'}</div>
          <div><b>Date:</b> {request.dateOfTravel}</div>
          <div><b>Time:</b> {request.timeFrom} – {request.timeTo} {request.overnight ? '(overnight)' : ''}</div>
          <div className="md:col-span-2"><b>Route:</b> {request.fromLocation} → {request.toLocation}</div>
          <div className="md:col-span-2"><b>Purpose:</b> {purposeWithoutOfficer(request)}</div>
          <div><b>Goods:</b> {request.goods || '—'}</div>
          <div className="md:col-span-2">
            <b>Officer:</b>{' '}
            {off.withOfficer
              ? <>{off.name || '—'}{off.id ? ` (${off.id})` : ''}{off.phone ? ` • ${off.phone}` : ''}</>
              : '—'}
          </div>
        </div>

        {/* Body */}
        <div className="p-5 space-y-5">
          {/* Vehicle Dropdown */}
          <div className="relative">
            {L('Vehicle *')}
            <div
              className="flex items-center border border-orange-200 rounded px-3 py-2 cursor-pointer bg-white"
              onClick={() => setOpenDropdown(openDropdown === 'vehicle' ? null : 'vehicle')}
            >
              <Car size={16} className="text-orange-600 mr-2" />
              <span className="flex-1">{vehicleNumber || 'Select vehicle…'}</span>
              <ChevronDown size={16} className="text-orange-600" />
            </div>
            {openDropdown === 'vehicle' && (
              <div className="absolute z-50 mt-1 bg-white border rounded shadow max-h-60 w-full overflow-auto">
                <div className="flex items-center px-2 py-1 border-b">
                  <Search size={14} className="text-orange-600 mr-2" />
                  <input
                    className="flex-1 text-sm focus:outline-none"
                    placeholder="Search vehicles…"
                    value={vehicleQuery}
                    onChange={e => setVehicleQuery(e.target.value)}
                  />
                </div>
                {filteredVehicles.map(v => (
                  <div
                    key={v.id}
                    className="px-3 py-2 hover:bg-orange-50 cursor-pointer text-sm"
                    onClick={() => { setVehicleNumber(v.vehicleNumber); setOpenDropdown(null); }}
                  >
                    <div className="font-medium">{v.vehicleNumber}</div>
                    <div className="text-xs text-gray-600">
                      {[v.vehicleType, v.brand, v.model].filter(Boolean).join(' ')}
                    </div>
                  </div>
                ))}
                {!filteredVehicles.length && <div className="px-3 py-2 text-gray-500 text-sm">No vehicles found</div>}
              </div>
            )}
          </div>

          {/* Driver Dropdown */}
          <div className="relative">
            {L('Driver *')}
            <div
              className="flex items-center border border-orange-200 rounded px-3 py-2 cursor-pointer bg-white"
              onClick={() => setOpenDropdown(openDropdown === 'driver' ? null : 'driver')}
            >
              <User2 size={16} className="text-orange-600 mr-2" />
              <span className="flex-1">{driverName || 'Select driver…'}</span>
              <ChevronDown size={16} className="text-orange-600" />
            </div>
            {openDropdown === 'driver' && (
              <div className="absolute z-50 mt-1 bg-white border rounded shadow max-h-60 w-full overflow-auto">
                <div className="flex items-center px-2 py-1 border-b">
                  <Search size={14} className="text-orange-600 mr-2" />
                  <input
                    className="flex-1 text-sm focus:outline-none"
                    placeholder="Search drivers…"
                    value={driverQuery}
                    onChange={e => setDriverQuery(e.target.value)}
                  />
                </div>
                {filteredDrivers.map(d => (
                  <div
                    key={d.employeeId}
                    className="px-3 py-2 hover:bg-orange-50 cursor-pointer text-sm"
                    onClick={() => { setDriverName(d.name); setDriverPhone(d.phone || ''); setOpenDropdown(null); }}
                  >
                    <div className="font-medium">{d.name}</div>
                    <div className="text-xs text-gray-600">{d.employeeId} • {d.phone || '-'}</div>
                  </div>
                ))}
                {!filteredDrivers.length && <div className="px-3 py-2 text-gray-500 text-sm">No drivers found</div>}
              </div>
            )}
            {driverPhone && <div className="text-xs text-gray-700 mt-1">Phone: {driverPhone}</div>}
          </div>

          {/* Schedule */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              {L('Pickup At *')}
              <input
                type="datetime-local"
                className="w-full border border-orange-200 rounded px-3 py-2"
                value={pickupAt}
                onChange={e => setPickupAt(e.target.value)}
              />
            </div>
            <div>
              {L('Expected Return *')}
              <input
                type="datetime-local"
                className="w-full border border-orange-200 rounded px-3 py-2"
                value={expectedReturnAt}
                onChange={e => setExpectedReturnAt(e.target.value)}
              />
            </div>
          </div>

          {/* Instructions */}
          <div>
            {L('Instructions (optional)')}
            <textarea
              rows={3}
              className="w-full border border-orange-200 rounded px-3 py-2"
              value={instructions}
              onChange={e => setInstructions(e.target.value)}
            />
          </div>

          {err && <div className="text-sm rounded border border-red-300 bg-red-50 text-red-800 px-3 py-2">{err}</div>}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t bg-orange-50 flex justify-end gap-2">
          <button className="px-4 py-2 rounded border" onClick={onClose}>Cancel</button>
          <button
            disabled={!canSubmit || submitting}
            onClick={submit}
            className="px-4 py-2 rounded bg-orange-600 text-white disabled:opacity-60"
          >
            {submitting ? 'Saving…' : 'Assign'}
          </button>
        </div>
      </div>
    </div>
  );
}
