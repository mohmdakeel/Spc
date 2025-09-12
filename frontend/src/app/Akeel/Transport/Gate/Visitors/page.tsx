'use client';
import React, { useMemo, useState } from 'react';
import SearchBar from '../../components/SearchBar';
import { Th, Td } from '../../components/ThTd';

type VisitorLog = {
  id: number;
  plate: string;
  driverName?: string;
  purpose?: string;
  company?: string;
  enterAt?: string;  // ISO
  exitAt?: string;   // ISO
  remarks?: string;
};

const nowLocal = () => new Date().toISOString().slice(0,16); // yyyy-mm-ddTHH:mm

export default function VisitorVehiclesPage() {
  const [list, setList] = useState<VisitorLog[]>([]);
  const [q, setQ] = useState('');
  const [form, setForm] = useState<VisitorLog>({
    id: 0, plate: '', driverName: '', company: '', purpose: '', enterAt: nowLocal(), exitAt: '', remarks: ''
  });

  const addOrUpdate = () => {
    if (!form.plate.trim()) return;
    if (form.id) {
      setList(prev => prev.map(r => r.id === form.id ? form : r));
    } else {
      setList(prev => [{ ...form, id: Date.now() }, ...prev]);
    }
    setForm({ id: 0, plate: '', driverName: '', company: '', purpose: '', enterAt: nowLocal(), exitAt: '', remarks: '' });
  };

  const markExit = (id: number) => {
    setList(prev => prev.map(r => r.id === id ? { ...r, exitAt: nowLocal() } : r));
  };

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return list;
    return list.filter(r =>
      [r.plate, r.driverName, r.company, r.purpose, r.remarks]
        .map(v => (v ?? '').toString().toLowerCase()).join(' ').includes(s)
    );
  }, [list, q]);

  return (
    <div className="min-h-screen bg-orange-50 p-4 space-y-4">
      <div className="bg-white rounded-xl border border-orange-200 p-4">
        <h1 className="text-xl font-bold text-gray-800 mb-3">Visitor Vehicles</h1>

        {/* Form */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-sm font-medium text-orange-800 mb-1">Plate *</label>
            <input className="w-full border border-orange-200 rounded px-3 py-2"
                   value={form.plate} onChange={e=>setForm(f=>({...f, plate: e.target.value}))}/>
          </div>
          <div>
            <label className="block text-sm font-medium text-orange-800 mb-1">Driver</label>
            <input className="w-full border border-orange-200 rounded px-3 py-2"
                   value={form.driverName||''} onChange={e=>setForm(f=>({...f, driverName: e.target.value}))}/>
          </div>
          <div>
            <label className="block text-sm font-medium text-orange-800 mb-1">Company</label>
            <input className="w-full border border-orange-200 rounded px-3 py-2"
                   value={form.company||''} onChange={e=>setForm(f=>({...f, company: e.target.value}))}/>
          </div>
          <div>
            <label className="block text-sm font-medium text-orange-800 mb-1">Purpose</label>
            <input className="w-full border border-orange-200 rounded px-3 py-2"
                   value={form.purpose||''} onChange={e=>setForm(f=>({...f, purpose: e.target.value}))}/>
          </div>
          <div>
            <label className="block text-sm font-medium text-orange-800 mb-1">Enter At</label>
            <input type="datetime-local" className="w-full border border-orange-200 rounded px-3 py-2"
                   value={form.enterAt||''} onChange={e=>setForm(f=>({...f, enterAt: e.target.value}))}/>
          </div>
          <div>
            <label className="block text-sm font-medium text-orange-800 mb-1">Exit At</label>
            <input type="datetime-local" className="w-full border border-orange-200 rounded px-3 py-2"
                   value={form.exitAt||''} onChange={e=>setForm(f=>({...f, exitAt: e.target.value}))}/>
          </div>
          <div className="md:col-span-3">
            <label className="block text-sm font-medium text-orange-800 mb-1">Remarks</label>
            <input className="w-full border border-orange-200 rounded px-3 py-2"
                   value={form.remarks||''} onChange={e=>setForm(f=>({...f, remarks: e.target.value}))}/>
          </div>
        </div>

        <div className="mt-3 flex gap-2">
          <button className="px-4 py-2 rounded bg-orange-600 text-white" onClick={addOrUpdate}>
            {form.id ? 'Update' : 'Add'}
          </button>
          {form.id ? (
            <button className="px-4 py-2 rounded border" onClick={()=>setForm({ id:0, plate:'', driverName:'', company:'', purpose:'', enterAt: nowLocal(), exitAt:'', remarks:'' })}>
              Cancel Edit
            </button>
          ) : null}
        </div>
      </div>

      {/* List */}
      <div className="bg-white rounded-xl border border-orange-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-orange-900">Logs</h2>
          <SearchBar value={q} onChange={setQ} placeholder="Search plate, driver, company, purpose…" />
        </div>

        <div className="overflow-x-auto rounded border border-orange-100">
          <table className="w-full text-sm">
            <thead className="bg-orange-50"><tr>
              <Th>#</Th><Th>Plate</Th><Th>Driver</Th><Th>Company</Th><Th>Purpose</Th><Th>Enter</Th><Th>Exit</Th><Th className="text-center">Actions</Th>
            </tr></thead>
            <tbody className="divide-y">
              {filtered.map((r, i)=>(
                <tr key={r.id}>
                  <Td>{i+1}</Td>
                  <Td className="font-semibold">{r.plate}</Td>
                  <Td>{r.driverName||'-'}</Td>
                  <Td>{r.company||'-'}</Td>
                  <Td>{r.purpose||'-'}</Td>
                  <Td>{r.enterAt ? new Date(r.enterAt).toLocaleString() : '-'}</Td>
                  <Td>{r.exitAt ? new Date(r.exitAt).toLocaleString() : '-'}</Td>
                  <Td className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button className="px-3 py-1 rounded bg-orange-100 text-orange-800"
                              onClick={()=>setForm(r)}>Edit</button>
                      {!r.exitAt && (
                        <button className="px-3 py-1 rounded bg-green-600 text-white"
                                onClick={()=>markExit(r.id)}>Mark Exit</button>
                      )}
                    </div>
                  </Td>
                </tr>
              ))}
              {!filtered.length && <tr><Td colSpan={8} className="text-center text-gray-500 py-6">No visitor logs</Td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
