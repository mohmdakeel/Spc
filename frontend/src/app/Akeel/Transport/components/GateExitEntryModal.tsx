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
  onSubmit: (data: { odometer?: number | null; remarks?: string | null; password: string }) => void;
}) {
  const [odometer, setOdometer] = useState<number | ''>('');
  const [remarks, setRemarks] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState<string | null>(null);
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
            <label className="block text-sm font-medium text-orange-800 mb-1">Remarks</label>
            <textarea className="w-full border rounded px-3 py-2" rows={3}
              value={remarks} onChange={e=>setRemarks(e.target.value)} placeholder="Optional note"/>
          </div>
          <div>
            <label className="block text-sm font-medium text-orange-800 mb-1">Confirm with password</label>
            <input
              type="password"
              className="w-full border rounded px-3 py-2"
              value={password}
              onChange={e=>setPassword(e.target.value)}
              placeholder="Enter your password to confirm"
            />
          </div>
          {err && <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">{err}</div>}
        </div>

        <div className="px-5 py-3 border-t bg-orange-50 flex justify-end gap-2">
          <button className="px-4 py-2 rounded border" onClick={onClose}>Cancel</button>
          <button className="px-4 py-2 rounded bg-orange-600 text-white"
            onClick={() => {
              if (password.trim() === '') {
                setErr('Password required to confirm.');
                return;
              }
              setErr(null);
              onSubmit({
                odometer: odometer===''?null:Number(odometer),
                remarks: remarks?.trim()||null,
                password: password.trim(),
              });
            }}
          >Save</button>
        </div>
      </div>
    </div>
  );
}
