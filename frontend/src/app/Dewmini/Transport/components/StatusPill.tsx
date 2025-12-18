'use client';
import React from 'react';
import { ChevronDown } from 'lucide-react';
import type { DriverStatus, VehicleStatus } from '../services/types';

type AnyStatus = DriverStatus | VehicleStatus;
type Mode = 'driver' | 'vehicle';

interface Props {
  value?: AnyStatus | null;
  mode: Mode;
  editable?: boolean;
  onChange?: (val: AnyStatus) => void;
  className?: string;
}

const DRIVER_OPTIONS: DriverStatus[] = ['ACTIVE', 'INACTIVE', 'SUSPENDED'];
const VEHICLE_OPTIONS: VehicleStatus[] = ['AVAILABLE', 'IN_SERVICE', 'UNDER_REPAIR', 'RETIRED'];

const colorOf = (v: AnyStatus | '') => {
  switch (v) {
    case 'ACTIVE':
    case 'AVAILABLE': return 'bg-green-100 text-green-800 border-green-200';
    case 'INACTIVE':
    case 'RETIRED': return 'bg-gray-100 text-gray-700 border-gray-200';
    case 'SUSPENDED':
    case 'UNDER_REPAIR': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'IN_SERVICE': return 'bg-orange-100 text-orange-800 border-orange-200';
    default: return 'bg-orange-100 text-orange-800 border-orange-200';
  }
};

const label = (v: AnyStatus | '') => {
  switch (v) {
    case 'ACTIVE': return 'Active';
    case 'INACTIVE': return 'Inactive';
    case 'SUSPENDED': return 'Suspended';
    case 'AVAILABLE': return 'Available';
    case 'IN_SERVICE': return 'In Service';
    case 'UNDER_REPAIR': return 'Under Repair';
    case 'RETIRED': return 'Retired';
    default: return v || '-';
  }
};

export default function StatusPill({ value, mode, editable, onChange, className = '' }: Props) {
  const v = (value || '').toString() as AnyStatus;
  const color = colorOf(v);
  const options = mode === 'driver' ? DRIVER_OPTIONS : VEHICLE_OPTIONS;

  if (editable && onChange) {
    return (
      <div className={`relative inline-block ${className}`}>
        <select
          className={`px-2.5 py-1 text-[11px] md:text-xs leading-none rounded-full font-semibold border whitespace-nowrap ${color} appearance-none pr-7 cursor-pointer transition-all hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-400`}
          value={v || ''}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => onChange(e.target.value as AnyStatus)}
        >
          <option value="">Select Status</option>
          {options.map((s) => (<option key={s} value={s}>{label(s)}</option>))}
        </select>
        <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-current"/>
      </div>
    );
  }
  return (
    <span className={`px-2.5 py-1 text-[11px] md:text-xs leading-none rounded-full font-semibold border whitespace-nowrap ${color} ${className}`}>
      {label(v)}
    </span>
  );
}
