import React from "react";

export default function DeleteConfirmModal({
  title,
  message,
  onConfirm,
  onClose,
}: {
  title?: string;
  message?: string;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow p-6 w-[420px]">
        <h3 className="text-lg font-bold mb-2">{title ?? "Confirm Delete"}</h3>
        <p className="text-sm text-gray-600">{message ?? "Are you sure you want to delete this item?"}</p>
        <div className="flex justify-end gap-2 mt-5">
          <button className="px-4 py-2 rounded bg-gray-200 text-gray-800" onClick={onClose}>Cancel</button>
          <button className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700" onClick={onConfirm}>Delete</button>
        </div>
      </div>
    </div>
  );
}
