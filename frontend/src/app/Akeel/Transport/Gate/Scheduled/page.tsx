'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { listByStatus, gateExit, gateEntry, type UsageRequest } from '../../services/usageService';
import { Th, Td } from '../../components/ThTd';
import { toast } from 'react-toastify';

const ROW='text-xs'; const PX='px-2'; const PY='py-2'; const HEAD='text-xs font-semibold text-orange-800';

export default function GatePage() {
  const [list, setList] = useState<UsageRequest[]>([]);
  const [tab, setTab] = useState<'SCHEDULED'|'DISPATCHED'>('SCHEDULED');
  const [search, setSearch] = useState('');

  const load = async () => {
    const a = await listByStatus('SCHEDULED');
    const b = await listByStatus('DISPATCHED');
    setList([...a, ...b]);
  };
  useEffect(()=>{ load(); }, []);

  const filtered = useMemo(()=>{
    const q = search.trim().toLowerCase();
    return list.filter(r => r.status===tab)
               .filter(r => `${r.requestCode} ${r.assignedVehicleNumber} ${r.assignedDriverName}`.toLowerCase().includes(q));
  }, [list, tab, search]);

  const logExit = async (r:UsageRequest) => {
    try {
      const val = window.prompt('Exit Odometer (km) — optional');
      const odo = val && val.trim() !== '' ? Number(val) : undefined;
      await gateExit(r.id, 'gate', Number.isFinite(odo!) ? odo : undefined);
      toast.success('EXIT logged'); await load();
    } catch(e:any){ toast.error(e?.message || 'Failed'); }
  };
  const logEntry = async (r:UsageRequest) => {
    try {
      const val = window.prompt('Entry Odometer (km) — optional');
      const odo = val && val.trim() !== '' ? Number(val) : undefined;
      await gateEntry(r.id, 'gate', Number.isFinite(odo!) ? odo : undefined);
      toast.success('ENTRY logged'); await load();
    } catch(e:any){ toast.error(e?.message || 'Failed'); }
  };

  return (
    <div className="p-4">
      <div className="bg-white rounded-xl shadow p-4">
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <button className={`px-3 py-1 rounded ${tab==='SCHEDULED'?'bg-orange-600 text-white':'bg-orange-100'}`} onClick={()=>setTab('SCHEDULED')}>Scheduled</button>
            <button className={`px-3 py-1 rounded ${tab==='DISPATCHED'?'bg-orange-600 text-white':'bg-orange-100'}`} onClick={()=>setTab('DISPATCHED')}>Departed</button>
          </div>
          <input className="border rounded px-2 py-1 text-sm" placeholder="Search…" value={search} onChange={e=>setSearch(e.target.value)}/>
        </div>

        <div className="overflow-x-auto rounded border border-orange-100 mt-3">
          <table className="w-full">
            <colgroup>
              <col className="w-[12%]"/><col className="w-[16%]"/><col className="w-[14%]"/><col className="w-[20%]"/><col className="w-[22%]"/><col className="w-[16%]"/>
            </colgroup>
            <thead className="bg-orange-50">
              <tr>
                <Th className={HEAD}>Code</Th>
                <Th className={HEAD}>Vehicle</Th>
                <Th className={HEAD}>Driver</Th>
                <Th className={HEAD}>Scheduled</Th>
                <Th className={HEAD}>Actual</Th>
                <Th className={`${HEAD} text-center`}>Action</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-orange-100">
              {filtered.map(r=>(
                <tr key={r.id}>
                  <Td className={`${PX} ${PY} ${ROW}`}>{r.requestCode}</Td>
                  <Td className={`${PX} ${PY} ${ROW}`}>{r.assignedVehicleNumber || '-'}</Td>
                  <Td className={`${PX} ${PY} ${ROW}`}>{r.assignedDriverName || '-'} {r.assignedDriverPhone ? `(${r.assignedDriverPhone})` : ''}</Td>
                  <Td className={`${PX} ${PY} ${ROW}`}>
                    {r.scheduledPickupAt ? new Date(r.scheduledPickupAt).toLocaleString() : '-'}<br/>
                    {r.scheduledReturnAt ? new Date(r.scheduledReturnAt).toLocaleString() : '-'}
                  </Td>
                  <Td className={`${PX} ${PY} ${ROW}`}>
                    Exit: {r.gateExitAt ? new Date(r.gateExitAt).toLocaleString() : '-'}<br/>
                    Entry: {r.gateEntryAt ? new Date(r.gateEntryAt).toLocaleString() : '-'}
                  </Td>
                  <Td className={`${PX} ${PY} ${ROW} text-center`}>
                    {r.status==='SCHEDULED' && (
                      <button className="px-2 py-1 text-xs rounded bg-blue-600 text-white" onClick={()=>logExit(r)}>Log EXIT</button>
                    )}
                    {r.status==='DISPATCHED' && (
                      <button className="px-2 py-1 text-xs rounded bg-green-600 text-white" onClick={()=>logEntry(r)}>Log ENTRY</button>
                    )}
                  </Td>
                </tr>
              ))}
              {filtered.length===0 && (<tr><Td colSpan={6} className="text-center py-6 text-gray-500">No items</Td></tr>)}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
