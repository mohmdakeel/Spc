'use client';

import React from 'react';
import { X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import type { Driver } from '../services/types';

interface Props {
  driver?: Driver | null;
  onSubmit: (data: Partial<Driver>) => void;
  onClose: () => void;
}

const STATUS = ['ACTIVE', 'INACTIVE', 'SUSPENDED'] as const;
const toDateInput = (s?: string | null) => (s ? s.toString().slice(0, 10) : '');

export default function DriverForm({ driver, onSubmit, onClose }: Props) {
  const { register, handleSubmit, formState: { errors }, reset } = useForm<Partial<Driver>>({
    defaultValues: {
      employeeId: driver?.employeeId ?? '',
      name: driver?.name ?? '',
      phone: driver?.phone ?? '',
      email: driver?.email ?? '',
      licenseNumber: driver?.licenseNumber ?? '',
      licenseExpiryDate: driver?.licenseExpiryDate ? toDateInput(driver.licenseExpiryDate as any) : '',
      drivingExperience: driver?.drivingExperience ?? undefined,
      status: driver?.status ?? 'ACTIVE',
    },
  });

  const onSubmitForm = async (data: Partial<Driver>) => {
    // normalize number fields coming from inputs
    const drivingExperience =
      data.drivingExperience === undefined || data.drivingExperience === null ||
      data.drivingExperience?.toString().trim() === ''
        ? undefined
        : Number(data.drivingExperience);

    await onSubmit({
      employeeId: data.employeeId?.trim(),
      name: data.name?.trim(),
      phone: data.phone?.trim(),
      email: data.email?.trim(),
      licenseNumber: data.licenseNumber?.trim(),
      licenseExpiryDate: data.licenseExpiryDate || undefined,
      drivingExperience,
      status: (data.status as any) ?? 'ACTIVE',
    });

    reset();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-orange-50 rounded-xl shadow-xl w-full max-w-3xl overflow-hidden border border-orange-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-orange-200 bg-orange-100">
          <h2 className="text-xl font-bold text-orange-900">{driver ? 'Edit Driver' : 'Add Driver'}</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-orange-200 text-orange-700 transition-all"
            aria-label="Close"
            title="Close"
          >
            <X size={22} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmitForm)} className="px-6 py-5 bg-white">
          <p className="text-sm text-orange-700 mb-5">
            Fields marked with <span className="text-red-600 font-semibold">*</span> are required.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Left Column */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-orange-800 mb-2">
                  Employee ID <span className="text-red-600">*</span>
                </label>
                <input
                  className={`w-full px-4 py-2.5 rounded-lg border focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all ${
                    errors.employeeId ? 'border-red-500' : 'border-orange-200'
                  }`}
                  {...register('employeeId', { required: 'Employee ID is required' })}
                  placeholder="E.g., EMP-1001"
                />
                {errors.employeeId && (
                  <p className="text-xs text-red-600 mt-1">{String(errors.employeeId.message)}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-orange-800 mb-2">
                  Name <span className="text-red-600">*</span>
                </label>
                <input
                  className={`w-full px-4 py-2.5 rounded-lg border focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all ${
                    errors.name ? 'border-red-500' : 'border-orange-200'
                  }`}
                  {...register('name', { required: 'Name is required' })}
                  placeholder="Full name"
                />
                {errors.name && (
                  <p className="text-xs text-red-600 mt-1">{String(errors.name.message)}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-orange-800 mb-2">Phone</label>
                <input
                  className="w-full px-4 py-2.5 rounded-lg border border-orange-200 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all"
                  {...register('phone')}
                  placeholder="Phone number"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-orange-800 mb-2">Email</label>
                <input
                  type="email"
                  className="w-full px-4 py-2.5 rounded-lg border border-orange-200 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all"
                  {...register('email')}
                  placeholder="email@example.com"
                />
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-orange-800 mb-2">License Number</label>
                <input
                  className="w-full px-4 py-2.5 rounded-lg border border-orange-200 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all"
                  {...register('licenseNumber')}
                  placeholder="License number"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-orange-800 mb-2">License Expiry Date</label>
                <input
                  type="date"
                  className="w-full px-4 py-2.5 rounded-lg border border-orange-200 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all"
                  {...register('licenseExpiryDate')}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-orange-800 mb-2">Driving Experience (years)</label>
                <input
                  type="number"
                  className={`w-full px-4 py-2.5 rounded-lg border focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all ${
                    errors.drivingExperience ? 'border-red-500' : 'border-orange-200'
                  }`}
                  {...register('drivingExperience', {
                    min: { value: 0, message: 'Experience cannot be negative' },
                    validate: (v) => {
                      if (v === undefined || v === null || v.toString().trim() === '') return true;
                      return !isNaN(Number(v)) || 'Enter a valid number';
                    },
                  })}
                  placeholder="Years of experience"
                />
                {errors.drivingExperience && (
                  <p className="text-xs text-red-600 mt-1">{String(errors.drivingExperience.message)}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-orange-800 mb-2">Status</label>
                <select
                  className="w-full px-4 py-2.5 rounded-lg border border-orange-200 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all bg-white"
                  {...register('status')}
                >
                  {STATUS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-orange-200 bg-orange-100 mt-6 -mx-6 -mb-5 flex justify-end gap-3">
            <button
              className="px-5 py-2.5 rounded-lg bg-orange-200 text-orange-800 hover:bg-orange-300 transition-all font-semibold"
              type="button"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              className="px-5 py-2.5 rounded-lg bg-orange-600 text-white hover:bg-orange-700 transition-all font-semibold shadow-md hover:shadow-lg"
              type="submit"
            >
              {driver ? 'Update Driver' : 'Add Driver'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}