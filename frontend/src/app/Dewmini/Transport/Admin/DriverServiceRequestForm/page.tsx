'use client';

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { X } from 'lucide-react';
import { toast } from 'react-toastify';

type CreateDSR = {
  vehicleNumber: string;
  epf: string;
  driverName?: string;
  requestDate: string;
  servicesNeeded?: string;
  lastServiceReadingKm?: number;
  nextServiceReadingKm?: number;
  currentReadingKm?: number;
  adviceByVehicleOfficer?: string;
  adviceByMechanic?: string;
};

interface Props {
  onClose: () => void;
  onCreated: () => void; // callback to refresh the list
}

export default function DriverServiceRequestForm({ onClose, onCreated }: Props) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateDSR>();

  const [vehicles, setVehicles] = useState<{ vehicleNumber: string }[]>([]);

  // Fetch vehicles on mount
  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const res = await fetch('http://localhost:8081/api/vehicles');
        if (!res.ok) {
          throw new Error('Failed to fetch vehicles');
        }
        const data = await res.json();

        // Ensure data is an array and set the vehicles state
        if (Array.isArray(data)) {
          setVehicles(data);
        } else {
          throw new Error('Fetched data is not an array');
        }
      } catch (error: any) {
        toast.error(`❌ ${error.message}`);
      }
    };

    fetchVehicles();
  }, []);

  const onSubmit = async (data: CreateDSR) => {
    try {
      const payload = {
        ...data,
        servicesNeeded: data.servicesNeeded
          ? data.servicesNeeded.split(',').map((s) => s.trim()).filter(Boolean)
          : [],
      };

      const res = await fetch('http://localhost:8081/api/driver-service-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.text();
        throw new Error(`Server error: ${err}`);
      }

      toast.success('✅ Driver Service Request saved successfully!');
      reset();
      onCreated();
      onClose();
    } catch (error: any) {
      console.error('Error saving request:', error);
      toast.error(`❌ Failed to save: ${error.message}`);
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
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-5"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
            {/* Vehicle Number Dropdown */}
            <div>
              <label className="block text-sm font-medium text-orange-800 mb-1">
                Vehicle Number <span className="text-red-500">*</span>
              </label>
              <select
                {...register('vehicleNumber', { required: 'Vehicle number is required' })}
                className="w-full border border-orange-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-orange-200"
              >
                <option value="">Select a Vehicle</option>
                {vehicles.length > 0 ? (
                  vehicles.map((vehicle, index) => (
                    <option key={index} value={vehicle.vehicleNumber}>
                      {vehicle.vehicleNumber}
                    </option>
                  ))
                ) : (
                  <option value="" disabled>
                    No vehicles available
                  </option>
                )}
              </select>
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
              <label className="block text-sm font-medium text-orange-800 mb-1">
                Driver Name
              </label>
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
              <label className="block text-sm font-medium text-orange-800 mb-1">
                Services Needed
              </label>
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
                {...register('lastServiceReadingKm')}
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
                {...register('nextServiceReadingKm')}
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
                {...register('currentReadingKm')}
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
