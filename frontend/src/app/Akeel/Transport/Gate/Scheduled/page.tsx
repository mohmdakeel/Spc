'use client';
import React, { useEffect, useState } from 'react';
import { Th, Td } from '../../components/ThTd';
import { listByStatus, gateExit, gateEntry } from '../../services/usageService';
import type { UsageRequest } from '../../services/types';
import GateExitEntryModal from '../../components/GateExitEntryModal';
import { toast } from 'react-toastify';
import { login } from '../../../../../lib/auth';

const fmtDT = (s?: string | null) => (s ? new Date(s).toLocaleString() : '-');

export default function GateScheduledPage() {
  const [scheduled, setScheduled] = useState<UsageRequest[]>([]);
  const [dispatched, setDispatched] = useState<UsageRequest[]>([]);
  const [openExitFor, setOpenExitFor] = useState<UsageRequest|null>(null);
  const [openEntryFor, setOpenEntryFor] = useState<UsageRequest|null>(null);

  const load = async ()=>{
    try {
      const [sch, disp] = await Promise.all([listByStatus('SCHEDULED'), listByStatus('DISPATCHED')]);
      setScheduled(sch||[]); setDispatched(disp||[]);
    } catch (e:any) {
      toast.error(e?.message || 'Failed to load gate queues');
      setScheduled([]); setDispatched([]);
    }
  };
  useEffect(()=>{ load(); },[]);

  return (
    <div className="space-y-6 min-h-screen bg-orange-50 p-4">
      <div>
        <h1 className="text-lg font-bold text-orange-900 mb-2">Scheduled Vehicles</h1>
        <div className="bg-white rounded-xl border border-orange-200 overflow-x-auto">
          <table className="w-full">
            <thead className="bg-orange-50"><tr>
              <Th>Code</Th><Th>Vehicle</Th><Th>Driver</Th><Th>Pickup</Th><Th>Return</Th><Th className="text-center">Action</Th>
            </tr></thead>
            <tbody className="divide-y">
              {scheduled.map(r=>(
                <tr key={r.id}>
                  <Td>{r.requestCode}</Td>
                  <Td>{r.assignedVehicleNumber||'-'}</Td>
                  <Td>{r.assignedDriverName||'-'}</Td>
                  <Td>{fmtDT(r.scheduledPickupAt)}</Td>
                  <Td>{fmtDT(r.scheduledReturnAt)}</Td>
                  <Td className="text-center">
                    <button className="px-3 py-1 rounded bg-orange-600 text-white"
                            onClick={()=>setOpenExitFor(r)}>Mark Exit</button>
                  </Td>
                </tr>
              ))}
              {!scheduled.length && <tr><Td colSpan={6} className="text-center text-gray-500 py-6">No scheduled vehicles</Td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-bold text-orange-900 mb-2">On Trip (Dispatched)</h2>
        <div className="bg-white rounded-xl border border-orange-200 overflow-x-auto">
          <table className="w-full">
            <thead className="bg-orange-50"><tr>
              <Th>Code</Th><Th>Vehicle</Th><Th>Driver</Th><Th>Exit Time</Th><Th>Exit Odometer</Th><Th className="text-center">Action</Th>
            </tr></thead>
            <tbody className="divide-y">
              {dispatched.map(r=>(
                <tr key={r.id}>
                  <Td>{r.requestCode}</Td>
                  <Td>{r.assignedVehicleNumber||'-'}</Td>
                  <Td>{r.assignedDriverName||'-'}</Td>
                  <Td>{fmtDT(r.gateExitAt)}</Td>
                  <Td>{r.exitOdometer ?? '-'}</Td>
                  <Td className="text-center">
                    <button className="px-3 py-1 rounded bg-green-600 text-white"
                            onClick={()=>setOpenEntryFor(r)}>Mark Entry</button>
                  </Td>
                </tr>
              ))}
              {!dispatched.length && <tr><Td colSpan={6} className="text-center text-gray-500 py-6">None</Td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* exit / entry modals */}
      {openExitFor && (
        <GateExitEntryModal
          mode="exit"
          open={!!openExitFor}
          onClose={()=>setOpenExitFor(null)}
          onSubmit={async (p)=>{
            try{
              const username = typeof window !== 'undefined' ? window.localStorage.getItem('username') : null;
              if (!username) throw new Error('Session user missing. Please re-login.');
              await login({ username, password: p.password });
              await gateExit(openExitFor.id, {
                odometerStartKm: p.odometer ?? undefined,
                remarks: p.remarks ?? undefined
              });
              toast.success('Exit logged'); setOpenExitFor(null); load();
            }catch(e:any){ toast.error(e?.message||'Failed'); }
          }}
        />
      )}
      {openEntryFor && (
        <GateExitEntryModal
          mode="entry"
          open={!!openEntryFor}
          onClose={()=>setOpenEntryFor(null)}
          onSubmit={async (p)=>{
            try{
              const username = typeof window !== 'undefined' ? window.localStorage.getItem('username') : null;
              if (!username) throw new Error('Session user missing. Please re-login.');
              await login({ username, password: p.password });
              await gateEntry(openEntryFor.id, {
                odometerEndKm: p.odometer ?? undefined,
                remarks: p.remarks ?? undefined
              });
              toast.success('Entry logged'); setOpenEntryFor(null); load();
            }catch(e:any){ toast.error(e?.message||'Failed'); }
          }}
        />
      )}
    </div>
  );
}
