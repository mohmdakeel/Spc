'use client';

import React from 'react';
import {
  Droplet,
  Gauge,
  Truck,
  Loader2,
  Search,
  ExternalLink,
  Calculator,
  Lock,
  Unlock,
  Trash2,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { fetchVehicles } from '../services/VehicleService';
import { createFuelLog, listFuelLogs } from '../services/FuelService';
import type { FuelLog, FuelType, Vehicle } from '../services/types';
import { Th, Td } from '../components/ThTd';
import { useAuth } from '../../../../../hooks/useAuth';

type FuelPrices = { petrol: number; diesel: number };

const LS_PRICES = 'transport:fuel:prices';
const LS_OVERRIDES = 'transport:fuel:overrides';
const LS_MONTH = 'transport:fuel:month';
const PIN_PREFIX = 'transport:fuel:pin:';

const monthStr = (d: Date = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

const guessFuelType = (vehicle: Vehicle): FuelType => {
  const t = (vehicle.vehicleType || '').toLowerCase();
  const num = (vehicle.vehicleNumber || '').toLowerCase();
  const dieselHints = ['lorry', 'truck', 'bus', 'van', 'cab', 'pickup', 'tractor', 'tipper'];
  if (dieselHints.some((h) => t.includes(h) || num.includes(h))) return 'DIESEL';
  return 'PETROL';
};

const fmtNum = (v: number | null | undefined, digits = 1) =>
  v == null || Number.isNaN(v)
    ? '—'
    : Number(v).toLocaleString(undefined, { maximumFractionDigits: digits, minimumFractionDigits: digits });
const fmtCurrency = (v: number | null | undefined) =>
  v == null || Number.isNaN(v)
    ? '—'
    : v.toLocaleString(undefined, { style: 'currency', currency: 'LKR', maximumFractionDigits: 0 });

const safeRead = <T,>(key: string, fallback: T): T => {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};
const safeWrite = (key: string, value: unknown) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
};

export default function FuelPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [vehicles, setVehicles] = React.useState<Vehicle[]>([]);
  const [entries, setEntries] = React.useState<FuelLog[]>([]);
  const [loadingVehicles, setLoadingVehicles] = React.useState(true);
  const [loadingEntries, setLoadingEntries] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const [fuelOverrides, setFuelOverrides] = React.useState<Record<string, FuelType>>(
    () => safeRead<Record<string, FuelType>>(LS_OVERRIDES, {})
  );
  const [prices, setPrices] = React.useState<FuelPrices>(() =>
    safeRead<FuelPrices>(LS_PRICES, { petrol: 340, diesel: 320 })
  );
  const [pricesLocked, setPricesLocked] = React.useState(true);
  const [pinInput, setPinInput] = React.useState('');
  const [selectedId, setSelectedId] = React.useState<string>('');
  const [month, setMonth] = React.useState<string>(() => safeRead<string>(LS_MONTH, monthStr()));
  const [vehicleFilter, setVehicleFilter] = React.useState<string>('ALL');
  const [fromDate, setFromDate] = React.useState<string>('');
  const [toDate, setToDate] = React.useState<string>('');
  const [formLogDate, setFormLogDate] = React.useState<string>('');
  const [storedPin, setStoredPin] = React.useState<string | null>(null);

  // calculators
  const [tripKm, setTripKm] = React.useState(120);
  const [calcStart, setCalcStart] = React.useState(0);
  const [calcEnd, setCalcEnd] = React.useState(0);
  const [odoEff, setOdoEff] = React.useState<string>('');
  const [odoFuel, setOdoFuel] = React.useState<FuelType | ''>('');

  // entry form
  const [form, setForm] = React.useState({ vehicleId: '', startOdo: '', endOdo: '', litres: '' });
  const [submitting, setSubmitting] = React.useState(false);
  const [deltaOnly, setDeltaOnly] = React.useState('');

  const loadVehicles = React.useCallback(async () => {
    setLoadingVehicles(true);
    try {
      const list = await fetchVehicles();
      setVehicles(Array.isArray(list) ? list : []);
      if (list?.length && !selectedId) {
        setSelectedId(String(list[0].id));
        setForm((f) => ({ ...f, vehicleId: String(list[0].id) }));
      }
    } catch (e) {
      console.error(e);
      setVehicles([]);
    } finally {
      setLoadingVehicles(false);
    }
  }, [selectedId]);

  const loadEntries = React.useCallback(async () => {
    setLoadingEntries(true);
    try {
      const data = await listFuelLogs({
        month: month || undefined,
        vehicleId: vehicleFilter !== 'ALL' ? vehicleFilter : undefined,
        from: fromDate || undefined,
        to: toDate || undefined,
      });
      setEntries(data || []);
    } catch (e) {
      console.error('Failed to load fuel logs', e);
      setEntries([]);
    } finally {
      setLoadingEntries(false);
    }
  }, [month, vehicleFilter, fromDate, toDate]);

  React.useEffect(() => {
    loadVehicles();
  }, [loadVehicles]);

  React.useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  React.useEffect(() => safeWrite(LS_OVERRIDES, fuelOverrides), [fuelOverrides]);
  React.useEffect(() => safeWrite(LS_PRICES, prices), [prices]);
  React.useEffect(() => safeWrite(LS_MONTH, month), [month]);

  const actor = (user?.username || user?.id || '').toString() || (typeof window !== 'undefined' ? localStorage.getItem('username') || localStorage.getItem('actor') || '' : '');
  const pinKey = `${PIN_PREFIX}${actor || 'default'}`;

  React.useEffect(() => {
    const pin = safeRead<string | null>(pinKey, null);
    setStoredPin(pin);
  }, [pinKey]);

  const vehicleMap = React.useMemo(() => {
    const m = new Map<string, Vehicle>();
    vehicles.forEach((v) => m.set(String(v.id), v));
    return m;
  }, [vehicles]);

  const effectiveFuel = React.useCallback(
    (v: Vehicle): FuelType => fuelOverrides[String(v.id)] ?? (v.fuelType as FuelType) ?? guessFuelType(v),
    [fuelOverrides]
  );

  const filteredEntries = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    return entries
      .filter((e) => (vehicleFilter === 'ALL' || String(e.vehicleId ?? e.vehicle?.id) === vehicleFilter))
      .filter((e) => !q || `${e.vehicleNumber || ''} ${e.vehicleType || ''}`.toLowerCase().includes(q))
      .filter((e) => {
        if (fromDate) {
          const d = e.logDate ? new Date(e.logDate) : e.createdAt ? new Date(e.createdAt) : null;
          if (d && d < new Date(fromDate)) return false;
        }
        if (toDate) {
          const d = e.logDate ? new Date(e.logDate) : e.createdAt ? new Date(e.createdAt) : null;
          if (d && d > new Date(toDate)) return false;
        }
        return true;
      });
  }, [entries, vehicleFilter, search, fromDate, toDate]);

  const perVehicle = React.useMemo(() => {
    const grouped = new Map<
      string,
      {
        vehicle: Vehicle;
        fuel: FuelType;
        totalKm: number;
        totalLitres: number;
        totalCost: number;
        lastEntry?: FuelLog;
      }
    >();

    filteredEntries.forEach((e) => {
      const vehicleId = String(e.vehicleId ?? e.vehicle?.id ?? '');
      const v = vehicleMap.get(vehicleId);
      if (!v) return;
      const fuel = effectiveFuel(v);
      const prev = grouped.get(vehicleId) || {
        vehicle: v,
        fuel,
        totalKm: 0,
        totalLitres: 0,
        totalCost: 0,
      };
      grouped.set(vehicleId, {
        ...prev,
        fuel,
        totalKm: prev.totalKm + (e.deltaKm || 0),
        totalLitres: prev.totalLitres + (e.litres || 0),
        totalCost: prev.totalCost + (e.cost || 0),
        lastEntry: e,
      });
    });

    // Include vehicles even without entries (for selection and quick glance)
    vehicles.forEach((v) => {
      const id = String(v.id);
      if (vehicleFilter !== 'ALL' && vehicleFilter !== id) return;
      if (!grouped.has(id)) {
        grouped.set(id, {
          vehicle: v,
          fuel: effectiveFuel(v),
          totalKm: 0,
          totalLitres: 0,
          totalCost: 0,
        });
      }
    });

    return Array.from(grouped.values()).sort((a, b) => (b.totalCost || 0) - (a.totalCost || 0));
  }, [filteredEntries, vehicles, vehicleFilter, vehicleMap, effectiveFuel]);

  const totals = React.useMemo(
    () =>
      filteredEntries.reduce(
        (acc, e) => {
          acc.km += e.deltaKm || 0;
          acc.litres += e.litres || 0;
          acc.cost += e.cost || 0;
          return acc;
        },
        { km: 0, litres: 0, cost: 0 }
      ),
    [filteredEntries]
  );

  const sortedEntries = React.useMemo(() => {
    const list = [...filteredEntries];
    list.sort((a, b) => {
      const da = new Date(a.logDate || a.createdAt || '').getTime();
      const db = new Date(b.logDate || b.createdAt || '').getTime();
      if (da === db) {
        return String(a.id).localeCompare(String(b.id));
      }
      return da - db;
    });
    return list;
  }, [filteredEntries]);
  const cumulativeMap = new Map<string, { km: number; litres: number; cost: number }>();

  const selectedVehicle = React.useMemo(
    () => vehicleMap.get(selectedId) || vehicles[0],
    [selectedId, vehicleMap, vehicles]
  );
  const selectedFuel: FuelType = selectedVehicle ? effectiveFuel(selectedVehicle) : 'PETROL';
  const selectedEff = selectedVehicle?.fuelEfficiency ?? null;
  React.useEffect(() => {
    setOdoEff(selectedEff != null ? String(selectedEff) : '');
    setOdoFuel(selectedFuel);
  }, [selectedEff, selectedFuel]);

  const effForOdo = odoEff.trim() ? Number(odoEff) : selectedEff;
  const fuelForOdo: FuelType = odoFuel || selectedFuel;
  const tripLiters = selectedEff ? tripKm / selectedEff : null;
  const tripCost =
    tripLiters != null ? tripLiters * (selectedFuel === 'PETROL' ? prices.petrol : prices.diesel) : null;

  const kmDelta = Math.max(0, calcEnd - calcStart);
  const kmDeltaLitres = effForOdo ? kmDelta / effForOdo : null;
  const kmDeltaCost =
    kmDeltaLitres != null
      ? kmDeltaLitres * (fuelForOdo === 'PETROL' ? prices.petrol : prices.diesel)
      : null;

  const handlePriceUnlock = () => {
    const entered = pinInput.trim();
    if (!storedPin) {
      if (!entered) {
        alert('Set a PIN to unlock.');
        return;
      }
      setStoredPin(entered);
      safeWrite(pinKey, entered);
      setPricesLocked(false);
      setPinInput('');
      return;
    }
    if (entered === storedPin) {
      setPricesLocked(false);
      setPinInput('');
    } else {
      alert('Incorrect PIN');
    }
  };
  const handlePriceLock = () => setPricesLocked(true);
  const handleResetPin = () => {
    setStoredPin(null);
    safeWrite(pinKey, null);
    setPricesLocked(true);
    setPinInput('');
  };

  const handleEntrySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    const vehicleId = form.vehicleId || selectedId || (vehicles[0]?.id ? String(vehicles[0].id) : '');
    if (!vehicleId) return;
    const v = vehicleMap.get(vehicleId);
    if (!v) return;

    const hasDelta = deltaOnly.trim().length > 0;
    const start = hasDelta ? null : Number(form.startOdo) || 0;
    const end = hasDelta ? null : Number(form.endOdo) || 0;
    const fuel: FuelType = effectiveFuel(v);
    const pricePerL = fuel === 'PETROL' ? prices.petrol : prices.diesel;
    const manualLitres = form.litres.trim() ? Number(form.litres) : null;

    setSubmitting(true);
    try {
      await createFuelLog({
        vehicleId,
        month,
        startOdo: start,
        endOdo: end,
        deltaKm: hasDelta ? Number(deltaOnly) || 0 : undefined,
        litres: manualLitres,
        pricePerL,
        efficiencyUsed: v.fuelEfficiency ?? undefined,
        fuelType: fuel,
        logDate: formLogDate || undefined,
      });
      setForm((f) => ({ ...f, startOdo: '', endOdo: '', litres: '' }));
      setDeltaOnly('');
      setFormLogDate('');
      await loadEntries();
    } catch (err) {
      console.error('Failed to save fuel log', err);
      alert('Failed to save fuel entry. Check connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteEntryLocal = (id: string | number | undefined) => {
    // Backend delete not implemented; filter from view
    setEntries((list) => list.filter((e) => String(e.id) !== String(id)));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-orange-700">Transport</p>
          <h1 className="text-2xl font-bold text-orange-900 flex items-center gap-2">
            <Droplet size={20} /> Fuel Consumption
          </h1>
          <p className="text-sm text-gray-600">
            Live fuel usage by vehicle, using backend data. Update prices with PIN for accurate costs.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-xs text-gray-600 bg-orange-50 border border-orange-200 rounded-lg px-3 py-2">
            Prices editable with your PIN (per account)
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Prices */}
        <div className="bg-white border border-orange-200 rounded-2xl p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-orange-900">Fuel Prices</div>
              <div className="text-xs text-gray-600">LKR per litre (locked by PIN)</div>
            </div>
            {pricesLocked ? <Lock size={18} className="text-orange-600" /> : <Unlock size={18} className="text-orange-600" />}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="text-xs text-gray-700 space-y-1">
              <span>Petrol (LKR/L)</span>
              <input
                type="number"
                value={prices.petrol}
                onChange={(e) => setPrices((p) => ({ ...p, petrol: Number(e.target.value) || 0 }))}
                className="w-full rounded-lg border border-orange-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                min={0}
                disabled={pricesLocked}
              />
            </label>
            <label className="text-xs text-gray-700 space-y-1">
              <span>Diesel (LKR/L)</span>
              <input
                type="number"
                value={prices.diesel}
                onChange={(e) => setPrices((p) => ({ ...p, diesel: Number(e.target.value) || 0 }))}
                className="w-full rounded-lg border border-orange-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                min={0}
                disabled={pricesLocked}
              />
            </label>
          </div>
          {pricesLocked ? (
            <div className="flex gap-2 items-center">
              <input
                type="password"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder={storedPin ? 'Enter PIN to unlock' : 'Create a PIN to unlock'}
                className="flex-1 rounded-lg border border-orange-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <button
                type="button"
                onClick={handlePriceUnlock}
                className="px-3 py-2 text-xs font-semibold rounded-lg bg-orange-600 text-white hover:bg-orange-700"
              >
                {storedPin ? 'Unlock' : 'Set & unlock'}
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handlePriceLock}
                className="px-3 py-2 text-xs font-semibold rounded-lg border border-orange-300 text-orange-800 hover:bg-orange-50"
              >
                Lock prices
              </button>
              <button
                type="button"
                onClick={handleResetPin}
                className="px-3 py-2 text-xs font-semibold rounded-lg border border-red-200 text-red-700 hover:bg-red-50"
              >
                Reset PIN
              </button>
            </div>
          )}
        </div>

        {/* Date & totals */}
        <div className="bg-white border border-orange-200 rounded-2xl p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-orange-900">Month & Filters</div>
              <div className="text-xs text-gray-600">Filter by month or date range.</div>
            </div>
            <Truck className="text-orange-600" size={18} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="text-xs text-gray-700 space-y-1">
              <span>Select month</span>
              <input
                type="month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="w-full rounded-lg border border-orange-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </label>
            <label className="text-xs text-gray-700 space-y-1">
            <span>Filter by vehicle</span>
            <select
              value={vehicleFilter}
              onChange={(e) => setVehicleFilter(e.target.value)}
              className="w-full rounded-lg border border-orange-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
            >
              <option value="ALL">All vehicles</option>
              {vehicles.map((v) => (
                <option key={v.id} value={String(v.id)}>
                  {v.vehicleNumber} • {v.vehicleType || 'Vehicle'}
                </option>
              ))}
            </select>
          </label>
        </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="text-xs text-gray-700 space-y-1">
              <span>From date (optional)</span>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full rounded-lg border border-orange-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </label>
            <label className="text-xs text-gray-700 space-y-1">
              <span>To date (optional)</span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full rounded-lg border border-orange-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </label>
          </div>
          <div className="grid grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-orange-50 border border-orange-100">
              <div className="text-gray-500">Total km</div>
              <div className="text-orange-900 font-semibold text-base">{fmtNum(totals.km, 0)} km</div>
            </div>
            <div className="p-3 rounded-xl bg-orange-50 border border-orange-100">
              <div className="text-gray-500">Litres</div>
              <div className="text-orange-900 font-semibold text-base">{fmtNum(totals.litres, 1)} L</div>
            </div>
            <div className="p-3 rounded-xl bg-orange-50 border border-orange-100">
              <div className="text-gray-500">Cost</div>
              <div className="text-orange-900 font-semibold text-base">{fmtCurrency(totals.cost)}</div>
            </div>
          </div>
        </div>

        {/* KM delta calc */}
        <div className="bg-white border border-orange-200 rounded-2xl p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-orange-900">Odometer Calculator</div>
              <div className="text-xs text-gray-600">Compute km and fuel between two readings.</div>
            </div>
            <Calculator className="text-orange-600" size={18} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="text-xs text-gray-700 space-y-1">
              <span>Start (km)</span>
              <input
                type="number"
                value={calcStart}
                onChange={(e) => setCalcStart(Number(e.target.value) || 0)}
                className="w-full rounded-lg border border-orange-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </label>
            <label className="text-xs text-gray-700 space-y-1">
              <span>End (km)</span>
              <input
                type="number"
                value={calcEnd}
                onChange={(e) => setCalcEnd(Number(e.target.value) || 0)}
                className="w-full rounded-lg border border-orange-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </label>
          </div>
          <div className="grid grid-cols-3 gap-3 text-xs">
            <label className="space-y-1">
              <div className="text-gray-500">Efficiency (km/L)</div>
              <input
                type="number"
                value={odoEff}
                onChange={(e) => setOdoEff(e.target.value)}
                placeholder={selectedEff ? String(selectedEff) : 'Enter efficiency'}
                className="w-full rounded-lg border border-orange-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                step="0.01"
                min={0}
              />
              <div className="text-[11px] text-gray-500">Defaults to vehicle efficiency</div>
            </label>
            <label className="space-y-1">
              <div className="text-gray-500">Fuel</div>
              <select
                value={odoFuel || selectedFuel}
                onChange={(e) => setOdoFuel(e.target.value as FuelType)}
                className="w-full rounded-lg border border-orange-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
              >
                <option value="PETROL">Petrol</option>
                <option value="DIESEL">Diesel</option>
              </select>
            </label>
            <div className="p-3 rounded-xl bg-orange-50 border border-orange-100">
              <div className="text-gray-500">Distance</div>
              <div className="text-orange-900 font-semibold text-base">{fmtNum(kmDelta, 0)} km</div>
            </div>
            <div className="p-3 rounded-xl bg-orange-50 border border-orange-100">
              <div className="text-gray-500">Litres (calc)</div>
              <div className="text-orange-900 font-semibold text-base">{fmtNum(kmDeltaLitres, 2)} L</div>
            </div>
            <div className="p-3 rounded-xl bg-orange-50 border border-orange-100">
              <div className="text-gray-500">Cost</div>
              <div className="text-orange-900 font-semibold text-base">{fmtCurrency(kmDeltaCost)}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Trip calculator */}
        <div className="bg-white border border-orange-200 rounded-2xl p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-orange-900">Trip Calculator</div>
              <div className="text-xs text-gray-600">Select a vehicle and enter distance.</div>
            </div>
            <Gauge className="text-orange-600" size={18} />
          </div>
          <div className="space-y-2">
            <label className="text-xs text-gray-700 space-y-1 block">
              <span>Vehicle</span>
              <select
                value={selectedId}
                onChange={(e) => {
                  setSelectedId(e.target.value);
                  setForm((f) => ({ ...f, vehicleId: e.target.value }));
                }}
                className="w-full rounded-lg border border-orange-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
              >
                {vehicles.map((v) => (
                  <option key={v.id} value={String(v.id)}>
                    {v.vehicleNumber} • {v.vehicleType || 'Vehicle'} • {v.fuelType || 'Fuel ?'}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs text-gray-700 space-y-1 block">
              <span>Trip distance (km)</span>
              <input
                type="number"
                value={tripKm}
                onChange={(e) => setTripKm(Math.max(0, Number(e.target.value) || 0))}
                className="w-full rounded-lg border border-orange-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                min={0}
              />
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-orange-50 border border-orange-100">
              <div className="text-gray-500">Fuel type</div>
              <div className="text-orange-900 font-semibold text-sm">{selectedFuel || '—'}</div>
            </div>
            <div className="p-3 rounded-xl bg-orange-50 border border-orange-100">
              <div className="text-gray-500">Efficiency</div>
              <div className="text-orange-900 font-semibold text-sm">
                {selectedEff ? `${fmtNum(selectedEff)} km/L` : 'Not set'}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-orange-50 border border-orange-100">
              <div className="text-gray-500">Fuel needed</div>
              <div className="text-orange-900 font-semibold text-sm">{fmtNum(tripLiters, 2)} L</div>
            </div>
            <div className="p-3 rounded-xl bg-orange-50 border border-orange-100">
              <div className="text-gray-500">Trip cost</div>
              <div className="text-orange-900 font-semibold text-sm">{fmtCurrency(tripCost)}</div>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="text-[11px] text-gray-500">Update efficiency in Vehicle Register for accurate numbers.</div>
            <button
              type="button"
              onClick={() => router.push('/Akeel/Transport/Vehicle')}
              className="inline-flex items-center gap-2 text-xs font-medium text-orange-700 hover:text-orange-900"
            >
              Vehicle Register <ExternalLink size={14} />
            </button>
          </div>
        </div>

        {/* Entry form */}
        <div className="bg-white border border-orange-200 rounded-2xl p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div>
            <div className="text-sm font-semibold text-orange-900">Add Usage</div>
            <div className="text-xs text-gray-600">Odometer start/end or distance + litres (optional).</div>
            </div>
            <Droplet className="text-orange-600" size={18} />
          </div>
          <form className="space-y-3" onSubmit={handleEntrySubmit}>
            <div className="grid grid-cols-2 gap-3">
              <label className="text-xs text-gray-700 space-y-1">
                <span>Vehicle</span>
                <select
                  value={form.vehicleId || selectedId}
                  onChange={(e) => setForm((f) => ({ ...f, vehicleId: e.target.value }))}
                  className="w-full rounded-lg border border-orange-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                >
                  {vehicles.map((v) => (
                    <option key={v.id} value={String(v.id)}>
                      {v.vehicleNumber} • {v.vehicleType || 'Vehicle'} • {v.fuelType || 'Fuel ?'}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-xs text-gray-700 space-y-1">
              <span>Month</span>
              <input
                type="month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="w-full rounded-lg border border-orange-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </label>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <label className="text-xs text-gray-700 space-y-1">
                <span>Start Odo</span>
                <input
                  type="number"
                  value={form.startOdo}
                  onChange={(e) => setForm((f) => ({ ...f, startOdo: e.target.value }))}
                  className="w-full rounded-lg border border-orange-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  disabled={deltaOnly.trim().length > 0}
                />
              </label>
              <label className="text-xs text-gray-700 space-y-1">
                <span>End Odo</span>
                <input
                  type="number"
                  value={form.endOdo}
                  onChange={(e) => setForm((f) => ({ ...f, endOdo: e.target.value }))}
                  className="w-full rounded-lg border border-orange-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  disabled={deltaOnly.trim().length > 0}
                />
              </label>
              <label className="text-xs text-gray-700 space-y-1">
                <span>Litres used (optional)</span>
                <input
                  type="number"
                  value={form.litres}
                  onChange={(e) => setForm((f) => ({ ...f, litres: e.target.value }))}
                  className="w-full rounded-lg border border-orange-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  min={0}
                  step="0.01"
                />
              </label>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <label className="text-xs text-gray-700 space-y-1">
                <span>Distance only (km)</span>
                <input
                  type="number"
                  value={deltaOnly}
                  onChange={(e) => setDeltaOnly(e.target.value)}
                  className="w-full rounded-lg border border-orange-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  min={0}
                />
              </label>
              <label className="text-xs text-gray-700 space-y-1">
                <span>Log date (optional)</span>
                <input
                  type="date"
                  value={formLogDate}
                  onChange={(e) => setFormLogDate(e.target.value)}
                  className="w-full rounded-lg border border-orange-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </label>
            </div>

            <div className="grid grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-orange-50 border border-orange-100">
                <div className="text-gray-500">Distance</div>
                <div className="text-orange-900 font-semibold text-base">
                  {fmtNum(Math.max(0, (Number(form.endOdo) || 0) - (Number(form.startOdo) || 0)), 0)} km
                </div>
              </div>
              <div className="p-3 rounded-xl bg-orange-50 border border-orange-100">
                <div className="text-gray-500">Fuel type</div>
                <div className="text-orange-900 font-semibold text-base">
                  {(() => {
                    const v = form.vehicleId ? vehicleMap.get(form.vehicleId) : undefined;
                    return v ? effectiveFuel(v) : selectedFuel;
                  })()}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-orange-50 border border-orange-100">
                <div className="text-gray-500">Est. cost</div>
                <div className="text-orange-900 font-semibold text-base">
                  {(() => {
                    const start = Number(form.startOdo) || 0;
                    const end = Number(form.endOdo) || 0;
                    const deltaKm = Math.max(0, end - start);
                    const vId = form.vehicleId || selectedId;
                    const v = vehicleMap.get(vId || '');
                    const fuel = v ? effectiveFuel(v) : selectedFuel;
                    const eff = v?.fuelEfficiency ?? null;
                    const manualLitres = form.litres.trim() ? Number(form.litres) : null;
                    const litres = manualLitres != null ? manualLitres : eff ? deltaKm / eff : null;
                    const pricePerL = fuel === 'PETROL' ? prices.petrol : prices.diesel;
                    return fmtCurrency(litres != null ? litres * pricePerL : null);
                  })()}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-[11px] text-gray-500">
                Litres blank → auto-calc from vehicle efficiency (km/L); saved to backend.
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 rounded-lg bg-orange-600 text-white text-sm font-semibold hover:bg-orange-700 disabled:opacity-60"
              >
                {submitting ? 'Saving…' : 'Add entry'}
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="bg-white border border-orange-200 rounded-2xl shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 px-4 py-3 border-b border-orange-100">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-2.5 text-orange-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search vehicle number, type, brand..."
                className="pl-9 pr-3 py-2 rounded-lg border border-orange-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 w-72"
              />
            </div>
            <span className="text-xs text-gray-500">Month: {month || '—'}</span>
          </div>
          <div className="text-xs text-gray-600">Data is stored in backend fuel logs; prices cached locally.</div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <colgroup>
              <col style={{ width: '18%' }} />
              <col style={{ width: '12%' }} />
              <col style={{ width: '12%' }} />
              <col style={{ width: '12%' }} />
              <col style={{ width: '12%' }} />
              <col style={{ width: '12%' }} />
              <col style={{ width: '12%' }} />
            </colgroup>
            <thead className="bg-orange-50">
              <tr>
                <Th className="text-left px-3 py-2">Vehicle</Th>
                <Th className="text-left px-3 py-2">Fuel</Th>
                <Th className="text-left px-3 py-2">Efficiency</Th>
                <Th className="text-left px-3 py-2">Cost / km</Th>
                <Th className="text-left px-3 py-2">Km this month</Th>
                <Th className="text-left px-3 py-2">Litres</Th>
                <Th className="text-left px-3 py-2">Cost</Th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loadingVehicles || loadingEntries ? (
                <tr>
                  <Td colSpan={7} className="px-3 py-6 text-center text-gray-500">
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="animate-spin text-orange-600" size={16} /> Loading…
                    </span>
                  </Td>
                </tr>
              ) : null}
              {!loadingVehicles &&
                !loadingEntries &&
                perVehicle.map((row) => {
                  const idKey = String(row.vehicle.id);
                  const pricePerL = row.fuel === 'PETROL' ? prices.petrol : prices.diesel;
                  const eff = row.vehicle.fuelEfficiency ?? null;
                  const pricePerKm = eff ? pricePerL / eff : null;
                  const registerFuel = row.vehicle.fuelType as FuelType | undefined;
                  const hasOverride = fuelOverrides[idKey] !== undefined;
                  return (
                    <tr key={idKey} className="hover:bg-orange-50/60 align-top">
                      <Td className="px-3 py-2">
                        <div className="font-semibold text-orange-900">{row.vehicle.vehicleNumber || '—'}</div>
                        <div className="text-xs text-gray-600">{row.vehicle.vehicleType || '—'}</div>
                        <div className="text-[11px] text-gray-500">
                          {row.vehicle.brand || ''} {row.vehicle.model || ''}
                        </div>
                      </Td>
                      <Td className="px-3 py-2">
                        <select
                          value={row.fuel}
                          onChange={(e) => setFuelOverrides((m) => ({ ...m, [idKey]: e.target.value as FuelType }))}
                          className="w-full rounded-md border border-orange-200 bg-white px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500"
                        >
                          <option value="PETROL">Petrol</option>
                          <option value="DIESEL">Diesel</option>
                        </select>
                        <div className="text-[11px] text-gray-500 mt-1">Price: LKR {pricePerL.toLocaleString()}</div>
                        <div className="text-[11px] text-gray-500">
                          {registerFuel ? `Vehicle register: ${registerFuel}` : 'Set fuel type in Vehicle Register'}
                        </div>
                        {hasOverride && (
                          <button
                            type="button"
                            onClick={() =>
                              setFuelOverrides((m) => {
                                const next = { ...m };
                                delete next[idKey];
                                return next;
                              })
                            }
                            className="mt-1 text-[11px] text-orange-700 hover:text-orange-900"
                          >
                            Reset to vehicle fuel
                          </button>
                        )}
                      </Td>
                      <Td className="px-3 py-2">
                        <div className="font-semibold text-orange-900">{eff ? `${fmtNum(eff)} km/L` : '—'}</div>
                        <div className="text-[11px] text-gray-500">
                          {eff ? `${fmtNum(100 / eff, 2)} L / 100 km` : 'Set in Vehicle Register'}
                        </div>
                      </Td>
                      <Td className="px-3 py-2">
                        <div className="font-semibold text-orange-900">{fmtCurrency(pricePerKm)}</div>
                        <div className="text-[11px] text-gray-500">With {row.fuel.toLowerCase()} price</div>
                      </Td>
                      <Td className="px-3 py-2">
                        <div className="font-semibold text-orange-900">{fmtNum(row.totalKm, 0)} km</div>
                        <div className="text-[11px] text-gray-500">This month</div>
                      </Td>
                      <Td className="px-3 py-2">
                        <div className="font-semibold text-orange-900">{fmtNum(row.totalLitres, 1)} L</div>
                        <div className="text-[11px] text-gray-500">
                          {row.totalKm && eff ? `Expected ${fmtNum(row.totalKm / eff, 1)} L` : ''}
                        </div>
                      </Td>
                      <Td className="px-3 py-2">
                        <div className="font-semibold text-orange-900">{fmtCurrency(row.totalCost)}</div>
                        <div className="text-[11px] text-gray-500">
                          Last update:{' '}
                          {row.lastEntry ? new Date(row.lastEntry.createdAt || '').toLocaleString() : '—'}
                        </div>
                      </Td>
                    </tr>
                  );
                })}
              {!loadingVehicles && !loadingEntries && !perVehicle.length && (
                <tr>
                  <Td colSpan={7} className="px-3 py-6 text-center text-gray-500">
                    No vehicles found.
                  </Td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white border border-orange-200 rounded-2xl shadow-sm">
        <div className="px-4 py-3 border-b border-orange-100 flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-orange-900">Entries for {month || '—'}</div>
            <div className="text-xs text-gray-600">
              Backend fuel logs. Delete hides locally; backend delete endpoint not wired yet.
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-orange-50">
              <tr>
                <Th className="text-left px-3 py-2">Vehicle</Th>
                <Th className="text-left px-3 py-2">Start → End</Th>
                <Th className="text-left px-3 py-2">Km</Th>
                <Th className="text-left px-3 py-2">Litres</Th>
                <Th className="text-left px-3 py-2">Cost</Th>
                <Th className="text-left px-3 py-2">Fuel</Th>
                <Th className="text-left px-3 py-2">Added</Th>
                <Th className="text-left px-3 py-2">Cumulative</Th>
                <Th className="text-center px-3 py-2">Actions</Th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredEntries.length === 0 && (
                <tr>
                  <Td colSpan={8} className="px-3 py-6 text-center text-gray-500">
                    No entries for this selection yet.
                  </Td>
                </tr>
              )}
              {sortedEntries.map((e) => {
                const vId = String(e.vehicleId ?? e.vehicle?.id ?? '');
                const key = `${vId}-${e.id}`;
                const cumulative = (() => {
                  const acc = cumulativeMap.get(vId) || { km: 0, litres: 0, cost: 0 };
                  const next = {
                    km: acc.km + (e.deltaKm || 0),
                    litres: acc.litres + (e.litres || 0),
                    cost: acc.cost + (e.cost || 0),
                  };
                  cumulativeMap.set(vId, next);
                  return next;
                })();
                return (
                  <tr key={key} className="hover:bg-orange-50/50">
                    <Td className="px-3 py-2">
                      <div className="font-semibold text-orange-900">{e.vehicleNumber || '—'}</div>
                      <div className="text-xs text-gray-600">{e.vehicleType || '—'}</div>
                    </Td>
                    <Td className="px-3 py-2">
                      <div className="font-semibold text-orange-900">
                        {fmtNum(e.startOdo ?? 0, 0)} → {fmtNum(e.endOdo ?? 0, 0)}
                      </div>
                      <div className="text-[11px] text-gray-500">
                        {e.logDate ? e.logDate : e.createdAt ? new Date(e.createdAt).toLocaleDateString() : '—'}
                      </div>
                    </Td>
                    <Td className="px-3 py-2">{fmtNum(e.deltaKm, 0)} km</Td>
                    <Td className="px-3 py-2">{fmtNum(e.litres, 2)} L</Td>
                    <Td className="px-3 py-2">{fmtCurrency(e.cost)}</Td>
                    <Td className="px-3 py-2">{e.fuelType || '—'}</Td>
                    <Td className="px-3 py-2 text-[11px] text-gray-600">
                      {e.createdAt ? new Date(e.createdAt).toLocaleString() : '—'}
                    </Td>
                    <Td className="px-3 py-2 text-[11px] text-gray-700">
                      <div>Km: {fmtNum(cumulative.km, 0)}</div>
                      <div>L: {fmtNum(cumulative.litres, 2)}</div>
                      <div>Cost: {fmtCurrency(cumulative.cost)}</div>
                    </Td>
                    <Td className="px-3 py-2 text-center">
                      <button
                        type="button"
                        onClick={() => handleDeleteEntryLocal(e.id)}
                        className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md text-red-600 hover:bg-red-50"
                      >
                        <Trash2 size={14} /> Hide
                      </button>
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
