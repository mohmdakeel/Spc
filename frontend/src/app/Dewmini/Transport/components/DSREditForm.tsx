'use client';
import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';

type HrApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

type DSRResponse = {
  id: number;
  vehicleId: number;
  vehicleNumber: string;
  driverName?: string;
  epf: string;
  requestDate: string; // yyyy-MM-dd or ISO
  servicesNeeded?: string[];
  lastServiceReadingKm?: number;
  nextServiceReadingKm?: number;
  currentReadingKm?: number;
  adviceByVehicleOfficer?: string;
  adviceByMechanic?: string;
  hrApproval: HrApprovalStatus;
  createdAt?: string;
  updatedAt?: string;
};

type EditForm = {
  // Read-only display
  vehicleNumber: string;
  epf: string;
  driverName?: string;
  requestDate: string;

  // Editable:
  servicesNeededText?: string; // UI comma string, convert to array
  lastServiceReadingKm?: number;
  nextServiceReadingKm?: number;
  currentReadingKm?: number;
  adviceByVehicleOfficer?: string;
  adviceByMechanic?: string;
  hrApproval: HrApprovalStatus;
};

const HR_STATUS: HrApprovalStatus[] = ['PENDING', 'APPROVED', 'REJECTED'];

const rawBase =
  (process.env.NEXT_PUBLIC_TRANSPORT_BASE || process.env.NEXT_PUBLIC_API_BASE_URL || '').replace(
    /\/+$/,
    ''
  );
const API_BASE = rawBase ? `${rawBase}/api` : '/tapi';

interface Props {
  id: number;
  onClose: () => void;
  onUpdated: () => void;
}

export default function DSREditForm({ id, onClose, onUpdated }: Props) {
  const [loading, setLoading] = useState(true);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<EditForm>({
    defaultValues: {
      vehicleNumber: '',
      epf: '',
      driverName: '',
      requestDate: '',
      servicesNeededText: '',
      lastServiceReadingKm: undefined,
      nextServiceReadingKm: undefined,
      currentReadingKm: undefined,
      adviceByVehicleOfficer: '',
      adviceByMechanic: '',
      hrApproval: 'PENDING',
    },
  });

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/driver-service-requests/${id}`, { cache: 'no-store' });
        if (!res.ok) throw new Error('Failed to fetch request');
        const json = await res.json();
        const r: DSRResponse = json?.data as DSRResponse;

        const safeDate =
          r.requestDate && r.requestDate.length >= 10 ? r.requestDate.slice(0, 10) : r.requestDate ?? '';

        reset({
          vehicleNumber: r.vehicleNumber ?? '',
          epf: r.epf ?? '',
          driverName: r.driverName ?? '',
          requestDate: safeDate,
          servicesNeededText: r.servicesNeeded?.join(', ') ?? '',
          lastServiceReadingKm: r.lastServiceReadingKm ?? undefined,
          nextServiceReadingKm: r.nextServiceReadingKm ?? undefined,
          currentReadingKm: r.currentReadingKm ?? undefined,
          adviceByVehicleOfficer: r.adviceByVehicleOfficer ?? '',
          adviceByMechanic: r.adviceByMechanic ?? '',
          hrApproval: r.hrApproval ?? 'PENDING',
        });
      } catch (e: any) {
        toast.error(e?.message || 'Failed to load request');
        onClose();
      } finally {
        setLoading(false);
      }
    })();
  }, [id, onClose, reset]);

  const onSubmit = async (data: EditForm) => {
    try {
      // Only fields allowed by UpdateRequest (backend) are sent
      const payload = {
        servicesNeeded: data.servicesNeededText
          ? data.servicesNeededText.split(',').map(s => s.trim()).filter(Boolean)
          : [],
        lastServiceReadingKm:
          data.lastServiceReadingKm !== undefined &&
          data.lastServiceReadingKm !== null &&
          (data.lastServiceReadingKm as any) !== ''
            ? Number(data.lastServiceReadingKm)
            : undefined,
        nextServiceReadingKm:
          data.nextServiceReadingKm !== undefined &&
          data.nextServiceReadingKm !== null &&
          (data.nextServiceReadingKm as any) !== ''
            ? Number(data.nextServiceReadingKm)
            : undefined,
        currentReadingKm:
          data.currentReadingKm !== undefined &&
          data.currentReadingKm !== null &&
          (data.currentReadingKm as any) !== ''
            ? Number(data.currentReadingKm)
            : undefined,
        adviceByVehicleOfficer: data.adviceByVehicleOfficer?.trim() || undefined,
        adviceByMechanic: data.adviceByMechanic?.trim() || undefined,
        hrApproval: data.hrApproval,
      };

      const res = await fetch(`${API_BASE}/driver-service-requests/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || 'Failed to update');
      }

      toast.success('✅ Driver Service Request updated');
      onUpdated();
      onClose();
    } catch (e: any) {
      toast.error(`❌ ${e?.message || 'Failed to update'}`);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-none sm:rounded-xl shadow-xl w-full h-full sm:h-auto sm:max-h-[90vh] sm:w-[min(100%,48rem)] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b bg-orange-50">
          <h2 className="text-base sm:text-lg md:text-xl font-bold text-orange-900">Edit Driver Service Request</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-orange-100 text-orange-600 transition-colors"
            aria-label="Close"
            title="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-5">
          {loading ? (
            <div className="text-center py-10 text-gray-500">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mb-3" />
              Loading...
            </div>
          ) : (
            <>
              <p className="text-xs text-orange-600 mb-3 sm:mb-4 bg-orange-50 p-2.5 sm:p-3 rounded-lg border border-orange-100">
                Fields like Vehicle, EPF, Driver, and Request Date are immutable here.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
                {/* Left (read-only) */}
                <div className="space-y-3 md:space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-orange-800 mb-1">Vehicle Number</label>
                    <input
                      disabled
                      className="w-full bg-gray-50 border border-orange-200 rounded-lg px-3 sm:px-4 py-2.5 text-sm"
                      {...register('vehicleNumber')}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-orange-800 mb-1">EPF</label>
                    <input
                      disabled
                      className="w-full bg-gray-50 border border-orange-200 rounded-lg px-3 sm:px-4 py-2.5 text-sm"
                      {...register('epf')}
                    />
                  </div>
                </div>

                <div className="space-y-3 md:space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-orange-800 mb-1">Driver Name</label>
                    <input
                      disabled
                      className="w-full bg-gray-50 border border-orange-200 rounded-lg px-3 sm:px-4 py-2.5 text-sm"
                      {...register('driverName')}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-orange-800 mb-1">Request Date</label>
                    <input
                      disabled
                      className="w-full bg-gray-50 border border-orange-200 rounded-lg px-3 sm:px-4 py-2.5 text-sm"
                      {...register('requestDate')}
                    />
                  </div>
                </div>

                {/* Editable */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-orange-800 mb-1">Services Needed</label>
                  <input
                    className="w-full border border-orange-200 rounded-lg px-3 sm:px-4 py-2.5 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200 transition-colors"
                    {...register('servicesNeededText')}
                    placeholder="Comma separated e.g., Oil filter change, Brake inspection"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-orange-800 mb-1">Last Service Reading (Km)</label>
                  <input
                    type="number"
                    className="w-full border border-orange-200 rounded-lg px-3 sm:px-4 py-2.5 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200 transition-colors"
                    {...register('lastServiceReadingKm')}
                    placeholder="15000"
                    min={0}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-orange-800 mb-1">Next Service Reading (Km)</label>
                  <input
                    type="number"
                    className="w-full border border-orange-200 rounded-lg px-3 sm:px-4 py-2.5 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200 transition-colors"
                    {...register('nextServiceReadingKm')}
                    placeholder="20000"
                    min={0}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-orange-800 mb-1">Current Reading (Km)</label>
                  <input
                    type="number"
                    className="w-full border border-orange-200 rounded-lg px-3 sm:px-4 py-2.5 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200 transition-colors"
                    {...register('currentReadingKm')}
                    placeholder="19850"
                    min={0}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-orange-800 mb-1">Advice by Vehicle Officer</label>
                  <textarea
                    rows={2}
                    className="w-full border border-orange-200 rounded-lg px-3 sm:px-4 py-2.5 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200 transition-colors"
                    {...register('adviceByVehicleOfficer')}
                    placeholder="Enter advice"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-orange-800 mb-1">Advice by Mechanic</label>
                  <textarea
                    rows={2}
                    className="w-full border border-orange-200 rounded-lg px-3 sm:px-4 py-2.5 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200 transition-colors"
                    {...register('adviceByMechanic')}
                    placeholder="Enter mechanic advice"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-orange-800 mb-1">HR Approval</label>
                  <select
                    className={`w-full border rounded-lg px-3 sm:px-4 py-2.5 text-sm transition-colors ${
                      errors.hrApproval ? 'border-red-500 focus:border-red-500' : 'border-orange-200 focus:border-orange-500'
                    } focus:outline-none focus:ring-2 focus:ring-orange-200`}
                    {...register('hrApproval', { required: 'HR approval is required' })}
                  >
                    {HR_STATUS.map(s => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  {errors.hrApproval && <p className="text-red-500 text-xs mt-1">{errors.hrApproval.message}</p>}
                </div>
              </div>
            </>
          )}
        </form>

        {/* Footer */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-t bg-orange-50 flex flex-col sm:flex-row gap-2 sm:gap-3 sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-white border border-orange-300 text-orange-700 hover:bg-orange-50 transition-colors text-sm font-medium"
          >
            Cancel
          </button>
          <button
            formAction=""
            onClick={handleSubmit(onSubmit)}
            disabled={isSubmitting || loading}
            className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-orange-600 text-white hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                Updating...
              </>
            ) : (
              <>Update</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
