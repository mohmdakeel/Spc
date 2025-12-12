'use client';

import { useEffect, useMemo, useState } from 'react';
import { fetchVehicleAvailability } from '../../Transport/services/availabilityService';
import type { VehicleAvailability } from '../../Transport/services/types';
import SearchBar from '../components/SearchBar';
import { CalendarClock, Clock, Car, Tag } from 'lucide-react';

const parseDateTime = (date: string | null | undefined, time?: string | null) => {
  if (!date) return null;
  if (date.includes('T')) {
    const d = new Date(date);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const t = (time ?? '00:00').trim() || '00:00';
  const iso = `${date}T${t.length === 5 ? `${t}:00` : t}`;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
};

const formatTime = (d: Date) =>
  d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

export default function AvailableVehiclesPage() {
  const [availability, setAvailability] = useState<VehicleAvailability[]>([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [q, setQ] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await fetchVehicleAvailability({ date, from: from || undefined, to: to || undefined }).catch(() => []);
        const normalized = data.map((v) => ({
          ...v,
          busy: (v.busy || []).map((b) => ({
            from: parseDateTime(b.from) || new Date(),
            to: parseDateTime(b.to) || new Date(),
            driverName: b.driverName,
            requestCode: b.requestCode,
          })),
        }));
        setAvailability(normalized);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [date, from, to]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return availability;
    return availability.filter(({ vehicleNumber }) =>
      [vehicleNumber]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(s))
    );
  }, [availability, q]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase text-orange-700 font-semibold">Availability</p>
          <h1 className="text-lg font-bold text-orange-900">Vehicles by date</h1>
          <p className="text-sm text-gray-600">See which vehicles are free or on a trip.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <CalendarClock size={16} className="text-orange-600" />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="border rounded-lg px-3 py-2 text-sm"
            />
          </label>
          <input
            type="time"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm"
            placeholder="From"
          />
          <input
            type="time"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm"
            placeholder="To"
          />
          <SearchBar
            value={q}
            onChange={setQ}
            placeholder="Search vehicle number, model…"
            className="w-full sm:w-72"
          />
        </div>
      </div>

      <div className="bg-white border border-orange-200 rounded-lg overflow-auto">
        <table className="w-full text-[11.5px] leading-tight">
          <thead className="bg-orange-50">
            <tr className="text-[10px] uppercase tracking-wide text-gray-600">
              <th className="px-3 py-2 text-left">Vehicle</th>
              <th className="px-3 py-2 text-left">Meta</th>
              <th className="px-3 py-2 text-left">Availability</th>
              <th className="px-3 py-2 text-left">Window</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr>
                <td colSpan={4} className="px-3 py-6 text-center text-gray-500">Loading…</td>
              </tr>
            ) : null}

            {!loading && filtered.map(({ vehicleNumber, vehicleType, busy }) => {
              const busyList = busy || [];
              const busyState = busyList.length > 0;
              return (
                <tr key={vehicleNumber} className="hover:bg-orange-50/60">
                  <td className="px-3 py-2">
                    <div className="font-semibold text-orange-900 flex items-center gap-2">
                      <Car size={14} className="text-orange-700" />
                      {vehicleNumber}
                    </div>
                    <div className="text-[10px] text-gray-600">{vehicleType || '—'}</div>
                  </td>
                  <td className="px-3 py-2 text-[10px] text-gray-700">
                    <div className="flex items-center gap-1">
                      <Tag size={12} className="text-orange-700" />
                      <span>{vehicleType || '—'}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-[3px] text-[10px] font-semibold ${
                      busyState ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      <span className={`h-2 w-2 rounded-full ${busyState ? 'bg-red-500' : 'bg-emerald-500'}`} />
                      {busyState ? 'Busy' : 'Available'}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-[10.5px] text-gray-800">
                    {busyState ? (
                      <div className="space-y-1">
                        {busyList.map((w, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-orange-900">
                            <Clock size={12} className="text-orange-700" />
                            <span>{formatTime(w.from)} – {formatTime(w.to)}</span>
                            <span className="text-gray-600">Driver: {w.driverName || '—'}</span>
                            <span className="text-gray-500">{w.requestCode}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-500">Free all day</span>
                    )}
                  </td>
                </tr>
              );
            })}

            {!loading && !filtered.length ? (
              <tr>
                <td colSpan={4} className="px-3 py-6 text-center text-gray-500">No vehicles found</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
