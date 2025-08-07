import React, { useState } from "react";
import { Driver, DriverStatus } from "../services/driverService";
import { X, User, Phone, Mail, FileText, Save, Calendar, Award, ActivitySquare } from "lucide-react";

interface Props {
  driver?: Driver | null;
  onSubmit: (driver: Driver) => void;
  onClose: () => void;
}

const statusOptions: { value: DriverStatus; label: string }[] = [
  { value: "ACTIVE", label: "Active" },
  { value: "INACTIVE", label: "Inactive" },
  { value: "SUSPENDED", label: "Suspended" },
];

const DriverForm = ({ driver, onSubmit, onClose }: Props) => {
  const [form, setForm] = useState<Driver>({
    employeeId: driver?.employeeId ?? "",
    name: driver?.name ?? "",
    phone: driver?.phone ?? "",
    email: driver?.email ?? "",
    licenseNumber: driver?.licenseNumber ?? "",
    licenseExpiryDate: driver?.licenseExpiryDate ?? "", // as yyyy-MM-dd
    drivingExperience: driver?.drivingExperience ?? undefined,
    status: driver?.status ?? "ACTIVE",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    if (name === "drivingExperience") {
      setForm({ ...form, [name]: value === "" ? undefined : Number(value) });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Clean optional fields for backend (convert empty strings to undefined)
    const cleanForm: Driver = {
      ...form,
      phone: form.phone && form.phone.trim() !== "" ? form.phone.trim() : undefined,
      email: form.email && form.email.trim() !== "" ? form.email.trim() : undefined,
      licenseExpiryDate: form.licenseExpiryDate ? form.licenseExpiryDate : undefined,
      drivingExperience: typeof form.drivingExperience === "number" && !isNaN(form.drivingExperience)
        ? form.drivingExperience : undefined,
      status: form.status ?? "ACTIVE",
    };
    onSubmit(cleanForm);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
        {/* Modal Header */}
        <div className="bg-orange-600 text-white p-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <User size={20} />
            <h2 className="text-lg font-semibold">
              {driver ? "Edit Driver" : "Add Driver"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-orange-200 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {!driver && (
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">
                Employee ID
              </label>
              <div className="relative">
                <input
                  name="employeeId"
                  value={form.employeeId}
                  onChange={handleChange}
                  placeholder="Enter employee ID"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  required
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Name</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="text-gray-400" size={18} />
              </div>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Enter driver name"
                className="w-full pl-10 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Phone</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Phone className="text-gray-400" size={18} />
              </div>
              <input
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="Enter phone number"
                className="w-full pl-10 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Email</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="text-gray-400" size={18} />
              </div>
              <input
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="Enter email address"
                className="w-full pl-10 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">
              License Number
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FileText className="text-gray-400" size={18} />
              </div>
              <input
                name="licenseNumber"
                value={form.licenseNumber}
                onChange={handleChange}
                placeholder="Enter license number"
                className="w-full pl-10 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">
              License Expiry Date
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Calendar className="text-gray-400" size={18} />
              </div>
              <input
                type="date"
                name="licenseExpiryDate"
                value={form.licenseExpiryDate ? form.licenseExpiryDate.toString().slice(0, 10) : ""}
                onChange={handleChange}
                className="w-full pl-10 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">
              Experience (Years)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Award className="text-gray-400" size={18} />
              </div>
              <input
                type="number"
                name="drivingExperience"
                value={form.drivingExperience ?? ""}
                min={0}
                onChange={handleChange}
                placeholder="Years of driving experience"
                className="w-full pl-10 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Status</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <ActivitySquare className="text-gray-400" size={18} />
              </div>
              <select
                name="status"
                value={form.status}
                onChange={handleChange}
                className="w-full pl-10 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                required
              >
                {statusOptions.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Form Footer */}
          <div className="flex justify-end gap-3 pt-4 border-t border-orange-100 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-white bg-orange-600 rounded-lg hover:bg-orange-700 transition-colors flex items-center gap-2"
            >
              <Save size={18} />
              {driver ? "Update Driver" : "Add Driver"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DriverForm;
