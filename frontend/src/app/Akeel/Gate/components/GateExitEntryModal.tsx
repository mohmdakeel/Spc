'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { X, Gauge, Fuel, MessageSquare } from 'lucide-react';

type Props = {
  mode: 'exit' | 'entry';
  open: boolean;
  onClose: () => void;
  onSubmit: (p: { odometer?: number | null; fuel?: number | null; remarks?: string | null }) => Promise<void> | void;
};

export default function GateExitEntryModal({ mode, open, onClose, onSubmit }: Props) {
  const [odometer, setOdometer] = useState<string>('');
  const [fuel, setFuel] = useState<string>('');   // percent 0-100 (optional)
  const [remarks, setRemarks] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setOdometer('');
    setFuel('');
    setRemarks('');
    setErr(null);
  }, [open]);

  const title = useMemo(() => (mode === 'exit' ? 'Mark Exit' : 'Mark Entry'), [mode]);

  const valid = useMemo(() => {
    if (odometer && isNaN(Number(odometer))) return false;
    if (fuel && (isNaN(Number(fuel)) || Number(fuel) < 0 || Number(fuel) > 100)) return false;
    return true;
  }, [odometer, fuel]);

  const submit = async () => {
    if (!valid) return;
    setSubmitting(true);
    setErr(null);
    try {
      await onSubmit({
        odometer: odometer !== '' ? Number(odometer) : null,
        fuel: fuel !== '' ? Number(fuel) : null,
        remarks: remarks.trim() || null,
      });
      onClose();
    } catch (e: any) {
      setErr(e?.message || 'Failed to submit');
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  const L = (s: string) => <label className="block text-[13px] font-medium text-orange-800 mb-1">{s}</label>;

  return (
    <div className="fixed inset-0 bg-black/40 grid place-items-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b bg-orange-50">
          <h3 className="font-bold text-orange-900">{title}</h3>
          <button className="p-2 rounded hover:bg-orange-100" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {err && <div className="text-sm rounded border border-red-300 bg-red-50 text-red-800 px-3 py-2">{err}</div>}

          <div>
            {L(mode === 'exit' ? 'Exit Odometer (km)' : 'Entry Odometer (km)')}
            <div className="relative">
              <Gauge size={16} className="absolute left-2 top-2.5 text-orange-600" />
              <input
                inputMode="numeric"
                className="w-full border rounded pl-8 pr-3 py-2 border-orange-200"
                placeholder="e.g. 125430"
                value={odometer}
                onChange={(e) => setOdometer(e.target.value.replace(/[^\d]/g, ''))}
              />
            </div>
            <div className="text-[11px] text-orange-600 mt-1">Leave blank if unknown.</div>
          </div>

          <div>
            {L(mode === 'exit' ? 'Fuel Before (%)' : 'Fuel After (%)')}
            <div className="relative">
              <Fuel size={16} className="absolute left-2 top-2.5 text-orange-600" />
              <input
                inputMode="numeric"
                className="w-full border rounded pl-8 pr-3 py-2 border-orange-200"
                placeholder="0–100"
                value={fuel}
                onChange={(e) => setFuel(e.target.value.replace(/[^\d]/g, ''))}
              />
            </div>
            <div className="text-[11px] text-orange-600 mt-1">Optional. 0–100 range.</div>
          </div>

          <div>
            {L('Remarks')}
            <div className="relative">
              <MessageSquare size={16} className="absolute left-2 top-2.5 text-orange-600" />
              <textarea
                rows={3}
                className="w-full border rounded pl-8 pr-3 py-2 border-orange-200"
                placeholder="Any notes to store with the manifest"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t bg-orange-50 flex justify-end gap-2">
          <button className="px-4 py-2 rounded border" onClick={onClose}>Cancel</button>
          <button
            className="px-4 py-2 rounded bg-orange-600 text-white disabled:opacity-60"
            disabled={!valid || submitting}
            onClick={submit}
          >
            {submitting ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
