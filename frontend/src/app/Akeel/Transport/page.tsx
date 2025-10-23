// frontend/src/app/Akeel/Transport/page.tsx
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Truck, User, History, Calendar, MapPin, Settings, Gauge } from 'lucide-react';
import { toast } from 'react-toastify';

import { useAuth } from '../../../../hooks/useAuth';
import { fetchVehicles } from './services/VehicleService';
import { fetchDrivers } from './services/driverService';
import type { Vehicle, Driver } from './services/types';

export default function TransportHome() {
  const { user, can, hasRole } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);

  const isAdmin = hasRole(['ADMIN']);
  const isTAdmin = hasRole(['TRANSPORT_ADMIN']);
  const isTransport = hasRole(['TRANSPORT']);

  const canCreate = can(['CREATE']);
  const canUpdate = can(['UPDATE']);
  const canPrint  = can(['PRINT']);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [vActive, dActive] = await Promise.all([fetchVehicles(), fetchDrivers()]);
        setVehicles(Array.isArray(vActive) ? vActive : []);
        setDrivers(Array.isArray(dActive) ? dActive : []);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Failed to load dashboard data');
        setVehicles([]);
        setDrivers([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const totalVehicles = vehicles.length;
  const totalDrivers  = drivers.length;

  const availableVehicles = useMemo(
    () => vehicles.filter(v => v.status === 'AVAILABLE').length,
    [vehicles]
  );
  const activeDrivers = useMemo(
    () => drivers.filter(d => d.status === 'ACTIVE').length,
    [drivers]
  );

  const cards = [
    {
      key: 'vehicles',
      title: 'Manage Vehicles',
      description: (canCreate || canUpdate) ? 'View, add, or edit vehicle records' : 'View vehicle records (read-only)',
      link: '/Akeel/Transport/Vehicle',
      icon: <Truck size={32} className="text-orange-600" />,
      show: isAdmin || isTAdmin || isTransport,
    },
    {
      key: 'drivers',
      title: 'Manage Drivers',
      description: (canCreate || canUpdate) ? 'View, add, or edit driver records' : 'View driver records (read-only)',
      link: '/Akeel/Transport/Driver',
      icon: <User size={32} className="text-orange-600" />,
      show: isAdmin || isTAdmin || isTransport,
    },
    {
      key: 'history',
      title: 'Change History',
      description: 'View audit logs and change history',
      link: '/Akeel/Transport/History',
      icon: <History size={32} className="text-orange-600" />,
      show: canPrint,
    },
    {
      key: 'scheduling',
      title: 'Scheduling',
      description: 'Manage vehicle schedules and assignments',
      link: '/Akeel/Transport/Scheduling',
      icon: <Calendar size={32} className="text-orange-600" />,
      show: isAdmin || isTAdmin || canCreate,
    },
    {
      key: 'tracking',
      title: 'GPS Tracking',
      description: 'Track vehicle locations in real-time',
      link: '/Akeel/Transport/Tracking',
      icon: <MapPin size={32} className="text-orange-600" />,
      show: isAdmin || isTAdmin || isTransport,
    },
    {
      key: 'settings',
      title: 'Settings',
      description: 'Configure transport management settings',
      link: '/Akeel/Transport/Settings',
      icon: <Settings size={32} className="text-orange-600" />,
      show: isAdmin || isTAdmin,
    },
  ].filter(c => c.show);

  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-1">Transport Management Dashboard</h1>
            <p className="text-gray-600">
              Manage all transport operations from a single dashboard
            </p>
          </div>
          {user && (
            <div className="text-sm text-gray-500">
              {(user.fullName || user.username) ?? 'User'} <span className="text-gray-400">•</span> {user.roles?.join(', ')}
            </div>
          )}
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          <div className="rounded-lg border border-orange-200 bg-orange-50 p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Total Vehicles</span>
              <Truck size={18} className="text-orange-600" />
            </div>
            <div className="mt-2 text-3xl font-bold text-gray-800">
              {loading ? '—' : totalVehicles}
            </div>
            <div className="text-xs text-gray-500 mt-1">Active (non-deleted) vehicles</div>
          </div>

          <div className="rounded-lg border border-green-200 bg-green-50 p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Available Vehicles</span>
              <Gauge size={18} className="text-green-600" />
            </div>
            <div className="mt-2 text-3xl font-bold text-gray-800">
              {loading ? '—' : availableVehicles}
            </div>
            <div className="text-xs text-gray-500 mt-1">Status = AVAILABLE</div>
          </div>

          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Total Drivers</span>
              <User size={18} className="text-blue-600" />
            </div>
            <div className="mt-2 text-3xl font-bold text-gray-800">
              {loading ? '—' : totalDrivers}
            </div>
            <div className="text-xs text-gray-500 mt-1">Active (non-deleted) drivers</div>
          </div>

          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Available Drivers</span>
              <User size={18} className="text-emerald-600" />
            </div>
            <div className="mt-2 text-3xl font-bold text-gray-800">
              {loading ? '—' : activeDrivers}
            </div>
            <div className="text-xs text-gray-500 mt-1">Status = ACTIVE</div>
          </div>
        </div>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map(card => (
          <Link key={card.key} href={card.link} className="block">
            <div className="flex flex-col items-center p-6 bg-orange-100 rounded-lg hover:bg-orange-200 transition-colors duration-300 h-full border border-orange-200 shadow-sm hover:shadow-md">
              <div className="mb-4">{card.icon}</div>
              <h2 className="text-lg font-semibold text-gray-800 text-center mb-2">
                {card.title}
              </h2>
              <p className="text-sm text-gray-600 text-center">{card.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
