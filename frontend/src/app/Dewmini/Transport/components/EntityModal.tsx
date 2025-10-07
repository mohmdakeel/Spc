'use client';
import React from 'react';
import { X } from 'lucide-react';

type Field = { label: string; value?: React.ReactNode };

export default function EntityModal({
  title, fields, onClose, status, extraActions, top,
}: {
  title: string;
  fields: Field[];
  onClose: () => void;
  status?: string;
  extraActions?: React.ReactNode;
  top?: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-2 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="bg-orange-50 rounded-none sm:rounded-xl shadow-xl w-full h-full sm:h-auto sm:max-h-[92vh] sm:w-[min(100%,56rem)] overflow-hidden border border-orange-200 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-orange-200 bg-orange-100">
          <div className="flex items-center gap-2 sm:gap-3">
            <h2 id="modal-title" className="text-lg sm:text-xl font-bold text-orange-900">{title}</h2>
            {status && (
              <span className="px-2.5 py-0.5 rounded-full text-xs sm:text-sm font-medium bg-orange-200 text-orange-800">
                {status}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-orange-200 text-orange-700 transition-all focus:outline-none"
            aria-label="Close modal"
            title="Close"
          >
            <X size={22} />
          </button>
        </div>

        {/* Body */}
        <div className="px-4 sm:px-6 py-4 sm:py-5 bg-white overflow-auto flex-1">
          {top && <div className="mb-4 sm:mb-5">{top}</div>}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 text-sm">
            {fields.map((f, i) => (
              <div
                key={`${f.label}-${i}`}
                className={`flex gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg ${i % 2 === 0 ? 'bg-orange-50' : 'bg-orange-100/50'}`}
              >
                <div className="w-32 sm:w-40 shrink-0 text-orange-700 font-semibold">{f.label}:</div>
                <div className="text-orange-900 break-words flex-1 font-medium">{f.value ?? '-'}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-2 sm:gap-4 border-t border-orange-200 bg-orange-100">
          <div className="flex-1">{extraActions}</div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg bg-orange-600 text-white hover:bg-orange-700 transition-all font-semibold shadow-md hover:shadow-lg text-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
