import React from "react";
import { Driver } from "../services/driverService";
import {
  X, User, Phone, Mail, FileText, Trash2, Clock, Edit, Calendar, Award, ActivitySquare
} from "lucide-react";

const formatDate = (date: any) => (date ? new Date(date).toLocaleString() : "-");

const DeletedDriverModal = ({
  driver,
  onClose,
}: {
  driver: Driver;
  onClose: () => void;
}) => (
  <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
      {/* Modal Header */}
      <div className="bg-red-600 text-white p-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Trash2 size={20} />
          <h2 className="text-lg font-semibold">Deleted Driver Details</h2>
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
        <div className="space-y-4">
          {/* Driver ID */}
          <div className="flex items-start gap-3">
            <div className="bg-red-100 p-2 rounded-full">
              <User className="text-red-600" size={18} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Driver ID</p>
              <p className="font-medium">{driver.employeeId}</p>
            </div>
          </div>

          {/* Name */}
          <div className="flex items-start gap-3">
            <div className="bg-red-100 p-2 rounded-full">
              <User className="text-red-600" size={18} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Name</p>
              <p className="font-medium">{driver.name}</p>
            </div>
          </div>

          {/* Phone */}
          <div className="flex items-start gap-3">
            <div className="bg-red-100 p-2 rounded-full">
              <Phone className="text-red-600" size={18} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Phone</p>
              <p className="font-medium">{driver.phone}</p>
            </div>
          </div>

          {/* Email */}
          <div className="flex items-start gap-3">
            <div className="bg-red-100 p-2 rounded-full">
              <Mail className="text-red-600" size={18} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-medium">{driver.email}</p>
            </div>
          </div>

          {/* License Number */}
          <div className="flex items-start gap-3">
            <div className="bg-red-100 p-2 rounded-full">
              <FileText className="text-red-600" size={18} />
            </div>
            <div>
              <p className="text-sm text-gray-500">License Number</p>
              <p className="font-medium">{driver.licenseNumber}</p>
            </div>
          </div>

          {/* License Expiry */}
          <div className="flex items-start gap-3">
            <div className="bg-red-100 p-2 rounded-full">
              <Calendar className="text-red-600" size={18} />
            </div>
            <div>
              <p className="text-sm text-gray-500">License Expiry Date</p>
              <p className="font-medium">
                {driver.licenseExpiryDate
                  ? new Date(driver.licenseExpiryDate).toLocaleDateString()
                  : "-"}
              </p>
            </div>
          </div>

          {/* Experience */}
          <div className="flex items-start gap-3">
            <div className="bg-red-100 p-2 rounded-full">
              <Award className="text-red-600" size={18} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Driving Experience</p>
              <p className="font-medium">
                {driver.drivingExperience !== undefined ? driver.drivingExperience + " years" : "-"}
              </p>
            </div>
          </div>

          {/* Status */}
          <div className="flex items-start gap-3">
            <div className="bg-red-100 p-2 rounded-full">
              <ActivitySquare className="text-red-600" size={18} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Status</p>
              <p className="font-medium">{driver.status ?? "-"}</p>
            </div>
          </div>
        </div>

        {/* Audit Information */}
        <div className="mt-6 pt-4 border-t border-red-100 space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <Clock className="text-gray-400" size={16} />
            <span className="text-gray-500">
              Created by {driver.createdBy} at {formatDate(driver.createdAt)}
            </span>
          </div>
          {driver.updatedAt && (
            <div className="flex items-center gap-2 text-sm">
              <Edit className="text-gray-400" size={16} />
              <span className="text-gray-500">
                Updated by {driver.updatedBy} at {formatDate(driver.updatedAt)}
              </span>
            </div>
          )}
          {driver.deletedAt && (
            <div className="flex items-center gap-2 text-sm">
              <Trash2 className="text-gray-400" size={16} />
              <span className="text-gray-500">
                Deleted by {driver.deletedBy || "system"} at {formatDate(driver.deletedAt)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Modal Footer */}
      <div className="px-6 pb-4 flex justify-end border-t border-red-100 pt-4">
        <button
          onClick={onClose}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  </div>
);

export default DeletedDriverModal;
