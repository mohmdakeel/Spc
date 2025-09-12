// src/app/Akeel/Transport/Usage/Scheduling/page.tsx
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { listByStatus, poolAssign, type UsageRequest, getAvailability } from '../../services/usageService';
import { fetchVehicles } from '../../services/VehicleService';
import { fetchDrivers } from '../../services/driverService';
import { toast } from 'react-toastify';
import { Th, Td } from '../../components/ThTd';

const ROW='text-xs'; const PX='px-2'; const PY='py-2'; const HEAD='text-xs font-semibold text-orange-800';

type SelectOpt = { value: string; label: string; busy?: boolean; reason?: string };

function toISO(d: string, t: string) {
  // d: yyyy-MM-dd, t: HH:mm
  try { return new Date(`${d}T${t}:00`).toISOString(); } catch { return new Date().toISOString(); }
}

export default function SchedulingPage() {
  const [list, setList] = useState<UsageRequest[]>([]);
  const [search, setSearch] = useState('');
  const [checked, setChecked] = useState<number[]>([]);
  const [open, setOpen] = useState(false);

  // assign form
  const [pickupAt, setPickupAt] = useState('');
  const [expectedReturnAt, setExpectedReturnAt] = useState('');
  const [vehicleOpt, setVehicleOpt] = useState<SelectOpt[]>([]);
  const [driverOpt, setDriverOpt] = useState<SelectOpt[]>([]);
  const [vehicle, setVehicle] = useState<string>('');
  const [driver, setDriver] = useState<string>('');
  const [driverPhone, setDriverPhone] = useState<string>('');
  const [instructions, setInstructions] = useState('');

  const load = async () => {
    setList(await listByStatus('APPROVED'));
  };
  useEffect(()=>{ load(); }, []);

  const filtered = useMemo(()=>{
    const q = search.trim().toLowerCase();
    return list.filter(r => `${r.requestCode} ${r.applicantName} ${r.fromLocation} ${r.toLocation}`.toLowerCase().includes(q));
  }, [list, search]);

  const toggle = (id:number, on:boolean) =>
    setChecked(prev => on ? [...new Set([...prev, id])] : prev.filter(x=>x!==id));

  // prefill window using selected requests
  const prefillWindow = () => {
    const sel = list.filter(r => checked.includes(r.id));
    if (!sel.length) return;
    const starts = sel.map(r => toISO(r.dateOfTravel, r.timeFrom)).map(s=>new Date(s).getTime());
    const ends   = sel.map(r => toISO(r.dateOfTravel, r.timeTo)).map(s=>new Date(s).getTime());
    const min = Math.min(...starts), max = Math.max(...ends);
    const toLocalInput = (ms:number) => new Date(ms - new Date().getTimezoneOffset()*60000).toISOString().slice(0,16);
    setPickupAt(toLocalInput(min));
    setExpectedReturnAt(toLocalInput(max));
  };

  // recompute availability whenever time window changes or modal opens
  useEffect(()=>{
    (async()=>{
      if (!open || !pickupAt || !expectedReturnAt) return;

      // fetch full lists for labels
      const [vehicles, drivers] = await Promise.all([
        fetchVehicles(), fetchDrivers()
      ]);

      // ask backend which are busy
      const avail = await getAvailability(new Date(pickupAt).toISOString(), new Date(expectedReturnAt).toISOString());

      const vehicleBusy = new Map(avail.vehicles.map(v=>[String(v.id||v.vehicleNumber), v]));
      const driverBusy  = new Map(avail.drivers.map(d=>[String(d.id||d.name), d]));

      setVehicleOpt((vehicles||[]).map(v=>{
        const key = String(v.id ?? v.vehicleNumber);
        const b = vehicleBusy.get(key);
        return {
          value: key,
          label: `${v.vehicleNumber} ${b?.busy ? '— BUSY' : '— Available'}${b?.reason ? ` (${b.reason})` : ''}`,
          busy: !!b?.busy,
          reason: b?.reason
        };
      }));
      setDriverOpt((drivers||[]).map(d=>{
        const key = String(d.employeeId || d.name);
        const b = driverBusy.get(key);
        return {
          value: key,
          label: `${d.name} ${b?.busy ? '— BUSY' : '— Available'}${b?.reason ? ` (${b.reason})` : ''}`,
          busy: !!b?.busy,
          reason: b?.reason
        };
      }));
    })();
  }, [open, pickupAt, expectedReturnAt]);

  const openAssign = () => {
    if (!checked.length) { toast.info('Select at least one request'); return; }
    prefillWindow();
    setOpen(true);
  };

  const save = async (e:React.FormEvent) => {
    e.preventDefault();
    if (!checked.length) return;
    if (!pickupAt || !expectedReturnAt || !vehicle || !driver) {
      toast.warn('Select vehicle, driver and time'); return;
    }
    // parse vehicle/driver composite values if you store numeric IDs — here we only have key
    const payload = {
      actor: 'incharge',
      vehicleNumber: vehicle,
      driverName: driver,
      driverPhone,
      pickupAt: new Date(pickupAt),
      expectedReturnAt: new Date(expectedReturnAt),
      instructions
    };
    await poolAssign(checked, payload);
    toast.success('Assigned & scheduled (pooled)');
    setOpen(false); setChecked([]);
    setVehicle(''); setDriver(''); setDriverPhone(''); setInstructions('');
    await load();
  };

  return (
    <div className="p-4">
      <div className="bg-white rounded-xl shadow p-4">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <h1 className="text-lg font-bold">Approved — Assign / Pool</h1>
          <div className="flex gap-2">
            <input className="border rounded px-2 py-1 text-sm" placeholder="Search…" value={search} onChange={e=>setSearch(e.target.value)}/>
            <button
              className="px-3 py-2 rounded bg-blue-600 text-white text-sm disabled:opacity-50"
              disabled={!checked.length}
              onClick={openAssign}
            >
              Assign Selected ({checked.length})
            </button>
          </div>
        </div>

        <div className="overflow-x-auto rounded border border-orange-100 mt-3">
          <table className="w-full">
            <colgroup>
              <col className="w-[4%]"/><col className="w-[10%]"/><col className="w-[18%]"/><col className="w-[10%]"/><col className="w-[21%]"/><col className="w-[21%]"/><col className="w-[16%]"/>
            </colgroup>
            <thead className="bg-orange-50">
              <tr>
                <Th className={`${HEAD} text-center`}>✓</Th>
                <Th className={HEAD}>Code</Th>
                <Th className={HEAD}>Applicant</Th>
                <Th className={HEAD}>Dept</Th>
                <Th className={HEAD}>Route</Th>
                <Th className={HEAD}>Requested Time</Th>
                <Th className={`${HEAD} text-center`}>Quick</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-orange-100">
              {filtered.map(r=>(
                <tr key={r.id}>
                  <Td className={`${PX} ${PY} ${ROW} text-center`}>
                    <input type="checkbox" checked={checked.includes(r.id)} onChange={(e)=>toggle(r.id, e.target.checked)} />
                  </Td>
                  <Td className={`${PX} ${PY} ${ROW}`}>{r.requestCode}</Td>
                  <Td className={`${PX} ${PY} ${ROW}`}>{r.applicantName} ({r.employeeId})</Td>
                  <Td className={`${PX} ${PY} ${ROW}`}>{r.department}</Td>
                  <Td className={`${PX} ${PY} ${ROW}`}>{r.fromLocation} → {r.toLocation}</Td>
                  <Td className={`${PX} ${PY} ${ROW}`}>{r.dateOfTravel} {r.timeFrom}–{r.timeTo}</Td>
                  <Td className={`${PX} ${PY} ${ROW} text-center`}>
                    <button className="px-2 py-1 bg-blue-600 text-white rounded text-xs" onClick={()=>{ setChecked([r.id]); openAssign(); }}>
                      Assign
                    </button>
                  </Td>
                </tr>
              ))}
              {filtered.length===0 && (<tr><Td colSpan={7} className="text-center py-6 text-gray-500">No data</Td></tr>)}
            </tbody>
          </table>
        </div>
      </div>

      {/* Assign / Pool Modal */}
      {open && (
        <div className="fixed inset-0 bg-black/30 grid place-items-center p-4 z-50" onClick={()=>setOpen(false)}>
          <div className="bg-white rounded-xl shadow p-4 w-full max-w-3xl" onClick={e=>e.stopPropagation()}>
            <h2 className="font-bold mb-3">Assign Vehicle (pool {checked.length} request{checked.length>1?'s':''})</h2>
            <form onSubmit={save} className="grid md:grid-cols-2 gap-3">
              <div className="md:col-span-2 grid md:grid-cols-2 gap-3">
                <label className="text-xs text-gray-600">Pickup At<input type="datetime-local" className="mt-1 border rounded px-2 py-1 w-full" value={pickupAt} onChange={e=>setPickupAt(e.target.value)} required/></label>
                <label className="text-xs text-gray-600">Expected Return<input type="datetime-local" className="mt-1 border rounded px-2 py-1 w-full" value={expectedReturnAt} onChange={e=>setExpectedReturnAt(e.target.value)} required/></label>
              </div>

              <label className="text-xs text-gray-600">Vehicle
                <select className="mt-1 border rounded px-2 py-1 w-full"
                  value={vehicle}
                  onChange={e=>setVehicle(e.target.value)}
                  required
                >
                  <option value="">Select vehicle…</option>
                  {vehicleOpt.map(o=>(
                    <option key={o.value} value={o.value} disabled={o.busy}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="text-xs text-gray-600">Driver
                <select className="mt-1 border rounded px-2 py-1 w-full"
                  value={driver}
                  onChange={e=>setDriver(e.target.value)}
                  required
                >
                  <option value="">Select driver…</option>
                  {driverOpt.map(o=>(
                    <option key={o.value} value={o.value} disabled={o.busy}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="text-xs text-gray-600">Driver Phone
                <input className="mt-1 border rounded px-2 py-1 w-full" value={driverPhone} onChange={e=>setDriverPhone(e.target.value)} />
              </label>

              <label className="text-xs text-gray-600 md:col-span-2">Instructions
                <input className="mt-1 border rounded px-2 py-1 w-full" value={instructions} onChange={e=>setInstructions(e.target.value)} />
              </label>

              <div className="md:col-span-2 flex gap-2 justify-end mt-2">
                <button type="button" className="bg-gray-200 rounded px-4 py-2" onClick={()=>setOpen(false)}>Cancel</button>
                <button className="bg-blue-600 text-white rounded px-4 py-2">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
