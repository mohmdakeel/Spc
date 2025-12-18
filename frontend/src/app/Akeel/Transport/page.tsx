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

  const kpis = [
    {
      key: 'vehicles',
      title: 'Total Vehicles',
      value: loading ? '—' : totalVehicles,
      note: 'Active (non-deleted) vehicles',
      icon: Truck,
      accent: 'bg-orange-100 text-orange-700',
      badgeClass: 'bg-orange-50 text-orange-700 border border-orange-100',
      badge: 'Vehicles',
    },
    {
      key: 'available-vehicles',
      title: 'Available Vehicles',
      value: loading ? '—' : availableVehicles,
      note: 'Status = AVAILABLE',
      icon: Gauge,
      accent: 'bg-green-100 text-green-700',
      badgeClass: 'bg-green-50 text-green-700 border border-green-100',
      badge: 'Available',
    },
    {
      key: 'drivers',
      title: 'Total Drivers',
      value: loading ? '—' : totalDrivers,
      note: 'Active (non-deleted) drivers',
      icon: User,
      accent: 'bg-orange-100 text-orange-700',
      badgeClass: 'bg-orange-50 text-orange-700 border border-orange-100',
      badge: 'Drivers',
    },
    {
      key: 'active-drivers',
      title: 'Available Drivers',
      value: loading ? '—' : activeDrivers,
      note: 'Status = ACTIVE',
      icon: User,
      accent: 'bg-emerald-100 text-emerald-700',
      badgeClass: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
      badge: 'Available',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Transport Management Dashboard</h1>
          <p className="text-gray-600">
            Manage all transport operations from a single dashboard
          </p>
        </div>
        {user && (
          <div className="flex items-center gap-2 bg-white/70 px-3 py-2 rounded-lg border border-orange-100 shadow-sm">
            <span className="text-sm font-medium text-gray-800">
              {(user.fullName || user.username) ?? 'User'}
            </span>
            <span className="text-gray-400">•</span>
            <span className="text-xs text-orange-700 bg-orange-50 px-2 py-1 rounded-full border border-orange-100">
              {user.roles?.join(', ') || 'Roles'}
            </span>
          </div>
        )}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.key} className="auth-card p-5 shadow-sm border border-orange-100/60">
              <div className="flex items-center justify-between">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${kpi.accent}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${kpi.badgeClass}`}>
                  {kpi.badge}
                </span>
              </div>
              <p className="mt-4 text-sm font-medium text-gray-600">{kpi.title}</p>
              <div className="mt-1 text-3xl font-bold text-gray-900">
                {kpi.value}
              </div>
              <p className="text-xs text-gray-500 mt-1">{kpi.note}</p>
            </div>
          );
        })}
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map(card => (
          <Link key={card.key} href={card.link} className="block h-full">
            <div className="auth-card h-full p-6 hover:-translate-y-0.5 transition-all duration-200 border border-orange-100/60">
              <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-700 flex items-center justify-center mb-4 shadow-inner">
                {card.icon}
              </div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                {card.title}
              </h2>
              <p className="text-sm text-gray-600 mb-4">{card.description}</p>
              <span className="inline-flex items-center text-xs font-semibold text-orange-700 bg-orange-50 border border-orange-100 rounded-full px-3 py-1">
                View details
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
