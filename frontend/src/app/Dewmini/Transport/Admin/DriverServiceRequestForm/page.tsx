'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { X } from 'lucide-react';
import { toast } from 'react-toastify';

type CreateDSR = {
  vehicleNumber: string;
  epf: string;
  driverName?: string;
  requestDate: string;
  servicesNeeded?: string; // comma-separated in UI; will be transformed to array
  lastServiceReadingKm?: number;
  nextServiceReadingKm?: number;
  currentReadingKm?: number;
  adviceByVehicleOfficer?: string;
  adviceByMechanic?: string;
};

type Vehicle = {
  id?: number;
  vehicleNumber: string;
  [k: string]: unknown;
};

interface Props {
  onClose?: () => void;
  onCreated?: () => void; // callback to refresh the list
}

const rawBase =
  (process.env.NEXT_PUBLIC_TRANSPORT_BASE || process.env.NEXT_PUBLIC_API_BASE_URL || '').replace(
    /\/+$/,
    ''
  );
const API_BASE = rawBase ? `${rawBase}/api` : '/tapi';

export default function DriverServiceRequestForm({
  onClose = () => {},
  onCreated = () => {},
}: Props) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateDSR>();

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vehLoading, setVehLoading] = useState<boolean>(false);
  const [vehError, setVehError] = useState<string | null>(null);

  // --- Fetch vehicles on mount (ignores AbortError; safe in Strict Mode) ---
  useEffect(() => {
    const ctrl = new AbortController();
    let isMounted = true;

    const fetchVehicles = async () => {
      if (!isMounted) return;
      setVehLoading(true);
      setVehError(null);
      try {
        const res = await fetch(`${API_BASE}/vehicles`, { signal: ctrl.signal });
        if (!res.ok) {
          const body = await res.text().catch(() => '');
          throw new Error(`Failed to fetch vehicles (${res.status}) ${body || ''}`.trim());
        }
        const raw = await res.json();

        // Normalize response to an array (supports { ok, data: { content: [] } })
        let list: unknown = raw;
        if (!Array.isArray(list)) {
          const data = (raw as any)?.data;
          if (Array.isArray(data?.content)) list = data.content; // ✅ your shape
          else if (Array.isArray(data)) list = data;
          else if (Array.isArray((raw as any)?.vehicles)) list = (raw as any).vehicles;
          else if (Array.isArray((raw as any)?.items)) list = (raw as any).items;
          else if (Array.isArray((raw as any)?.results)) list = (raw as any).results;
          else if (Array.isArray((raw as any)?.data)) list = (raw as any).data;
        }
        if (!Array.isArray(list)) throw new Error('Vehicles response was not an array.');

        const cleaned = (list as any[]).filter(
          (v) => v && typeof v.vehicleNumber === 'string' && v.vehicleNumber.trim() !== ''
        );

        if (!isMounted) return;
        setVehicles(cleaned);
      } catch (err: any) {
        const isAbort = err?.name === 'AbortError' || /aborted/i.test(err?.message || '');
        if (isAbort) return; // ignore aborts
        const msg = err?.message || 'Unknown error loading vehicles';
        if (!isMounted) return;
        setVehError(msg);
        toast.error(`❌ ${msg}`);
      } finally {
        if (!isMounted) return;
        setVehLoading(false);
      }
    };

    fetchVehicles();
    return () => {
      isMounted = false;
      ctrl.abort();
    };
  }, []);

  const noVehicles = useMemo(() => !vehLoading && vehicles.length === 0, [vehLoading, vehicles]);

  // --- Submit handler ---
  const onSubmit = async (data: CreateDSR) => {
    try {
      // Ensure selected vehicle exists in the loaded list
      const exists = vehicles.some((v) => v.vehicleNumber === data.vehicleNumber);
      if (!exists) {
        toast.error('❌ Selected vehicle is not in the database.');
        return;
      }

      // Transform servicesNeeded string -> array
      const servicesArray =
        data.servicesNeeded
          ?.split(',')
          .map((s) => s.trim())
          .filter(Boolean) ?? [];

      const payload = {
        ...data,
        servicesNeeded: servicesArray,
      };

      const res = await fetch(`${API_BASE}/driver-service-requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        let errText = '';
        try {
          const asJson = await res.json();
          errText = asJson?.message || JSON.stringify(asJson);
        } catch {
          errText = await res.text();
        }
        throw new Error(errText || `Server returned ${res.status}`);
      }

      toast.success('✅ Driver Service Request saved successfully!');
      reset();
      onCreated(); // refresh parent list (safe: default no-op)
      onClose();   // close modal (safe: default no-op)
    } catch (error: any) {
      console.error('Error saving request:', error);
      toast.error(`❌ Failed to save: ${error?.message || 'Unknown error'}`);
    }
  };

  return (
    <div className="fixed inset-0 bg-white flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-none sm:rounded-xl shadow-xl w-full h-full sm:h-auto sm:max-h-[90vh] sm:w-[min(100%,48rem)] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b bg-orange-50">
          <h2 className="text-base sm:text-lg md:text-xl font-bold text-orange-900">
            Add Driver Service Request
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-orange-100 text-orange-600 transition-colors"
            aria-label="Close"
            type="button"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
            {/* Vehicle Number Dropdown */}
            <div>
              <label className="block text-sm font-medium text-orange-800 mb-1">
                Vehicle Number <span className="text-red-500">*</span>
              </label>
              <select
                {...register('vehicleNumber', { required: 'Vehicle number is required' })}
                className="w-full border border-orange-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-orange-200 disabled:opacity-60"
                disabled={vehLoading || noVehicles}
                defaultValue=""
              >
                <option value="" disabled>
                  {vehLoading ? 'Loading vehicles...' : noVehicles ? 'No vehicles available' : 'Select a Vehicle'}
                </option>
                {vehicles.map((vehicle, index) => (
                  <option key={vehicle.id ?? vehicle.vehicleNumber ?? index} value={vehicle.vehicleNumber}>
                    {vehicle.vehicleNumber}
                  </option>
                ))}
              </select>
              {vehError && <p className="text-red-500 text-xs mt-1">{vehError}</p>}
              {errors.vehicleNumber && (
                <p className="text-red-500 text-xs mt-1">{errors.vehicleNumber.message}</p>
              )}
            </div>

            {/* EPF */}
            <div>
              <label className="block text-sm font-medium text-orange-800 mb-1">
                EPF <span className="text-red-500">*</span>
              </label>
              <input
                {...register('epf', { required: 'EPF is required' })}
                className="w-full border border-orange-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-orange-200"
                placeholder="e.g., EMP123"
              />
              {errors.epf && <p className="text-red-500 text-xs mt-1">{errors.epf.message}</p>}
            </div>

            {/* Driver Name */}
            <div>
              <label className="block text-sm font-medium text-orange-800 mb-1">Driver Name</label>
              <input
                {...register('driverName')}
                className="w-full border border-orange-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-orange-200"
                placeholder="e.g., John Silva"
              />
            </div>

            {/* Request Date */}
            <div>
              <label className="block text-sm font-medium text-orange-800 mb-1">
                Request Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                {...register('requestDate', { required: 'Request date is required' })}
                className="w-full border border-orange-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-orange-200"
              />
              {errors.requestDate && (
                <p className="text-red-500 text-xs mt-1">{errors.requestDate.message}</p>
              )}
            </div>

            {/* Services Needed */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-orange-800 mb-1">Services Needed</label>
              <input
                {...register('servicesNeeded')}
                className="w-full border border-orange-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-orange-200"
                placeholder="Comma separated e.g., Oil filter, Tyre check"
              />
            </div>

            {/* Readings */}
            <div>
              <label className="block text-sm font-medium text-orange-800 mb-1">
                Last Service Reading (Km)
              </label>
              <input
                type="number"
                inputMode="numeric"
                {...register('lastServiceReadingKm', { valueAsNumber: true })}
                className="w-full border border-orange-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-orange-200"
                placeholder="e.g., 15000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-orange-800 mb-1">
                Next Service Reading (Km)
              </label>
              <input
                type="number"
                inputMode="numeric"
                {...register('nextServiceReadingKm', { valueAsNumber: true })}
                className="w-full border border-orange-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-orange-200"
                placeholder="e.g., 20000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-orange-800 mb-1">
                Current Reading (Km)
              </label>
              <input
                type="number"
                inputMode="numeric"
                {...register('currentReadingKm', { valueAsNumber: true })}
                className="w-full border border-orange-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-orange-200"
                placeholder="e.g., 19850"
              />
            </div>

            {/* Advice fields */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-orange-800 mb-1">
                Advice by Vehicle Officer
              </label>
              <textarea
                {...register('adviceByVehicleOfficer')}
                rows={2}
                className="w-full border border-orange-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-orange-200"
                placeholder="Enter advice"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-orange-800 mb-1">
                Advice by Mechanic
              </label>
              <textarea
                {...register('adviceByMechanic')}
                rows={2}
                className="w-full border border-orange-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-orange-200"
                placeholder="Enter mechanic advice"
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-2 pt-4 border-t border-orange-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm rounded-lg bg-gray-100 hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm rounded-lg bg-orange-600 text-white hover:bg-orange-700 disabled:opacity-60"
            >
              {isSubmitting ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
