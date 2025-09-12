'use client';
import React from 'react';
import { X } from 'lucide-react';

type Field = { label: string; value?: React.ReactNode; };

export default function EntityModal({
  title, fields, onClose, status, extraActions,
}: {
  title: string;
  fields: Field[];
  onClose: () => void;
  status?: string;
  extraActions?: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-orange-50 rounded-xl shadow-xl w-full max-w-4xl overflow-hidden border border-orange-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-orange-200 bg-orange-100">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-orange-900">{title}</h2>
            {status && (<span className="px-3 py-1 rounded-full text-sm font-medium bg-orange-200 text-orange-800">{status}</span>)}
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-lg hover:bg-orange-200 text-orange-700 transition-all" aria-label="Close" title="Close">
            <X size={22} />
          </button>
        </div>
        <div className="px-6 py-6 bg-white">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            {fields.map((f, i) => (
              <div key={f.label} className={`flex gap-3 p-3 rounded-lg ${i % 2 === 0 ? 'bg-orange-50' : 'bg-orange-100/50'}`}>
                <div className="w-40 shrink-0 text-orange-700 font-semibold">{f.label}:</div>
                <div className="text-orange-900 break-words flex-1 font-medium">{f.value ?? '-'}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="px-6 py-4 flex items-center justify-between gap-4 border-t border-orange-200 bg-orange-100">
          <div className="flex-1">{extraActions}</div>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-lg bg-orange-600 text-white hover:bg-orange-700 transition-all font-semibold shadow-md hover:shadow-lg">
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
