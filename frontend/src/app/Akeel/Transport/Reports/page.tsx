'use client';

import React from 'react';
import { BarChart3, Truck, Droplet, ClipboardList, RefreshCw, Table, LayoutGrid } from 'lucide-react';
import { useAuth } from '../../../../../hooks/useAuth';
import { fetchVehicles } from '../services/VehicleService';
import { listAllRequests } from '../services/usageService';
import { listFuelLogs } from '../services/FuelService';
import type { Vehicle, UsageRequest, FuelLog, RequestStatus } from '../services/types';

type ReportType = 'vehicles' | 'usage' | 'fuel';
type ViewMode = 'summary' | 'table';

const statusOrder: RequestStatus[] = [
  'PENDING_HOD',
  'PENDING_MANAGEMENT',
  'APPROVED',
  'SCHEDULED',
  'DISPATCHED',
  'RETURNED',
  'REJECTED',
];

const fmtDate = (s?: string | null) => (s ? new Date(s).toLocaleDateString() : '—');
const fmtNum = (v: number | null | undefined, d = 0) =>
  v == null || Number.isNaN(v) ? '—' : Number(v).toLocaleString(undefined, { maximumFractionDigits: d, minimumFractionDigits: d });
const fmtCurrency = (v: number | null | undefined) =>
  v == null || Number.isNaN(v) ? '—' : v.toLocaleString(undefined, { style: 'currency', currency: 'LKR', maximumFractionDigits: 0 });

const ReportPill = ({
  active,
  label,
  icon,
  onClick,
}: {
  active: boolean;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-colors ${
      active ? 'bg-orange-600 text-white border-orange-600 shadow-sm' : 'bg-white text-orange-800 border-orange-200 hover:bg-orange-50'
    }`}
  >
    {icon}
    <span className="text-sm font-semibold">{label}</span>
  </button>
);

export default function Reports() {
  const { user } = useAuth();
  const [report, setReport] = React.useState<ReportType>('vehicles');
  const [view, setView] = React.useState<ViewMode>('summary');
  const [loading, setLoading] = React.useState(false);
  const [vehicles, setVehicles] = React.useState<Vehicle[]>([]);
  const [usage, setUsage] = React.useState<UsageRequest[]>([]);
  const [fuel, setFuel] = React.useState<FuelLog[]>([]);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (report === 'vehicles') {
        const list = await fetchVehicles();
        setVehicles(Array.isArray(list) ? list : []);
      } else if (report === 'usage') {
        const list = await listAllRequests();
        setUsage(Array.isArray(list) ? list : []);
      } else if (report === 'fuel') {
        const list = await listFuelLogs({});
        setFuel(Array.isArray(list) ? list : []);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [report]);

  React.useEffect(() => {
    load();
  }, [load]);

  const vehicleSummary = React.useMemo(() => {
    const byFuel = vehicles.reduce<Record<string, number>>((acc, v) => {
      const key = (v.fuelType || 'UNKNOWN').toUpperCase();
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    const byStatus = vehicles.reduce<Record<string, number>>((acc, v) => {
      const key = (v.status || 'AVAILABLE').toUpperCase();
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    return { total: vehicles.length, byFuel, byStatus };
  }, [vehicles]);

  const usageSummary = React.useMemo(() => {
    const byStatus = usage.reduce<Record<string, number>>((acc, r) => {
      const key = (r.status || 'PENDING_HOD').toUpperCase();
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    const assigned = usage.filter((r) => r.assignedVehicleNumber).length;
    return { total: usage.length, byStatus, assigned };
  }, [usage]);

  const fuelSummary = React.useMemo(() => {
    return fuel.reduce(
      (acc, f) => {
        acc.km += f.deltaKm || 0;
        acc.litres += f.litres || 0;
        acc.cost += f.cost || 0;
        return acc;
      },
      { km: 0, litres: 0, cost: 0 }
    );
  }, [fuel]);

  const summaryCards = () => {
    if (report === 'vehicles') {
      return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SummaryCard title="Total Vehicles" value={vehicleSummary.total} icon={<Truck className="text-orange-600" />} />
          <SummaryCard
            title="By Fuel"
            value={Object.entries(vehicleSummary.byFuel)
              .map(([k, v]) => `${k}: ${v}`)
              .join(' • ') || '—'}
            icon={<Droplet className="text-orange-600" />}
          />
          <SummaryCard
            title="By Status"
            value={Object.entries(vehicleSummary.byStatus)
              .map(([k, v]) => `${k}: ${v}`)
              .join(' • ') || '—'}
            icon={<ClipboardList className="text-orange-600" />}
          />
        </div>
      );
    }
    if (report === 'usage') {
      return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SummaryCard title="Requests" value={usageSummary.total} icon={<BarChart3 className="text-orange-600" />} />
          <SummaryCard title="Assigned" value={usageSummary.assigned} icon={<Truck className="text-orange-600" />} />
          <SummaryCard
            title="By Status"
            value={statusOrder
              .map((s) => `${s}: ${usageSummary.byStatus[s] || 0}`)
              .join(' • ')}
            icon={<ClipboardList className="text-orange-600" />}
          />
        </div>
      );
    }
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SummaryCard title="Distance (km)" value={fmtNum(fuelSummary.km, 0)} icon={<GaugeIcon />} />
        <SummaryCard title="Litres" value={fmtNum(fuelSummary.litres, 1)} icon={<Droplet className="text-orange-600" />} />
        <SummaryCard title="Cost" value={fmtCurrency(fuelSummary.cost)} icon={<ClipboardList className="text-orange-600" />} />
      </div>
    );
  };

  const table = () => {
    if (report === 'vehicles') {
      return (
        <div className="overflow-x-auto rounded-xl border border-orange-100">
          <table className="w-full text-sm">
            <thead className="bg-orange-50 text-orange-800">
              <tr>
                <th className="px-3 py-2 text-left">Number</th>
                <th className="px-3 py-2 text-left">Type</th>
                <th className="px-3 py-2 text-left">Fuel</th>
                <th className="px-3 py-2 text-left">Status</th>
                <th className="px-3 py-2 text-left">Odometer</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {vehicles.map((v) => (
                <tr key={v.id}>
                  <td className="px-3 py-2 font-semibold text-orange-900">{v.vehicleNumber}</td>
                  <td className="px-3 py-2">{v.vehicleType || '—'}</td>
                  <td className="px-3 py-2">{v.fuelType || '—'}</td>
                  <td className="px-3 py-2">{v.status || '—'}</td>
                  <td className="px-3 py-2">{fmtNum(v.totalKmDriven ?? v.registeredKm ?? null, 0)}</td>
                </tr>
              ))}
              {!vehicles.length && (
                <tr>
                  <td className="px-3 py-4 text-center text-gray-500" colSpan={5}>
                    No vehicles found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      );
    }
    if (report === 'usage') {
      return (
        <div className="overflow-x-auto rounded-xl border border-orange-100">
          <table className="w-full text-sm">
            <thead className="bg-orange-50 text-orange-800">
              <tr>
                <th className="px-3 py-2 text-left">Code</th>
                <th className="px-3 py-2 text-left">Applicant</th>
                <th className="px-3 py-2 text-left">Department</th>
                <th className="px-3 py-2 text-left">Travel</th>
                <th className="px-3 py-2 text-left">Status</th>
                <th className="px-3 py-2 text-left">Assigned Vehicle</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {usage.map((r) => (
                <tr key={r.id}>
                  <td className="px-3 py-2 font-semibold text-orange-900">{r.requestCode}</td>
                  <td className="px-3 py-2">
                    <div className="font-semibold">{r.applicantName}</div>
                    <div className="text-xs text-gray-600">{r.employeeId}</div>
                  </td>
                  <td className="px-3 py-2">{r.department}</td>
                  <td className="px-3 py-2">
                    <div>{fmtDate(r.dateOfTravel)}</div>
                    {r.timeFrom && r.timeTo && <div className="text-xs text-gray-600">{r.timeFrom} → {r.timeTo}</div>}
                  </td>
                  <td className="px-3 py-2">{r.status}</td>
                  <td className="px-3 py-2">{r.assignedVehicleNumber || '—'}</td>
                </tr>
              ))}
              {!usage.length && (
                <tr>
                  <td className="px-3 py-4 text-center text-gray-500" colSpan={6}>
                    No requests found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      );
    }
    return (
      <div className="overflow-x-auto rounded-xl border border-orange-100">
        <table className="w-full text-sm">
          <thead className="bg-orange-50 text-orange-800">
            <tr>
              <th className="px-3 py-2 text-left">Vehicle</th>
              <th className="px-3 py-2 text-left">Date</th>
              <th className="px-3 py-2 text-left">Km</th>
              <th className="px-3 py-2 text-left">Litres</th>
              <th className="px-3 py-2 text-left">Cost</th>
              <th className="px-3 py-2 text-left">Fuel</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {fuel.map((f) => (
              <tr key={f.id}>
                <td className="px-3 py-2 font-semibold text-orange-900">
                  {f.vehicleNumber || f.vehicle?.vehicleNumber || '—'}
                  <div className="text-xs text-gray-600">{f.vehicleType || f.vehicle?.vehicleType || '—'}</div>
                </td>
                <td className="px-3 py-2">{fmtDate(f.logDate || f.createdAt || null)}</td>
                <td className="px-3 py-2">{fmtNum(f.deltaKm, 0)} km</td>
                <td className="px-3 py-2">{fmtNum(f.litres, 2)} L</td>
                <td className="px-3 py-2">{fmtCurrency(f.cost)}</td>
                <td className="px-3 py-2">{f.fuelType || '—'}</td>
              </tr>
            ))}
            {!fuel.length && (
              <tr>
                <td className="px-3 py-4 text-center text-gray-500" colSpan={6}>
                  No fuel logs found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-orange-50">
      <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-4">
        <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-orange-700">Transport</p>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2">
              <BarChart3 className="text-orange-600" /> Reports
            </h1>
            <p className="text-sm text-gray-600">Choose a report, then switch between summary and raw table views.</p>
            {user && (
              <p className="text-[11px] text-gray-500 mt-1">Signed in as {user.username || user.id}</p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <ReportPill
              active={report === 'vehicles'}
              label="Vehicles"
              icon={<Truck size={16} />}
              onClick={() => setReport('vehicles')}
            />
            <ReportPill
              active={report === 'usage'}
              label="Usage Requests"
              icon={<ClipboardList size={16} />}
              onClick={() => setReport('usage')}
            />
            <ReportPill
              active={report === 'fuel'}
              label="Fuel"
              icon={<Droplet size={16} />}
              onClick={() => setReport('fuel')}
            />
          </div>
        </header>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setView('summary')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold border ${
              view === 'summary' ? 'bg-orange-600 text-white border-orange-600' : 'bg-white text-orange-800 border-orange-200'
            }`}
          >
            <LayoutGrid size={16} /> Summary
          </button>
          <button
            type="button"
            onClick={() => setView('table')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold border ${
              view === 'table' ? 'bg-orange-600 text-white border-orange-600' : 'bg-white text-orange-800 border-orange-200'
            }`}
          >
            <Table size={16} /> Raw Table
          </button>
          <button
            type="button"
            onClick={load}
            className="ml-auto inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold border border-orange-300 text-orange-800 bg-white hover:bg-orange-50"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> {loading ? 'Refreshing' : 'Refresh'}
          </button>
        </div>

        {error && <div className="px-4 py-3 rounded-lg border border-red-200 bg-red-50 text-red-700 text-sm">{error}</div>}

        {view === 'summary' ? summaryCards() : table()}
      </div>
    </div>
  );
}

function SummaryCard({ title, value, icon }: { title: string; value: string | number; icon: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-orange-200 p-5 shadow-sm flex items-start gap-3">
      <div className="p-2 rounded-lg bg-orange-50 text-orange-700">{icon}</div>
      <div>
        <div className="text-sm text-gray-500">{title}</div>
        <div className="text-xl font-bold text-gray-900">{value}</div>
      </div>
    </div>
  );
}

const GaugeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-orange-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 12l3-9" />
    <path d="M21 12.8A9 9 0 0 0 3 12.8" />
    <path d="M5 12h2" />
    <path d="M17 12h2" />
    <path d="M10 12h4" />
  </svg>
);
