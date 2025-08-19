import React from "react";
import { Driver } from "../services/driverService";
import { X, User, AlertTriangle, Trash2 } from "lucide-react";

// Define the Props interface
interface Props {
  driver: Driver;
  onConfirm: () => void;
  onClose: () => void;
}

const DeleteConfirmModal = ({ driver, onConfirm, onClose }: Props) => (
  <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
      {/* Modal Header */}
      <div className="bg-red-600 text-white p-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <AlertTriangle size={20} />
          <h2 className="text-lg font-semibold">Confirm Deletion</h2>
        </div>
        <button 
          onClick={onClose} 
          className="text-white hover:text-red-200 transition-colors"
        >
          <X size={24} />
        </button>
      </div>

      {/* Modal Body */}
      <div className="p-6">
        <div className="flex flex-col items-center text-center">
          <div className="bg-red-100 p-3 rounded-full mb-4">
            <AlertTriangle className="text-red-600" size={32} />
          </div>
          <h3 className="text-lg font-medium text-gray-800 mb-2">
            Delete Driver: <span className="text-orange-600">{driver?.name}</span>?
          </h3>
          <p className="text-gray-600 mb-6">
            This action cannot be undone. All associated data will be permanently removed.
          </p>
        </div>
      </div>

      {/* Modal Footer */}
      <div className="px-6 pb-4 flex justify-end gap-3 border-t border-red-100 pt-4">
        <button
          onClick={onClose}
          className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
        >
          <Trash2 size={18} />
          Delete Driver
        </button>
      </div>
    </div>
  </div>
);

export default DeleteConfirmModal;