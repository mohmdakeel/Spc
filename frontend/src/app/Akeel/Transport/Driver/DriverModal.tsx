import React, { useEffect } from "react";
import { Driver } from "../services/driverService";
import { 
  X, Clock, User, Phone, Mail, FileText, Edit, Trash2, History, Calendar, Award, ActivitySquare 
} from "lucide-react";

const formatDate = (date: any) => (date ? new Date(date).toLocaleString() : "-");

const DriverModal = ({
  driver,
  onClose,
  triggerPrint,
  onShowPrev,
}: {
  driver: Driver;
  onClose: () => void;
  triggerPrint?: boolean;
  onShowPrev?: () => void;
}) => {
  useEffect(() => {
    if (triggerPrint) {
      setTimeout(() => {
        window.print();
        onClose();
      }, 500);
    }
  }, [triggerPrint, onClose]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 print:bg-transparent print:p-0">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden print:w-full print:max-w-full print:shadow-none">
        {/* Modal Header */}
        <div className="bg-orange-600 text-white p-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <User size={20} />
            <h2 className="text-lg font-semibold">Driver Details</h2>
          </div>
          <button 
            onClick={onClose} 
            className="text-white hover:text-orange-200 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="bg-orange-100 p-2 rounded-full">
                <User className="text-orange-600" size={18} />
              </div>
              <div>
                <p className="text-sm text-gray-500">Driver ID</p>
                <p className="font-medium">{driver.employeeId}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="bg-orange-100 p-2 rounded-full">
                <User className="text-orange-600" size={18} />
              </div>
              <div>
                <p className="text-sm text-gray-500">Name</p>
                <p className="font-medium">{driver.name}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="bg-orange-100 p-2 rounded-full">
                <Phone className="text-orange-600" size={18} />
              </div>
              <div>
                <p className="text-sm text-gray-500">Phone</p>
                <p className="font-medium">{driver.phone}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="bg-orange-100 p-2 rounded-full">
                <Mail className="text-orange-600" size={18} />
              </div>
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium">{driver.email}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="bg-orange-100 p-2 rounded-full">
                <FileText className="text-orange-600" size={18} />
              </div>
              <div>
                <p className="text-sm text-gray-500">License Number</p>
                <p className="font-medium">{driver.licenseNumber}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="bg-orange-100 p-2 rounded-full">
                <Calendar className="text-orange-600" size={18} />
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

            <div className="flex items-start gap-3">
              <div className="bg-orange-100 p-2 rounded-full">
                <Award className="text-orange-600" size={18} />
              </div>
              <div>
                <p className="text-sm text-gray-500">Driving Experience</p>
                <p className="font-medium">
                  {driver.drivingExperience !== undefined ? driver.drivingExperience + " years" : "-"}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="bg-orange-100 p-2 rounded-full">
                <ActivitySquare className="text-orange-600" size={18} />
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <p className="font-medium">{driver.status ?? "-"}</p>
              </div>
            </div>
          </div>

          {/* Audit Information */}
          <div className="mt-6 pt-4 border-t border-orange-100 space-y-3">
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
                  Deleted by {driver.deletedBy} at {formatDate(driver.deletedAt)}
                </span>
              </div>
            )}
          </div>

          {/* Previous Data Button */}
          {driver.previousData && Object.keys(driver.previousData).length > 0 && (
            <button
              onClick={onShowPrev}
              className="mt-4 text-orange-600 hover:text-orange-800 text-sm font-medium flex items-center gap-1 transition-colors"
            >
              <History className="text-orange-600" size={16} />
              View Previous Data
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default DriverModal;
