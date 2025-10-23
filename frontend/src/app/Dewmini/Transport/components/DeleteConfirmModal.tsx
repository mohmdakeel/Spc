// components/DeleteConfirmModal.tsx
'use client';
import React from 'react';
export default function DeleteConfirmModal({
  title, message, onConfirm, onClose,
}: { title?: string; message?: string; onConfirm: () => void; onClose: () => void; }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-orange-50 rounded-xl shadow-xl p-6 w-full max-w-md border border-orange-200">
        <h3 className="text-lg font-bold text-orange-800 mb-2">{title ?? 'Confirm Delete'}</h3>
        <p className="text-sm text-orange-700/80">{message ?? 'Are you sure you want to delete this item?'}</p>
        <div className="flex justify-end gap-2 mt-5">
          <button className="px-4 py-2 rounded-lg bg-orange-200 text-orange-800 hover:bg-orange-300 transition-all font-medium" onClick={onClose}>Cancel</button>
          <button className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-all font-medium" onClick={onConfirm}>Delete</button>
        </div>
      </div>
    </div>
  );
}