'use client';

import React from 'react';
import { X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import type { Vehicle, VehicleStatus } from '../services/types';

interface Props {
  vehicle?: Vehicle | null;
  onSubmit: (vehicle: Partial<Vehicle>) => void;
  onClose: () => void;
}

const STATUS: VehicleStatus[] = ['AVAILABLE', 'IN_SERVICE', 'UNDER_REPAIR', 'RETIRED'];

function buildVehiclePayload(data: Partial<Vehicle>): Partial<Vehicle> {
  return {
    vehicleNumber: data.vehicleNumber?.trim() || undefined,
    vehicleType: data.vehicleType?.trim() || undefined,
    brand: data.brand?.trim() || undefined,
    model: data.model?.trim() || undefined,
    chassisNumber: data.chassisNumber?.trim() || undefined,
    engineNumber: data.engineNumber?.trim() || undefined,
    manufactureDate: data.manufactureDate || undefined,
    totalKmDriven:
      data.totalKmDriven != null && (data.totalKmDriven as any) !== ''
        ? Number(data.totalKmDriven)
        : undefined,
    fuelEfficiency:
      data.fuelEfficiency != null && (data.fuelEfficiency as any) !== ''
        ? Number(data.fuelEfficiency)
        : undefined,
    presentCondition: data.presentCondition?.trim() || undefined,
    status: (data.status as VehicleStatus) ?? 'AVAILABLE',
  };
}

const toDateInput = (s?: string | null) => (s ? s.slice(0, 10) : '');

export default function VehicleForm({ vehicle, onSubmit, onClose }: Props) {
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<Partial<Vehicle>>({
    defaultValues: {
      vehicleNumber: vehicle?.vehicleNumber ?? '',
      vehicleType: vehicle?.vehicleType ?? '',
      brand: vehicle?.brand ?? '',
      model: vehicle?.model ?? '',
      chassisNumber: vehicle?.chassisNumber ?? '',
      engineNumber: vehicle?.engineNumber ?? '',
      manufactureDate: vehicle?.manufactureDate ? toDateInput(vehicle.manufactureDate) : '',
      totalKmDriven: vehicle?.totalKmDriven ?? undefined,
      fuelEfficiency: vehicle?.fuelEfficiency ?? undefined,
      presentCondition: vehicle?.presentCondition ?? '',
      status: vehicle?.status ?? 'AVAILABLE',
    },
  });

  const onSubmitForm = async (formData: Partial<Vehicle>) => {
    const payload = buildVehiclePayload(formData);
    if (!payload.vehicleNumber) throw new Error('Vehicle number is required');
    if (!payload.vehicleType) throw new Error('Vehicle type is required');
    await onSubmit(payload);
    reset(); onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-orange-50">
          <h2 className="text-lg md:text-xl font-bold text-orange-900">
            {vehicle ? 'Edit Vehicle' : 'Add New Vehicle'}
          </h2>
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

        {/* Form Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <p className="text-xs text-orange-600 mb-4 bg-orange-50 p-3 rounded-lg border border-orange-100">
            Fields marked with <span className="text-red-500">*</span> are required.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Left Column */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-orange-800 mb-1">
                  Vehicle Number <span className="text-red-500">*</span>
                </label>
                <input
                  className={`w-full border rounded-lg px-4 py-2.5 text-sm transition-colors
                    ${errors.vehicleNumber ? 'border-red-500 focus:border-red-500' : 'border-orange-200 focus:border-orange-500'}
                    focus:outline-none focus:ring-2 focus:ring-orange-200`}
                  {...register('vehicleNumber', { 
                    required: 'Vehicle number is required', 
                    minLength: { value: 3, message: 'Minimum 3 characters' } 
                  })}
                  placeholder="Enter vehicle number"
                />
                {errors.vehicleNumber && (
                  <p className="text-red-500 text-xs mt-1">{errors.vehicleNumber.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-orange-800 mb-1">
                  Vehicle Type <span className="text-red-500">*</span>
                </label>
                <input
                  className={`w-full border rounded-lg px-4 py-2.5 text-sm transition-colors
                    ${errors.vehicleType ? 'border-red-500 focus:border-red-500' : 'border-orange-200 focus:border-orange-500'}
                    focus:outline-none focus:ring-2 focus:ring-orange-200`}
                  {...register('vehicleType', { required: 'Vehicle type is required' })}
                  placeholder="e.g., Truck, Bus, Car"
                />
                {errors.vehicleType && (
                  <p className="text-red-500 text-xs mt-1">{errors.vehicleType.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-orange-800 mb-1">Brand</label>
                <input
                  className="w-full border border-orange-200 rounded-lg px-4 py-2.5 text-sm 
                    focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200 transition-colors"
                  {...register('brand')}
                  placeholder="Enter brand name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-orange-800 mb-1">Model</label>
                <input
                  className="w-full border border-orange-200 rounded-lg px-4 py-2.5 text-sm 
                    focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200 transition-colors"
                  {...register('model')}
                  placeholder="Enter model name"
                />
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-orange-800 mb-1">Chassis Number</label>
                <input
                  className="w-full border border-orange-200 rounded-lg px-4 py-2.5 text-sm 
                    focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200 transition-colors"
                  {...register('chassisNumber')}
                  placeholder="Enter chassis number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-orange-800 mb-1">Engine Number</label>
                <input
                  className="w-full border border-orange-200 rounded-lg px-4 py-2.5 text-sm 
                    focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200 transition-colors"
                  {...register('engineNumber')}
                  placeholder="Enter engine number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-orange-800 mb-1">Manufacture Date</label>
                <input 
                  type="date" 
                  className="w-full border border-orange-200 rounded-lg px-4 py-2.5 text-sm 
                    focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200 transition-colors"
                  {...register('manufactureDate')}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-orange-800 mb-1">Total KM Driven</label>
                  <input 
                    type="number" 
                    className="w-full border border-orange-200 rounded-lg px-4 py-2.5 text-sm 
                      focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200 transition-colors"
                    {...register('totalKmDriven')}
                    placeholder="0"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-orange-800 mb-1">Fuel Efficiency</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    className="w-full border border-orange-200 rounded-lg px-4 py-2.5 text-sm 
                      focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200 transition-colors"
                    {...register('fuelEfficiency')}
                    placeholder="0.0"
                    min="0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-orange-800 mb-1">Condition</label>
                <input
                  className="w-full border border-orange-200 rounded-lg px-4 py-2.5 text-sm 
                    focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200 transition-colors"
                  {...register('presentCondition')}
                  placeholder="Describe vehicle condition"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-orange-800 mb-1">Status</label>
                <select 
                  className="w-full border border-orange-200 rounded-lg px-4 py-2.5 text-sm 
                    focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200 transition-colors"
                  {...register('status')}
                >
                  {STATUS.map((s) => (
                    <option key={s} value={s} className="capitalize">
                      {s.toLowerCase().replace('_', ' ')}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-orange-50 flex justify-end gap-3">
          <button 
            type="button" 
            onClick={onClose}
            className="px-5 py-2.5 rounded-lg bg-white border border-orange-300 text-orange-700 
              hover:bg-orange-50 transition-colors text-sm font-medium"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            onClick={handleSubmit(onSubmitForm)}
            disabled={isSubmitting}
            className="px-5 py-2.5 rounded-lg bg-orange-600 text-white hover:bg-orange-700 
              disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium
              flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                {vehicle ? 'Updating...' : 'Adding...'}
              </>
            ) : (
              <>
                {vehicle ? 'Update Vehicle' : 'Add Vehicle'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}