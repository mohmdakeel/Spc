'use client';
import React, { useEffect, useState } from 'react';
import { listByStatus, type UsageRequest } from '../../services/usageService';
import { Th, Td } from '../../components/ThTd';
export default function ReceiveList(){
  const [list,setList]=useState<UsageRequest[]>([]);
  useEffect(()=>{ (async()=>setList(await listByStatus('RETURNED')))(); },[]);
  return (
    <div className="p-4 bg-white rounded-xl shadow">
      <h1 className="font-bold mb-3">Returned (Completed)</h1>
      <table className="w-full"><thead className="bg-orange-50"><tr><Th>Code</Th><Th>Vehicle</Th><Th>Entry Time</Th></tr></thead>
      <tbody className="divide-y">{list.map(r=><tr key={r.id}><Td>{r.requestCode}</Td><Td>{r.assignedVehicleNumber}</Td><Td>{r.gateEntryAt?new Date(r.gateEntryAt).toLocaleString():'-'}</Td></tr>)}
      {list.length===0 && <tr><Td colSpan={3} className="text-center py-6 text-gray-500">No data</Td></tr>}</tbody></table>
    </div>
  );
}
