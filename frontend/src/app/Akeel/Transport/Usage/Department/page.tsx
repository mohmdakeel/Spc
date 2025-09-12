'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import {
  createUsageRequest, listAllRequests,
  hodApprove, hodReject, mgmtApprove, mgmtReject,
  type UsageRequest
} from '../../services/usageService';
import { Th, Td } from '../../components/ThTd';
import StatusPill from '../../components/StatusPill';

const ROW = 'text-xs'; const PX='px-2'; const PY='py-2'; const HEAD='text-xs font-semibold text-orange-800';

export default function DepartmentRequestsPage() {
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [list, setList] = useState<UsageRequest[]>([]);
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({
    applicantName:'', employeeId:'', department:'',
    dateOfTravel:'', timeFrom:'', timeTo:'',
    fromLocation:'', toLocation:'', officialDescription:'', goods:'',
    actor:'admin' // for demo
  });

  const resetForm = () => {
    setForm({
      applicantName:'', employeeId:'', department:'',
      dateOfTravel:'', timeFrom:'', timeTo:'',
      fromLocation:'', toLocation:'', officialDescription:'', goods:'',
      actor:'admin'
    });
  };

  const load = async () => {
    setLoading(true);
    try { setList(await listAllRequests()); } 
    catch (e:any) { toast.error(e.message || 'Failed'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if(!q) return list;
    return list.filter(r =>
      `${r.requestCode} ${r.applicantName} ${r.employeeId} ${r.department} ${r.fromLocation} ${r.toLocation} ${r.status}`
      .toLowerCase().includes(q)
    );
  }, [list, search]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if(!form.applicantName || !form.employeeId || !form.department || !form.dateOfTravel || !form.timeFrom || !form.timeTo) {
        toast.warn('Please fill required fields'); return;
      }
      await createUsageRequest(form);
      toast.success('Request submitted to HOD');
      resetForm();
      setShowForm(false);
      await load();
    } catch (e:any) { toast.error(e.message || 'Failed'); }
  };

  const act = async (fn: Function, id: number, label: string) => {
    try { await fn(id, 'admin', prompt(`${label} remarks (optional)`) || undefined); await load(); }
    catch (e:any) { toast.error(e.message || 'Failed'); }
  };

  // close on ESC
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setShowForm(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="p-4">
      {/* Header row with Add button */}
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-lg font-bold">Department Vehicle Requests</h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-orange-600 hover:bg-orange-700 text-white rounded px-4 py-2 text-sm"
        >
          + Add Request
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow p-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold">All Requests</h2>
          <input
            className="border rounded px-2 py-1 text-sm"
            placeholder="Search…"
            value={search}
            onChange={e=>setSearch(e.target.value)}
          />
        </div>

        <div className="overflow-x-auto rounded border border-orange-100 mt-3">
          <table className="w-full">
            <colgroup>
              <col className="w-[10%]"/><col className="w-[14%]"/><col className="w-[10%]"/><col className="w-[18%]"/>
              <col className="w-[20%]"/><col className="w-[12%]"/><col className="w-[16%]"/>
            </colgroup>
            <thead className="bg-orange-50">
              <tr>
                <Th className={HEAD}>Code</Th>
                <Th className={HEAD}>Applicant</Th>
                <Th className={HEAD}>Dept</Th>
                <Th className={HEAD}>Route</Th>
                <Th className={HEAD}>Time</Th>
                <Th className={HEAD}>Status</Th>
                <Th className={`${HEAD} text-center`}>Actions</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-orange-100">
              {filtered.map(r=>(
                <tr key={r.id} className="hover:bg-orange-50">
                  <Td className={`${PX} ${PY} ${ROW}`}>{r.requestCode}</Td>
                  <Td className={`${PX} ${PY} ${ROW}`}>{r.applicantName} ({r.employeeId})</Td>
                  <Td className={`${PX} ${PY} ${ROW}`}>{r.department}</Td>
                  <Td className={`${PX} ${PY} ${ROW}`}>{r.fromLocation} → {r.toLocation}</Td>
                  <Td className={`${PX} ${PY} ${ROW}`}>{r.dateOfTravel} {r.timeFrom}–{r.timeTo}</Td>
                  <Td className={`${PX} ${PY}`}><StatusPill mode="vehicle" value={r.status as any} editable={false}/></Td>
                  <Td className={`${PX} ${PY}`}>
                    <div className="flex gap-2 justify-center">
                      {r.status==='PENDING_HOD' && (
                        <>
                          <button className="px-2 py-1 text-xs rounded bg-green-600 text-white" onClick={()=>act(hodApprove, r.id, 'HOD Approve')}>HOD Approve</button>
                          <button className="px-2 py-1 text-xs rounded bg-red-600 text-white"   onClick={()=>act(hodReject, r.id, 'HOD Reject')}>HOD Reject</button>
                        </>
                      )}
                      {r.status==='PENDING_MANAGEMENT' && (
                        <>
                          <button className="px-2 py-1 text-xs rounded bg-green-600 text-white" onClick={()=>act(mgmtApprove, r.id, 'Management Approve')}>Mgmt Approve</button>
                          <button className="px-2 py-1 text-xs rounded bg-red-600 text-white"   onClick={()=>act(mgmtReject, r.id, 'Management Reject')}>Mgmt Reject</button>
                        </>
                      )}
                      {r.status==='APPROVED' && (
                        <a href="/Akeel/Transport/Usage/Scheduling" className="px-2 py-1 text-xs rounded bg-blue-600 text-white">Assign</a>
                      )}
                    </div>
                  </Td>
                </tr>
              ))}
              {filtered.length===0 && (
                <tr><Td colSpan={7} className="text-center py-6 text-gray-500 text-sm">
                  {loading ? 'Loading…' : 'No data'}
                </Td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: New Vehicle Request Form */}
      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          aria-modal="true"
          role="dialog"
        >
          <div className="absolute inset-0 bg-black/40" onClick={()=>setShowForm(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-5xl mx-4">
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <h3 className="text-base font-semibold">New Vehicle Request</h3>
              <button
                onClick={()=>setShowForm(false)}
                className="rounded p-2 hover:bg-gray-100"
                aria-label="Close"
              >✕</button>
            </div>

            <form onSubmit={submit} className="p-5 grid md:grid-cols-4 gap-3">
              <input className="border rounded px-2 py-1" placeholder="Applicant Name*" value={form.applicantName} onChange={e=>setForm({...form, applicantName:e.target.value})}/>
              <input className="border rounded px-2 py-1" placeholder="Employee ID*" value={form.employeeId} onChange={e=>setForm({...form, employeeId:e.target.value})}/>
              <input className="border rounded px-2 py-1" placeholder="Department*" value={form.department} onChange={e=>setForm({...form, department:e.target.value})}/>
              <input type="date" className="border rounded px-2 py-1" value={form.dateOfTravel} onChange={e=>setForm({...form, dateOfTravel:e.target.value})}/>
              <input type="time" className="border rounded px-2 py-1" value={form.timeFrom} onChange={e=>setForm({...form, timeFrom:e.target.value})}/>
              <input type="time" className="border rounded px-2 py-1" value={form.timeTo} onChange={e=>setForm({...form, timeTo:e.target.value})}/>
              <input className="border rounded px-2 py-1" placeholder="From Location" value={form.fromLocation} onChange={e=>setForm({...form, fromLocation:e.target.value})}/>
              <input className="border rounded px-2 py-1" placeholder="To Location" value={form.toLocation} onChange={e=>setForm({...form, toLocation:e.target.value})}/>
              <input className="md:col-span-2 border rounded px-2 py-1" placeholder="Goods (optional)" value={form.goods} onChange={e=>setForm({...form, goods:e.target.value})}/>
              <input className="md:col-span-2 border rounded px-2 py-1" placeholder="Official trip description (optional)" value={form.officialDescription} onChange={e=>setForm({...form, officialDescription:e.target.value})}/>
              
              <div className="md:col-span-4 flex items-center justify-between mt-2">
                <input className="border rounded px-2 py-1 text-sm" placeholder="Actor (for demo)" value={form.actor} onChange={e=>setForm({...form, actor:e.target.value})}/>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={()=>{ resetForm(); setShowForm(false); }}
                    className="rounded px-4 py-2 text-sm border"
                  >
                    Cancel
                  </button>
                  <button className="bg-orange-600 text-white rounded px-4 py-2 text-sm">
                    Submit
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
