'use client';
/* eslint-disable @next/next/no-img-element */

import { useState, useEffect, useMemo } from 'react';
import Topbar from '../../../components/Topbar';
import Sidebar from '../../../components/Sidebar';
import Modal from '../../../components/Modal';
import { PermissionGate } from '../../../components/PermissionGate';
import api from '../../../lib/api';
import { useAuth } from '../../../hooks/useAuth';
import { usePermissionFlags } from '../../../hooks/usePermissionFlags';
import { Registration } from '../../../types';
import { printDocument, escapeHtml } from '../../../lib/print';
import { readCache, writeCache } from '../../../lib/cache';
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
  Search,
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

const formatPrintValue = (value?: string | number | null) => {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return escapeHtml(trimmed.length ? trimmed : '—');
  }
  return escapeHtml(String(value));
};

export default function Employees() {
  const { user, loading: authLoading, refresh } = useAuth();

  const cachedRegs = readCache<Registration[]>('cache:auth:employees') || [];

  const [registrations, setRegistrations] = useState<Registration[]>(cachedRegs);
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
  const [loadingData, setLoadingData] = useState(!cachedRegs.length);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // holds the new file picked in step 2
  const [imageFile, setImageFile] = useState<File | null>(null);

  // ---- global permission gates ----
  const { canRead, canCreate, canUpdate, canDelete, canPrint } = usePermissionFlags();

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredRegistrations = useMemo(() => {
    if (!normalizedSearch) return registrations;
    return registrations.filter(
      (reg) =>
        reg.epfNo?.toLowerCase().includes(normalizedSearch) ||
        reg.fullName?.toLowerCase().includes(normalizedSearch) ||
        reg.nicNo?.toLowerCase().includes(normalizedSearch) ||
        reg.department?.toLowerCase().includes(normalizedSearch) ||
        reg.mobileNo?.toLowerCase().includes(normalizedSearch)
    );
  }, [registrations, normalizedSearch]);

  useEffect(() => {
    setPage(1);
  }, [normalizedSearch, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filteredRegistrations.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const currentPageRegs = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filteredRegistrations.slice(start, start + pageSize);
  }, [filteredRegistrations, safePage, pageSize]);

  const skeleton = (
    <div className="grid gap-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-12 rounded-lg bg-orange-100/60 animate-pulse" />
      ))}
    </div>
  );

  const showSkeleton = loadingData && registrations.length === 0;
  const isRefreshing = loadingData && registrations.length > 0;

  useEffect(() => {
    if (!user || !canRead) return;
    if (cachedRegs.length) {
      setRegistrations(cachedRegs);
    }
    fetchRegistrations({ silent: !!cachedRegs.length });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, canRead]);

  const fetchRegistrations = async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setLoadingData(true);
    setErrorMessage('');
    try {
      const { data } = await api.get('/registrations');
      const list = Array.isArray(data) ? data : [];
      setRegistrations(list);
      writeCache('cache:auth:employees', list);
    } catch (err: any) {
      if (err?.response?.status === 403) {
        setErrorMessage(
          'Forbidden (403): your account does not have READ permission.'
        );
        // avoid extra refresh here to keep navigation snappy; user can relogin if needed
      } else {
        setErrorMessage('Failed to load employees');
      }
    } finally {
      setLoadingData(false);
    }
  };

  const handleOpen = (reg?: Registration) => {
    if (reg && !canUpdate) {
      setErrorMessage('You do not have UPDATE permission.');
      return;
    }
    if (!reg && !canCreate) {
      setErrorMessage('You do not have CREATE permission.');
      return;
    }
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
        try {
          const formDataUpload = new FormData();
          formDataUpload.append('file', imageFile);

          const { data } = await api.post('/upload', formDataUpload, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });

          // backend returns { url: "https://res.cloudinary.com/.../image.jpg", ... }
          imageUrl = data.url;
        } catch (err) {
          console.warn('Image upload failed, continuing without image', err);
          imageUrl = imageUrl || '';
        }
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
    if (!canDelete) {
      setErrorMessage('You do not have DELETE permission.');
      return;
    }
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

  const handlePrintList = () => {
    if (!canPrint) {
      setErrorMessage('You do not have PRINT permission.');
      return;
    }

    const rows = filteredRegistrations;
    const tableRows = rows
      .map(
        (reg, index) => `
        <tr>
          <td>${formatPrintValue(index + 1)}</td>
          <td>${formatPrintValue(reg.epfNo)}</td>
          <td>${formatPrintValue(reg.fullName)}</td>
          <td>${formatPrintValue(reg.department)}</td>
          <td>${formatPrintValue(reg.mobileNo)}</td>
          <td>${formatPrintValue(reg.personalEmail)}</td>
        </tr>
      `
      )
      .join('');

    const tableHtml = rows.length
      ? `<table class="spc-table">
          <thead>
            <tr>
              <th>#</th>
              <th>EPF No</th>
              <th>Full Name</th>
              <th>Department</th>
              <th>Mobile</th>
              <th>Email</th>
            </tr>
          </thead>
          <tbody>${tableRows}</tbody>
        </table>`
      : '<div class="spc-empty">No employee records match the current filters.</div>';

    printDocument({
      title: 'Employee Register',
      subtitle: rows.length ? `Records shown: ${rows.length}` : undefined,
      contentHtml: tableHtml,
      printedBy: user?.fullName?.trim() || user?.username || undefined,
    });
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
                  value={formData.nicNo ?? ''}
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

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-orange-100">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading your workspace…</p>
        </div>
      </div>
    );
  }

  if (user && !canRead) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-orange-100 p-6">
        <div className="bg-white border border-orange-200 rounded-2xl shadow-xl p-8 max-w-md text-center space-y-3">
          <h1 className="text-2xl font-bold text-gray-900">Access restricted</h1>
          <p className="text-sm text-gray-600">
            You do not have permission to view employee records. Please contact an administrator if you believe this is a mistake.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-shell">
      <Sidebar user={user} isOpen={isOpenSidebar} onClose={() => setIsOpenSidebar(false)} />

      <div className="auth-shell__main overflow-hidden">
        <Topbar user={user} />

        <main className="auth-shell__content">
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

          <div className="space-y-8">
            {/* MAIN CONTENT - EMPLOYEES TABLE */}
            <div className="w-full">
              <div className="bg-white rounded-2xl shadow-lg border border-orange-200 overflow-hidden">
                <div className="p-6 border-b border-orange-200 bg-orange-50">
                  <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <Users className="w-5 h-5 text-orange-600" />
                    System Employees
                  </h2>
                </div>

                {/* TABLE */}
                {showSkeleton ? (
                  <div className="p-6 space-y-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                      Loading employees...
                    </div>
                    {skeleton}
                  </div>
                ) : (
                  <>
                    <div className="p-4 border-t border-b border-gray-200 bg-white flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div className="relative w-full md:max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                          type="text"
                          placeholder="Search employees..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
                        />
                      </div>

                      <div className="flex items-center gap-3">
                        {isRefreshing && (
                          <div className="flex items-center gap-2 text-xs text-orange-700">
                            <div className="w-3 h-3 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                            Refreshing
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600">Rows per page</span>
                          <select
                            value={pageSize}
                            onChange={(e) => setPageSize(Number(e.target.value))}
                            className="py-2 px-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                          >
                            <option value={10}>10</option>
                            <option value={15}>15</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 border-b border-gray-200 bg-white">
                      <div className="flex flex-wrap gap-3">
                        <PermissionGate require="CREATE">
                          <button
                            onClick={() => handleOpen()}
                            className="flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium"
                          >
                            <Users className="w-4 h-4 mr-2" />
                            Add Employee
                          </button>
                        </PermissionGate>

                        <PermissionGate require="PRINT">
                          <button
                            onClick={handleExport}
                            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Export CSV
                          </button>
                        </PermissionGate>

                        {canPrint && (
                          <button
                            onClick={handlePrintList}
                            className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium"
                          >
                            <Printer className="w-4 h-4 mr-2" />
                            Print
                          </button>
                        )}
                      </div>
                    </div>

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
                        {currentPageRegs.map((reg) => (
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
                                <PermissionGate require="DELETE">
                                  <button
                                    onClick={() => handleDelete(reg.epfNo!)}
                                    className="flex items-center px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                                  >
                                    <Trash2 className="w-4 h-4 mr-1" />
                                    Delete
                                  </button>
                                </PermissionGate>
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

                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border-t border-gray-200 text-sm bg-white">
                      <div className="text-gray-600 mb-3 sm:mb-0">
                        Page {safePage} / {totalPages} • Showing{' '}
                        <span className="font-semibold">{currentPageRegs.length}</span> of{' '}
                        <span className="font-semibold">{filteredRegistrations.length}</span> employees
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setPage((p) => Math.max(1, p - 1))}
                          disabled={safePage === 1}
                          className={`flex items-center px-3 py-2 rounded-lg border text-sm ${
                            safePage === 1
                              ? 'text-gray-400 border-gray-200 bg-gray-50 cursor-not-allowed'
                              : 'text-gray-700 border-gray-300 bg-white hover:bg-gray-100'
                          }`}
                        >
                          <ChevronLeft className="w-4 h-4 mr-1" />
                          Prev
                        </button>
                        <button
                          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                          disabled={safePage === totalPages}
                          className={`flex items-center px-3 py-2 rounded-lg border text-sm ${
                            safePage === totalPages
                              ? 'text-gray-400 border-gray-200 bg-gray-50 cursor-not-allowed'
                              : 'text-gray-700 border-gray-300 bg-white hover:bg-gray-100'
                          }`}
                        >
                          Next
                          <ChevronRight className="w-4 h-4 ml-1" />
                        </button>
                      </div>
                    </div>
                  </>
                )}
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
