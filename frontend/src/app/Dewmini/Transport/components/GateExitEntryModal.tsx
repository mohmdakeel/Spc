'use client';
import React, { useState } from 'react';
import { X } from 'lucide-react';

type Mode = 'exit' | 'entry';

export default function GateExitEntryModal({
  mode, open, onClose, onSubmit,
}: {
  mode: Mode;
  open: boolean;
  onClose: () => void;
  onSubmit: (data: { odometer?: number | null; fuel?: number | null; remarks?: string | null }) => void;
}) {
  const [odometer, setOdometer] = useState<number | ''>('');
  const [fuel, setFuel] = useState<number | ''>('');
  const [remarks, setRemarks] = useState('');
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 grid place-items-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md" onClick={e=>e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-3 border-b bg-orange-50">
          <h3 className="font-semibold text-orange-900">{mode === 'exit' ? 'Log Gate EXIT' : 'Log Gate ENTRY'}</h3>
          <button className="p-2 rounded hover:bg-orange-100" onClick={onClose} aria-label="Close"><X size={18}/></button>
        </div>

        <div className="p-5 space-y-3">
          <div>
            <label className="block text-sm font-medium text-orange-800 mb-1">Odometer (km) — {mode==='exit'?'Start':'End'}</label>
            <input type="number" className="w-full border rounded px-3 py-2"
              value={odometer} onChange={e=>setOdometer(e.target.value===''?'':Number(e.target.value))} min={0}
              placeholder={mode==='exit'?'e.g., 125000':'e.g., 125320'}/>
          </div>
          <div>
            <label className="block text-sm font-medium text-orange-800 mb-1">Fuel {mode==='exit'?'Before':'After'} (%)</label>
            <input type="number" className="w-full border rounded px-3 py-2"
              value={fuel} onChange={e=>setFuel(e.target.value===''?'':Number(e.target.value))} min={0} max={100} placeholder="0–100"/>
          </div>
          <div>
            <label className="block text-sm font-medium text-orange-800 mb-1">Remarks</label>
            <textarea className="w-full border rounded px-3 py-2" rows={3}
              value={remarks} onChange={e=>setRemarks(e.target.value)} placeholder="Optional note"/>
          </div>
        </div>

        <div className="px-5 py-3 border-t bg-orange-50 flex justify-end gap-2">
          <button className="px-4 py-2 rounded border" onClick={onClose}>Cancel</button>
          <button className="px-4 py-2 rounded bg-orange-600 text-white"
            onClick={()=>onSubmit({
              odometer: odometer===''?null:Number(odometer),
              fuel: fuel===''?null:Number(fuel),
              remarks: remarks?.trim()||null
            })}
          >Save</button>
        </div>
      </div>
    </div>
  );
}
