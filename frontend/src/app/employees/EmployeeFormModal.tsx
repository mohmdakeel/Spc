'use client';

import { useState } from 'react';
import Modal from '../../../components/Modal';
import api from '../../../lib/api';
import { Registration } from '../../../types';
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  User as UserIcon,
  Contact as ContactIcon,
  Home,
  Briefcase,
} from 'lucide-react';

type EmployeeFormModalProps = {
  isOpen: boolean;
  onClose: () => void;

  currentStep: number;
  setCurrentStep: (n: number) => void;

  formData: Registration;
  setFormData: (d: Registration) => void;

  imageFile: File | null;
  setImageFile: (f: File | null) => void;

  editMode: boolean;
  selectedReg: Registration | null;

  refreshList: () => Promise<void>;
  setErrorMessage: (msg: string) => void;
  setSuccessMessage: (msg: string) => void;

  loadingData: boolean;
  setLoadingData: (b: boolean) => void;

  refreshAuth: () => Promise<void>;
};

// helper
const safeVal = (v?: string) => v || '';

export default function EmployeeFormModal({
  isOpen,
  onClose,

  currentStep,
  setCurrentStep,

  formData,
  setFormData,

  imageFile,
  setImageFile,

  editMode,
  selectedReg,

  refreshList,
  setErrorMessage,
  setSuccessMessage,

  loadingData,
  setLoadingData,

  refreshAuth,
}: EmployeeFormModalProps) {
  const [submitting, setSubmitting] = useState(false);

  // nav
  const nextStep = () => {
    if (currentStep === 1) {
      if (!formData.epfNo || !formData.fullName || !formData.nicNo) {
        setErrorMessage('EPF No, Full Name, and NIC No are required');
        return;
      }
    }
    setCurrentStep(currentStep + 1);
    setErrorMessage('');
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setErrorMessage('');
    }
  };

  // image
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  // submit
  const handleSubmit = async () => {
    if (!formData.epfNo || !formData.fullName || !formData.nicNo) {
      setErrorMessage('EPF No, Full Name, and NIC No are required');
      return;
    }

    try {
      setSubmitting(true);
      setLoadingData(true);
      setErrorMessage('');

      let imageUrl = formData.imageUrl ?? '';

      // upload image if new (tolerate failures)
      if (imageFile) {
        try {
          const body = new FormData();
          body.append('file', imageFile);

          const { data } = await api.post('/upload', body, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });

          imageUrl = data.url;
        } catch (err) {
          console.warn('Image upload failed, continuing without image', err);
          imageUrl = imageUrl || '';
        }
      }

      const payload: Registration = {
        ...formData,
        imageUrl,
      };

      if (editMode && selectedReg) {
        await api.put(
          `/registrations/${encodeURIComponent(selectedReg.epfNo!)}`,
          payload
        );
      } else {
        await api.post('/registrations', payload);
      }

      await refreshList();

      onClose();
      setSuccessMessage(
        editMode
          ? 'Employee updated successfully!'
          : 'Employee created successfully!'
      );
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      if (err?.response?.status === 403) {
        setErrorMessage(
          'Forbidden (403): insufficient permission (need CREATE/UPDATE).'
        );
        await refreshAuth();
      } else {
        setErrorMessage(err.response?.data?.message || 'Failed to save employee');
      }
    } finally {
      setSubmitting(false);
      setLoadingData(false);
    }
  };

  // STEP UIs
  const Step1Basic = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <UserIcon className="w-5 h-5 text-orange-600" />
        <h3 className="text-lg font-semibold text-gray-900">
          Basic Information
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* EPF No */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            EPF Number *
          </label>
          <input
            name="epfNo"
            placeholder="EPF number"
            value={safeVal(formData.epfNo)}
            onChange={(e) =>
              setFormData({
                ...formData,
                epfNo: e.target.value,
              })
            }
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            required
            disabled={editMode}
          />
        </div>

        {/* Full Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Full Name *
          </label>
          <input
            name="fullName"
            placeholder="Full name"
            value={safeVal(formData.fullName)}
            onChange={(e) =>
              setFormData({
                ...formData,
                fullName: e.target.value,
              })
            }
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            required
          />
        </div>

        {/* NIC */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            NIC Number *
          </label>
          <input
            name="nicNo"
            placeholder="NIC number"
            value={safeVal(formData.nicNo)}
            onChange={(e) =>
              setFormData({
                ...formData,
                nicNo: e.target.value,
              })
            }
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            required
          />
        </div>

        {/* DOB */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Date of Birth
          </label>
          <input
            type="date"
            name="dateOfBirth"
            value={safeVal(formData.dateOfBirth as any)}
            onChange={(e) =>
              setFormData({
                ...formData,
                dateOfBirth: e.target.value,
              })
            }
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          />
        </div>

        {/* Civil Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Civil Status
          </label>
          <select
            name="civilStatus"
            value={safeVal(formData.civilStatus)}
            onChange={(e) =>
              setFormData({
                ...formData,
                civilStatus: e.target.value,
              })
            }
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          >
            <option value="">Select</option>
            <option value="Single">Single</option>
            <option value="Married">Married</option>
            <option value="Divorced">Divorced</option>
            <option value="Widowed">Widowed</option>
          </select>
        </div>

        {/* Gender */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Gender
          </label>
          <select
            name="gender"
            value={safeVal(formData.gender)}
            onChange={(e) =>
              setFormData({
                ...formData,
                gender: e.target.value,
              })
            }
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          >
            <option value="">Select</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
        </div>
      </div>
    </div>
  );

  const Step2Personal = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <ContactIcon className="w-5 h-5 text-orange-600" />
        <h3 className="text-lg font-semibold text-gray-900">
          Personal Details
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Name with initials */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Name with Initials
          </label>
          <input
            name="nameWithInitials"
            placeholder="Name with initials"
            value={safeVal(formData.nameWithInitials)}
            onChange={(e) =>
              setFormData({
                ...formData,
                nameWithInitials: e.target.value,
              })
            }
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          />
        </div>

        {/* Surname */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Surname
          </label>
          <input
            name="surname"
            placeholder="Surname"
            value={safeVal(formData.surname)}
            onChange={(e) =>
              setFormData({
                ...formData,
                surname: e.target.value,
              })
            }
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          />
        </div>

        {/* Race */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Race
          </label>
          <input
            name="race"
            placeholder="Race"
            value={safeVal(formData.race)}
            onChange={(e) =>
              setFormData({
                ...formData,
                race: e.target.value,
              })
            }
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          />
        </div>

        {/* Religion */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Religion
          </label>
          <input
            name="religion"
            placeholder="Religion"
            value={safeVal(formData.religion)}
            onChange={(e) =>
              setFormData({
                ...formData,
                religion: e.target.value,
              })
            }
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          />
        </div>

        {/* Blood Group */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Blood Group
          </label>
          <input
            name="bloodGroup"
            placeholder="Blood group"
            value={safeVal(formData.bloodGroup)}
            onChange={(e) =>
              setFormData({
                ...formData,
                bloodGroup: e.target.value,
              })
            }
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          />
        </div>

        {/* Mobile */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Mobile Number
          </label>
          <input
            name="mobileNo"
            placeholder="Mobile number"
            value={safeVal(formData.mobileNo)}
            onChange={(e) =>
              setFormData({
                ...formData,
                mobileNo: e.target.value,
              })
            }
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          />
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Personal Email
          </label>
          <input
            name="personalEmail"
            placeholder="Personal email"
            value={safeVal(formData.personalEmail)}
            onChange={(e) =>
              setFormData({
                ...formData,
                personalEmail: e.target.value,
              })
            }
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          />
        </div>

        {/* Emergency Contact */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Emergency Contact
          </label>
          <input
            name="emergencyContact"
            placeholder="Emergency contact"
            value={safeVal(formData.emergencyContact)}
            onChange={(e) =>
              setFormData({
                ...formData,
                emergencyContact: e.target.value,
              })
            }
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          />
        </div>

        {/* Profile Photo */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Profile Photo
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          />

          {(imageFile || formData.imageUrl) && (
            <div className="mt-3 flex items-center gap-4">
              <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-orange-300 bg-orange-50 flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={
                    imageFile
                      ? URL.createObjectURL(imageFile)
                      : safeVal(formData.imageUrl)
                  }
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              </div>
              <p className="text-sm text-gray-600">Image Preview</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const Step3Address = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Home className="w-5 h-5 text-orange-600" />
        <h3 className="text-lg font-semibold text-gray-900">
          Address Information
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Permanent Address */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Permanent Address
          </label>
          <input
            name="permanentAddress"
            placeholder="Permanent address"
            value={safeVal(formData.permanentAddress)}
            onChange={(e) =>
              setFormData({
                ...formData,
                permanentAddress: e.target.value,
              })
            }
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          />
        </div>

        {/* District */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            District
          </label>
          <input
            name="district"
            placeholder="District"
            value={safeVal(formData.district)}
            onChange={(e) =>
              setFormData({
                ...formData,
                district: e.target.value,
              })
            }
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          />
        </div>

        {/* DS Division */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            DS Division
          </label>
          <input
            name="dsDivision"
            placeholder="DS division"
            value={safeVal(formData.dsDivision)}
            onChange={(e) =>
              setFormData({
                ...formData,
                dsDivision: e.target.value,
              })
            }
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          />
        </div>

        {/* Current Address */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Current Address
          </label>
          <input
            name="currentAddress"
            placeholder="Current address"
            value={safeVal(formData.currentAddress)}
            onChange={(e) =>
              setFormData({
                ...formData,
                currentAddress: e.target.value,
              })
            }
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          />
        </div>

        {/* Residence Phone */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Residence Phone
          </label>
          <input
            name="residencePhone"
            placeholder="Residence phone"
            value={safeVal(formData.residencePhone)}
            onChange={(e) =>
              setFormData({
                ...formData,
                residencePhone: e.target.value,
              })
            }
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          />
        </div>
      </div>
    </div>
  );

  const Step4Employment = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Briefcase className="w-5 h-5 text-orange-600" />
        <h3 className="text-lg font-semibold text-gray-900">
          Employment Details
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* AttendanceNo */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Attendance Number
          </label>
          <input
            name="attendanceNo"
            placeholder="Attendance number"
            value={safeVal(formData.attendanceNo)}
            onChange={(e) =>
              setFormData({
                ...formData,
                attendanceNo: e.target.value,
              })
            }
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          />
        </div>

        {/* Department */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Department
          </label>
          <input
            name="department"
            placeholder="Department"
            value={safeVal(formData.department)}
            onChange={(e) =>
              setFormData({
                ...formData,
                department: e.target.value,
              })
            }
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          />
        </div>

        {/* Working Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Working Status
          </label>
          <input
            name="workingStatus"
            placeholder="Working status"
            value={safeVal(formData.workingStatus)}
            onChange={(e) =>
              setFormData({
                ...formData,
                workingStatus: e.target.value,
              })
            }
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          />
        </div>

        {/* Card Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Card Status
          </label>
          <input
            name="cardStatus"
            placeholder="Card status"
            value={safeVal(formData.cardStatus)}
            onChange={(e) =>
              setFormData({
                ...formData,
                cardStatus: e.target.value,
              })
            }
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          />
        </div>
      </div>

      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mt-4">
        <h4 className="text-sm font-semibold text-orange-800 mb-1">
          Review Information
        </h4>
        <p className="text-sm text-orange-700">
          Please review all information before submitting.
        </p>
      </div>
    </div>
  );

  // step chooser
  const renderStep = () => {
    if (currentStep === 1) return <Step1Basic />;
    if (currentStep === 2) return <Step2Personal />;
    if (currentStep === 3) return <Step3Address />;
    if (currentStep === 4) return <Step4Employment />;
    return null;
  };

  const progressPct = ((currentStep - 1) / 3) * 100;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editMode ? 'Edit Employee' : 'Add New Employee'}
      onSubmit={currentStep === 4 ? handleSubmit : undefined}
      submitText={editMode ? 'Update Employee' : 'Create Employee'}
      size="xl"
      loading={loadingData || submitting}
      showFooter={false}
    >
      {/* progress */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-3">
          {[1, 2, 3, 4].map((step) => (
            <div key={step} className="flex flex-col items-center flex-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  currentStep >= step
                    ? 'bg-orange-600 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {step}
              </div>
              <span className="text-xs mt-2 text-gray-600 text-center">
                {step === 1 && 'Basic Info'}
                {step === 2 && 'Personal'}
                {step === 3 && 'Address'}
                {step === 4 && 'Employment'}
              </span>
            </div>
          ))}
        </div>

        <div className="relative">
          <div className="absolute top-4 left-0 right-0 h-0.5 bg-gray-200 -z-10" />
          <div
            className="absolute top-4 left-0 h-0.5 bg-orange-600 -z-10 transition-all duration-300"
            style={{
              width: `${progressPct}%`,
            }}
          />
        </div>
      </div>

      {/* body */}
      {renderStep()}

      {/* nav footer */}
      <div className="flex justify-between mt-6 pt-4 border-t border-gray-200">
        {/* prev */}
        <button
          onClick={prevStep}
          disabled={currentStep === 1 || submitting}
          className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
            currentStep === 1 || submitting
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Previous
        </button>

        {/* next or save */}
        {currentStep < 4 ? (
          <button
            onClick={nextStep}
            disabled={submitting}
            className="flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:bg-orange-300 disabled:cursor-not-allowed"
          >
            Next
            <ChevronRight className="w-4 h-4 ml-2" />
          </button>
        ) : (
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  {editMode ? 'Update Employee' : 'Create Employee'}
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}
