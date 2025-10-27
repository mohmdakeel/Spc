'use client';

import { useState, useEffect } from 'react';
import Topbar from '../../../components/Topbar';
import Sidebar from '../../../components/Sidebar';
import Modal from '../../../components/Modal';
import api from '../../../lib/api';
import { useAuth } from '../../../hooks/useAuth';
import { Registration } from '../../../types';
import {
  Users,
  Edit,
  Trash2,
  Printer,
  Eye,
  CheckCircle,
  XCircle,
  Download,
  ChevronRight,
  ChevronLeft,
  User,
  Contact,
  Home,
  Briefcase,
  Shield,
  Search,
  Filter
} from 'lucide-react';

type CsvRow = Registration;

function exportToCsv(rows: CsvRow[], fileName: string) {
  if (!rows || rows.length === 0) return;

  const headers = Object.keys(rows[0] ?? { epfNo: '', fullName: '' });
  const csv = [
    headers.join(','),
    ...rows.map((r) =>
      headers.map((h) => JSON.stringify((r as any)[h] ?? '')).join(',')
    ),
  ].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = fileName;
  link.click();
}

export default function Employees() {
  const { user, loading: authLoading, refresh } = useAuth();

  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [open, setOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<Registration>({
    epfNo: '',
    fullName: '',
    nicNo: '',
    dateOfBirth: '',
    civilStatus: '',
    gender: '',
    race: '',
    religion: '',
    bloodGroup: '',
    permanentAddress: '',
    district: '',
    mobileNo: '',
    personalEmail: '',
    cardStatus: '',
    imageUrl: '',
    currentAddress: '',
    dsDivision: '',
    residencePhone: '',
    emergencyContact: '',
    workingStatus: '',
    department: '',
    attendanceNo: '',
    nameWithInitials: '',
    surname: '',
  });
  const [selectedReg, setSelectedReg] = useState<Registration | null>(null);
  const [isOpenSidebar, setIsOpenSidebar] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loadingData, setLoadingData] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // holds the new file picked in step 2
  const [imageFile, setImageFile] = useState<File | null>(null);

  // ---- global permission gates ----
  const has = (p: string) => !!user?.permissions?.includes(p);
  const canRead = has('READ');
  const canCreate = has('CREATE');
  const canUpdate = has('UPDATE');
  const canDelete = has('DELETE');
  const canPrint = has('PRINT');

  // Filter employees based on search term
  const filteredRegistrations = registrations.filter(reg =>
    reg.epfNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    reg.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    reg.nicNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    reg.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    reg.mobileNo?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    if (!user) return;
    fetchRegistrations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchRegistrations = async () => {
    setLoadingData(true);
    setErrorMessage('');
    try {
      const { data } = await api.get('/registrations');
      setRegistrations(data || []);
    } catch (err: any) {
      if (err?.response?.status === 403) {
        setErrorMessage(
          'Forbidden (403): your account does not have READ permission.'
        );
        await refresh();
      } else {
        setErrorMessage('Failed to load employees');
      }
    } finally {
      setLoadingData(false);
    }
  };

  const handleOpen = (reg?: Registration) => {
    if (reg) {
      setEditMode(true);
      setFormData({
        ...reg,
        dateOfBirth: reg.dateOfBirth
          ? new Date(reg.dateOfBirth as any)
              .toISOString()
              .split('T')[0]
          : '',
      });
      setSelectedReg(reg);
    } else {
      setEditMode(false);
      setFormData({
        epfNo: '',
        fullName: '',
        nicNo: '',
        dateOfBirth: '',
        civilStatus: '',
        gender: '',
        race: '',
        religion: '',
        bloodGroup: '',
        permanentAddress: '',
        district: '',
        mobileNo: '',
        personalEmail: '',
        cardStatus: '',
        imageUrl: '',
        currentAddress: '',
        dsDivision: '',
        residencePhone: '',
        emergencyContact: '',
        workingStatus: '',
        department: '',
        attendanceNo: '',
        nameWithInitials: '',
        surname: '',
      });
      setSelectedReg(null);
    }
    setImageFile(null);
    setCurrentStep(1);
    setOpen(true);
    setErrorMessage('');
  };

  const handleDetails = async (epfNo: string) => {
    try {
      const { data } = await api.get(
        `/registrations/${encodeURIComponent(epfNo)}`
      );
      setSelectedReg(data);
      setDetailsOpen(true);
    } catch (err: any) {
      if (err?.response?.status === 403) {
        setErrorMessage(
          'Forbidden (403): your account does not have READ permission for this employee.'
        );
        await refresh();
      } else {
        setErrorMessage('Failed to load employee details');
      }
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  const nextStep = () => {
    if (currentStep === 1) {
      if (!formData.epfNo || !formData.fullName || !formData.nicNo) {
        setErrorMessage('EPF No, Full Name, and NIC No are required');
        return;
      }
    }
    setCurrentStep((prev) => prev + 1);
    setErrorMessage('');
  };

  const prevStep = () => {
    setCurrentStep((prev) => prev - 1);
    setErrorMessage('');
  };

  const handleSubmit = async () => {
    if (!formData.epfNo || !formData.fullName || !formData.nicNo) {
      setErrorMessage('EPF No, Full Name, and NIC No are required');
      return;
    }

    try {
      let imageUrl = formData.imageUrl;

      // if user picked a file in step 2, upload it first
      if (imageFile) {
        const formDataUpload = new FormData();
        formDataUpload.append('file', imageFile);

        const { data } = await api.post('/upload', formDataUpload, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        // backend returns { url: "https://res.cloudinary.com/.../image.jpg", ... }
        imageUrl = data.url;
      }

      const payload = { ...formData, imageUrl };

      if (editMode && selectedReg) {
        await api.put(
          `/registrations/${encodeURIComponent(selectedReg.epfNo!)}`,
          payload
        );
      } else {
        await api.post('/registrations', payload);
      }

      await fetchRegistrations();
      setOpen(false);
      setSuccessMessage(
        editMode
          ? 'Employee updated successfully!'
          : 'Employee created successfully!'
      );
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      if (err?.response?.status === 403) {
        setErrorMessage('Forbidden (403): insufficient permission (need CREATE/UPDATE).');
        await refresh();
      } else {
        setErrorMessage(err.response?.data?.message || 'Failed to save employee');
      }
    }
  };

  const handleDelete = async (epfNo: string) => {
    if (!confirm('Are you sure you want to delete this employee?')) return;
    try {
      await api.delete(`/registrations/${encodeURIComponent(epfNo)}`);
      await fetchRegistrations();
      setSuccessMessage('Employee deleted successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      if (err?.response?.status === 403) {
        setErrorMessage('Forbidden (403): need DELETE permission.');
        await refresh();
      } else {
        setErrorMessage('Failed to delete employee');
      }
    }
  };

  const handleExport = () => {
    if (registrations.length === 0) {
      setErrorMessage('No data to export');
      return;
    }
    exportToCsv(registrations, 'employees.csv');
  };

  // ----- multi-step modal body -----
  const renderFormStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <User className="w-5 h-5 text-orange-600" />
              <h3 className="text-lg font-semibold text-gray-900">
                Basic Information
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  EPF Number *
                </label>
                <input
                  name="epfNo"
                  placeholder="EPF number"
                  value={formData.epfNo}
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  name="fullName"
                  placeholder="Full name"
                  value={formData.fullName}
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  NIC Number *
                </label>
                <input
                  name="nicNo"
                  placeholder="NIC number"
                  value={formData.nicNo}
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date of Birth
                </label>
                <input
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      dateOfBirth: e.target.value,
                    })
                  }
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Civil Status
                </label>
                <select
                  name="civilStatus"
                  value={formData.civilStatus}
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Gender
                </label>
                <select
                  name="gender"
                  value={formData.gender}
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

      case 2:
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Contact className="w-5 h-5 text-orange-600" />
              <h3 className="text-lg font-semibold text-gray-900">
                Personal Details
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name with Initials
                </label>
                <input
                  name="nameWithInitials"
                  placeholder="Name with initials"
                  value={formData.nameWithInitials}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      nameWithInitials: e.target.value,
                    })
                  }
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Surname
                </label>
                <input
                  name="surname"
                  placeholder="Surname"
                  value={formData.surname}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      surname: e.target.value,
                    })
                  }
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Race
                </label>
                <input
                  name="race"
                  placeholder="Race"
                  value={formData.race}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      race: e.target.value,
                    })
                  }
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Religion
                </label>
                <input
                  name="religion"
                  placeholder="Religion"
                  value={formData.religion}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      religion: e.target.value,
                    })
                  }
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Blood Group
                </label>
                <input
                  name="bloodGroup"
                  placeholder="Blood group"
                  value={formData.bloodGroup}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      bloodGroup: e.target.value,
                    })
                  }
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mobile Number
                </label>
                <input
                  name="mobileNo"
                  placeholder="Mobile number"
                  value={formData.mobileNo}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      mobileNo: e.target.value,
                    })
                  }
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Personal Email
                </label>
                <input
                  name="personalEmail"
                  placeholder="Personal email"
                  value={formData.personalEmail}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      personalEmail: e.target.value,
                    })
                  }
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Emergency Contact
                </label>
                <input
                  name="emergencyContact"
                  placeholder="Emergency contact"
                  value={formData.emergencyContact}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      emergencyContact: e.target.value,
                    })
                  }
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>

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
                      <img
                        src={
                          imageFile
                            ? URL.createObjectURL(imageFile)
                            : formData.imageUrl || ''
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

      case 3:
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Home className="w-5 h-5 text-orange-600" />
              <h3 className="text-lg font-semibold text-gray-900">
                Address Information
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Permanent Address
                </label>
                <input
                  name="permanentAddress"
                  placeholder="Permanent address"
                  value={formData.permanentAddress}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      permanentAddress: e.target.value,
                    })
                  }
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  District
                </label>
                <input
                  name="district"
                  placeholder="District"
                  value={formData.district}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      district: e.target.value,
                    })
                  }
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  DS Division
                </label>
                <input
                  name="dsDivision"
                  placeholder="DS division"
                  value={formData.dsDivision}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      dsDivision: e.target.value,
                    })
                  }
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Address
                </label>
                <input
                  name="currentAddress"
                  placeholder="Current address"
                  value={formData.currentAddress}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      currentAddress: e.target.value,
                    })
                  }
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Residence Phone
                </label>
                <input
                  name="residencePhone"
                  placeholder="Residence phone"
                  value={formData.residencePhone}
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

      case 4:
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Briefcase className="w-5 h-5 text-orange-600" />
              <h3 className="text-lg font-semibold text-gray-900">
                Employment Details
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Attendance Number
                </label>
                <input
                  name="attendanceNo"
                  placeholder="Attendance number"
                  value={formData.attendanceNo}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      attendanceNo: e.target.value,
                    })
                  }
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Department
                </label>
                <input
                  name="department"
                  placeholder="Department"
                  value={formData.department}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      department: e.target.value,
                    })
                  }
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Working Status
                </label>
                <input
                  name="workingStatus"
                  placeholder="Working status"
                  value={formData.workingStatus}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      workingStatus: e.target.value,
                    })
                  }
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Card Status
                </label>
                <input
                  name="cardStatus"
                  placeholder="Card status"
                  value={formData.cardStatus}
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

      default:
        return null;
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-orange-50 to-orange-100">
      <Sidebar user={user} isOpen={isOpenSidebar} onClose={() => setIsOpenSidebar(false)} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar user={user} />

        <main className="flex-1 overflow-y-auto p-6">
          {/* HEADER */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <Users className="w-8 h-8 text-orange-600" />
              <h1 className="text-3xl font-bold text-gray-900">Employee Management</h1>
            </div>
            <p className="text-gray-600">Manage employee records and information</p>
          </div>

          {/* MESSAGES */}
          {successMessage && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center">
              <CheckCircle className="mr-2 text-green-600" /> 
              <span className="text-green-800">{successMessage}</span>
            </div>
          )}
          {errorMessage && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
              <XCircle className="mr-2 text-red-600" /> 
              <span className="text-red-800">{errorMessage}</span>
            </div>
          )}

          <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
            {/* MAIN CONTENT - EMPLOYEES TABLE */}
            <div className="xl:col-span-3">
              <div className="bg-white rounded-2xl shadow-lg border border-orange-200 overflow-hidden">
                <div className="p-6 border-b border-orange-200 bg-orange-50">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                      <Users className="w-5 h-5 text-orange-600" />
                      System Employees
                    </h2>
                    
                    <div className="flex flex-col sm:flex-row gap-3">
                      {/* Search Box */}
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                          type="text"
                          placeholder="Search employees..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* TOOLBAR */}
                <div className="p-4 border-b border-gray-200 bg-white">
                  <div className="flex flex-wrap gap-3">
                    {canCreate && (
                      <button
                        onClick={() => handleOpen()}
                        className="flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium"
                      >
                        <Users className="w-4 h-4 mr-2" /> 
                        Add Employee
                      </button>
                    )}

                    {canRead && (
                      <button
                        onClick={handleExport}
                        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                      >
                        <Download className="w-4 h-4 mr-2" /> 
                        Export CSV
                      </button>
                    )}

                    {canPrint && (
                      <button
                        onClick={() => window.print()}
                        className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium"
                      >
                        <Printer className="w-4 h-4 mr-2" /> 
                        Print
                      </button>
                    )}
                  </div>
                </div>

                {/* TABLE */}
                {!canRead ? (
                  <div className="p-8 text-center">
                    <Shield className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600">
                      You don't have permission to view employees (need{' '}
                      <code className="bg-gray-100 px-2 py-1 rounded text-sm">READ</code>{' '}
                      permission).
                    </p>
                  </div>
                ) : loadingData ? (
                  <div className="p-8 text-center">
                    <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                    <p className="text-gray-600">Loading employees...</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-orange-50">
                        <tr>
                          <th className="p-3 text-left text-sm font-semibold text-gray-700">EPF No</th>
                          <th className="p-3 text-left text-sm font-semibold text-gray-700">Full Name</th>
                          <th className="p-3 text-left text-sm font-semibold text-gray-700">Mobile No</th>
                          <th className="p-3 text-left text-sm font-semibold text-gray-700">Emergency Contact</th>
                          <th className="p-3 text-left text-sm font-semibold text-gray-700">Department</th>
                          <th className="p-3 text-left text-sm font-semibold text-gray-700">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {filteredRegistrations.map((reg) => (
                          <tr key={reg.id ?? reg.epfNo} className="hover:bg-orange-50 transition-colors">
                            <td className="p-3">
                              <div className="font-medium text-gray-900">{reg.epfNo}</div>
                            </td>
                            <td className="p-3">
                              <div className="text-gray-900">{reg.fullName}</div>
                            </td>
                            <td className="p-3">
                              <div className="text-gray-600">{reg.mobileNo || 'N/A'}</div>
                            </td>
                            <td className="p-3">
                              <div className="text-gray-600">{reg.emergencyContact || 'N/A'}</div>
                            </td>
                            <td className="p-3">
                              <div className="text-gray-600">{reg.department || 'N/A'}</div>
                            </td>
                            <td className="p-3">
                              <div className="flex gap-2">
                                {canRead && (
                                  <button
                                    onClick={() => handleDetails(reg.epfNo!)}
                                    className="flex items-center px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm"
                                  >
                                    <Eye className="w-4 h-4 mr-1" />
                                    View
                                  </button>
                                )}
                                {canUpdate && (
                                  <button
                                    onClick={() => handleOpen(reg)}
                                    className="flex items-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                                  >
                                    <Edit className="w-4 h-4 mr-1" />
                                    Edit
                                  </button>
                                )}
                                {canDelete && (
                                  <button
                                    onClick={() => handleDelete(reg.epfNo!)}
                                    className="flex items-center px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                                  >
                                    <Trash2 className="w-4 h-4 mr-1" />
                                    Delete
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                        {filteredRegistrations.length === 0 && (
                          <tr>
                            <td colSpan={6} className="p-6 text-center text-gray-500">
                              {searchTerm ? 'No matching employees found' : 'No employees found'}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT COLUMN - QUICK STATS */}
            <div className="space-y-6">
              {/* QUICK STATS */}
              <div className="bg-white rounded-2xl shadow-lg border border-orange-200 overflow-hidden">
                <div className="p-6 border-b border-orange-200 bg-orange-50">
                  <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <Filter className="w-5 h-5 text-orange-600" />
                    Quick Stats
                  </h2>
                </div>
                <div className="p-6 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Total Employees</span>
                    <span className="text-2xl font-bold text-orange-600">{registrations.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Filtered</span>
                    <span className="text-2xl font-bold text-blue-600">{filteredRegistrations.length}</span>
                  </div>
                </div>
              </div>

              {/* PERMISSIONS INFO */}
              <div className="bg-white rounded-2xl shadow-lg border border-orange-200 overflow-hidden">
                <div className="p-6 border-b border-orange-200 bg-orange-50">
                  <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-orange-600" />
                    Your Permissions
                  </h2>
                </div>
                <div className="p-6">
                  <div className="space-y-3">
                    <div className={`p-3 rounded-lg border ${canRead ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">View Employees</span>
                        {canRead ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <XCircle className="w-4 h-4 text-gray-400" />
                        )}
                      </div>
                    </div>
                    <div className={`p-3 rounded-lg border ${canCreate ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">Create Employees</span>
                        {canCreate ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <XCircle className="w-4 h-4 text-gray-400" />
                        )}
                      </div>
                    </div>
                    <div className={`p-3 rounded-lg border ${canUpdate ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">Edit Employees</span>
                        {canUpdate ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <XCircle className="w-4 h-4 text-gray-400" />
                        )}
                      </div>
                    </div>
                    <div className={`p-3 rounded-lg border ${canDelete ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">Delete Employees</span>
                        {canDelete ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <XCircle className="w-4 h-4 text-gray-400" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* MULTI-STEP MODAL */}
          <Modal
            isOpen={open}
            onClose={() => setOpen(false)}
            title={editMode ? 'Edit Employee' : 'Add New Employee'}
            onSubmit={currentStep === 4 ? handleSubmit : undefined}
            submitText={editMode ? 'Update Employee' : 'Create Employee'}
            size="xl"
            loading={loadingData}
            showFooter={false}
          >
            {/* Progress Steps */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-3">
                {[1, 2, 3, 4].map((step) => (
                  <div key={step} className="flex flex-col items-center flex-1">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      currentStep >= step
                        ? 'bg-orange-600 text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}>
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
                <div className="absolute top-4 left-0 right-0 h-0.5 bg-gray-200 -z-10"></div>
                <div
                  className="absolute top-4 left-0 h-0.5 bg-orange-600 -z-10 transition-all duration-300"
                  style={{
                    width: `${((currentStep - 1) / 3) * 100}%`,
                  }}
                ></div>
              </div>
            </div>

            {/* Form Content */}
            {renderFormStep()}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-6 pt-4 border-t border-gray-200">
              <button
                onClick={prevStep}
                disabled={currentStep === 1}
                className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                  currentStep === 1
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Previous
              </button>

              {currentStep < 4 ? (
                <button
                  onClick={nextStep}
                  className="flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-2" />
                </button>
              ) : (
                <div className="flex gap-3">
                  <button
                    onClick={() => setOpen(false)}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={loadingData}
                    className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed transition-colors"
                  >
                    {loadingData ? (
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

          {/* DETAILS MODAL */}
          <Modal
            isOpen={detailsOpen}
            onClose={() => setDetailsOpen(false)}
            title="Employee Details"
            size="lg"
            showFooter={false}
          >
            {selectedReg && (
              <div className="space-y-6">
                {selectedReg.imageUrl && (
                  <div className="flex justify-center">
                    <img
                      src={selectedReg.imageUrl}
                      alt="Profile"
                      className="w-24 h-24 object-cover rounded-full border-4 border-orange-200"
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                  {Object.entries(selectedReg).map(
                    ([key, value]) =>
                      value &&
                      !['id', 'imageUrl'].includes(key) && (
                        <div key={key} className="bg-orange-50 rounded-lg p-3">
                          <label className="block text-sm font-medium text-orange-700 capitalize mb-1">
                            {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                          </label>
                          <p className="text-sm text-gray-900">
                            {value || 'N/A'}
                          </p>
                        </div>
                      )
                  )}
                </div>
              </div>
            )}
          </Modal>

          {/* Mobile Menu Button */}
          <button 
            onClick={() => setIsOpenSidebar(true)}
            className="md:hidden fixed bottom-6 right-6 w-14 h-14 bg-orange-600 text-white rounded-full shadow-lg hover:bg-orange-700 transition-all flex items-center justify-center z-40"
          >
            <span className="text-lg font-bold">☰</span>
          </button>
        </main>
      </div>
    </div>
  );
}