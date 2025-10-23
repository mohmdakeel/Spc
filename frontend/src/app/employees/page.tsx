// app/admin/employees/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Topbar from '../../../components/Topbar';
import Sidebar from '../../../components/Sidebar';
import Modal from '../../../components/Modal';
import api from '../../../lib/api';
import { useAuth } from '../../../hooks/useAuth';
import { Registration } from '../../../types';
import { Users, Edit, Trash2, Printer, Eye, CheckCircle, XCircle, Download } from 'lucide-react';

type CsvRow = Registration;

function exportToCsv(rows: CsvRow[], fileName: string) {
  const headers = Object.keys(rows[0] ?? { epfNo: '', fullName: '' });
  const csv =
    [headers.join(','), ...rows.map(r => headers.map(h => JSON.stringify((r as any)[h] ?? '')).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = fileName;
  link.click();
}

export default function Employees() {
  const { user, loading, refresh } = useAuth();

  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [open, setOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
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
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loadingData, setLoadingData] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);

  // ---- global permission gates ----
  const has = (p: string) => !!user?.permissions?.includes(p);
  const canRead   = has('READ');
  const canCreate = has('CREATE');
  const canUpdate = has('UPDATE');
  const canDelete = has('DELETE');
  const canPrint  = has('PRINT');

  useEffect(() => {
    if (!user) return;
    fetchRegistrations();
  }, [user]);

  const fetchRegistrations = async () => {
    setLoadingData(true);
    setError('');
    try {
      const { data } = await api.get('/registrations');
      setRegistrations(data);
    } catch (err: any) {
      if (err?.response?.status === 403) {
        setError('Forbidden (403): your account does not have READ permission.');
        await refresh();
      } else {
        setError('Failed to load employees');
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
        dateOfBirth: reg.dateOfBirth ? new Date(reg.dateOfBirth as any).toISOString().split('T')[0] : '',
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
    setOpen(true);
    setError('');
  };

  const handleDetails = async (epfNo: string) => {
    try {
      const { data } = await api.get(`/registrations/${encodeURIComponent(epfNo)}`);
      setSelectedReg(data);
      setDetailsOpen(true);
    } catch (err: any) {
      if (err?.response?.status === 403) {
        setError('Forbidden (403): your account does not have READ permission for this employee.');
        await refresh();
      } else {
        setError('Failed to load employee details');
      }
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) setImageFile(e.target.files[0]);
  };

  const handleSubmit = async () => {
    if (!formData.epfNo || !formData.fullName || !formData.nicNo) {
      setError('EPF No, Full Name, and NIC No are required');
      return;
    }
    try {
      let imageUrl = formData.imageUrl;
      if (imageFile) {
        const formDataUpload = new FormData();
        formDataUpload.append('file', imageFile);
        const { data } = await api.post('/upload', formDataUpload, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        imageUrl = data.url;
      }

      const payload = { ...formData, imageUrl };

      if (editMode && selectedReg) {
        await api.put(`/registrations/${encodeURIComponent(selectedReg.epfNo!)}`, payload);
        await api.post('/audit', {
          actor: user?.username,
          action: 'UPDATE',
          entityType: 'REGISTRATION',
          entityId: selectedReg.epfNo,
          details: `Updated employee ${formData.fullName} (${selectedReg.epfNo})`,
          atTime: new Date().toISOString(),
        });
      } else {
        await api.post('/registrations', payload);
        await api.post('/audit', {
          actor: user?.username,
          action: 'CREATE',
          entityType: 'REGISTRATION',
          entityId: formData.epfNo,
          details: `Created employee ${formData.fullName} (${formData.epfNo})`,
          atTime: new Date().toISOString(),
        });
      }

      await fetchRegistrations();
      setOpen(false);
      setSuccessMessage(editMode ? 'Employee updated successfully!' : 'Employee created successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      if (err?.response?.status === 403) {
        setError('Forbidden (403): insufficient permission (need CREATE/UPDATE).');
        await refresh();
      } else {
        setError(err.response?.data?.message || 'Failed to save employee');
      }
    }
  };

  const handleDelete = async (epfNo: string) => {
    if (!confirm('Are you sure you want to delete this employee?')) return;
    try {
      await api.delete(`/registrations/${encodeURIComponent(epfNo)}`);
      await api.post('/audit', {
        actor: user?.username,
        action: 'DELETE',
        entityType: 'REGISTRATION',
        entityId: epfNo,
        details: `Deleted employee ${epfNo}`,
        atTime: new Date().toISOString(),
      });
      await fetchRegistrations();
      setSuccessMessage('Employee deleted successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      if (err?.response?.status === 403) {
        setError('Forbidden (403): need DELETE permission.');
        await refresh();
      } else {
        setError('Failed to delete employee');
      }
    }
  };

  const handleExport = () => exportToCsv(registrations, 'employees.csv');
  const toggleSidebar = () => setIsOpenSidebar(!isOpenSidebar);

  if (loading || !user) return <div className="p-6">Loading...</div>;

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar user={user} isOpen={isOpenSidebar} onClose={toggleSidebar} />
      <div className="flex-1 flex flex-col">
        <Topbar user={user} />
        <main className="flex-1 p-6 overflow-auto">
          {successMessage && (
            <p className="mb-4 text-green-500 flex items-center">
              <CheckCircle className="mr-2" /> {successMessage}
            </p>
          )}
          {error && (
            <p className="mb-4 text-red-500 flex items-center">
              <XCircle className="mr-2" /> {error}
            </p>
          )}

          {/* Toolbar: hide buttons you don't have permission for */}
          <div className="flex space-x-4 mb-4">
            {canCreate && (
              <button
                onClick={() => handleOpen()}
                className="flex items-center px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                <Users className="w-4 h-4 mr-2" /> Add Employee
              </button>
            )}

            {canRead && (
              <button
                onClick={handleExport}
                className="flex items-center px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                <Download className="w-4 h-4 mr-2" /> Export CSV
              </button>
            )}

            {canPrint && (
              <button
                onClick={() => window.print()}
                className="flex items-center px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                <Printer className="w-4 h-4 mr-2" /> Print
              </button>
            )}
          </div>

          {/* Table / no-permission state */}
          {!canRead ? (
            <div className="p-4 bg-white rounded shadow">
              You don’t have permission to view employees (need <code>READ</code>).
            </div>
          ) : loadingData ? (
            <p>Loading employees...</p>
          ) : (
            <table className="w-full bg-white rounded shadow">
              <thead>
                <tr className="bg-gray-200">
                  <th className="p-2 text-left">EPF No</th>
                  <th className="p-2 text-left">Full Name</th>
                  <th className="p-2 text-left">Mobile No</th>
                  <th className="p-2 text-left">Emergency Contact</th>
                  <th className="p-2 text-left">Department</th>
                  <th className="p-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {registrations.map((reg) => (
                  <tr key={reg.id ?? reg.epfNo} className="border-b">
                    <td className="p-2">{reg.epfNo}</td>
                    <td className="p-2">{reg.fullName}</td>
                    <td className="p-2">{reg.mobileNo || 'N/A'}</td>
                    <td className="p-2">{reg.emergencyContact || 'N/A'}</td>
                    <td className="p-2">{reg.department || 'N/A'}</td>
                    <td className="p-2">
                      <div className="flex gap-2">
                        {canRead && (
                          <button
                            onClick={() => handleDetails(reg.epfNo)}
                            className="text-blue-500 hover:text-blue-700"
                            title="View"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        )}
                        {canUpdate && (
                          <button
                            onClick={() => handleOpen(reg)}
                            className="text-blue-500 hover:text-blue-700"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => handleDelete(reg.epfNo)}
                            className="text-red-500 hover:text-red-700"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Add/Edit Modal */}
          <Modal
            isOpen={open}
            onClose={() => setOpen(false)}
            title={editMode ? 'Edit Employee' : 'Add Employee'}
            onSubmit={handleSubmit}
          >
            <input
              name="epfNo"
              placeholder="EPF No"
              value={formData.epfNo}
              onChange={(e) => setFormData({ ...formData, epfNo: e.target.value })}
              className="w-full p-2 border rounded mb-2"
              required
              disabled={editMode}
            />
            <input
              name="fullName"
              placeholder="Full Name"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              className="w-full p-2 border rounded mb-2"
              required
            />
            <input
              name="nicNo"
              placeholder="NIC No"
              value={formData.nicNo}
              onChange={(e) => setFormData({ ...formData, nicNo: e.target.value })}
              className="w-full p-2 border rounded mb-2"
              required
            />
            <input
              type="date"
              name="dateOfBirth"
              value={formData.dateOfBirth}
              onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
              className="w-full p-2 border rounded mb-2"
            />
            <select
              name="civilStatus"
              value={formData.civilStatus}
              onChange={(e) => setFormData({ ...formData, civilStatus: e.target.value })}
              className="w-full p-2 border rounded mb-2"
            >
              <option value="">Civil Status</option>
              <option value="Single">Single</option>
              <option value="Married">Married</option>
              <option value="Divorced">Divorced</option>
            </select>
            <select
              name="gender"
              value={formData.gender}
              onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
              className="w-full p-2 border rounded mb-2"
            >
              <option value="">Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
            <input
              name="race"
              placeholder="Race"
              value={formData.race}
              onChange={(e) => setFormData({ ...formData, race: e.target.value })}
              className="w-full p-2 border rounded mb-2"
            />
            <input
              name="religion"
              placeholder="Religion"
              value={formData.religion}
              onChange={(e) => setFormData({ ...formData, religion: e.target.value })}
              className="w-full p-2 border rounded mb-2"
            />
            <input
              name="bloodGroup"
              placeholder="Blood Group"
              value={formData.bloodGroup}
              onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
              className="w-full p-2 border rounded mb-2"
            />
            <input
              name="permanentAddress"
              placeholder="Permanent Address"
              value={formData.permanentAddress}
              onChange={(e) => setFormData({ ...formData, permanentAddress: e.target.value })}
              className="w-full p-2 border rounded mb-2"
            />
            <input
              name="district"
              placeholder="District"
              value={formData.district}
              onChange={(e) => setFormData({ ...formData, district: e.target.value })}
              className="w-full p-2 border rounded mb-2"
            />
            <input
              name="mobileNo"
              placeholder="Mobile No"
              value={formData.mobileNo}
              onChange={(e) => setFormData({ ...formData, mobileNo: e.target.value })}
              className="w-full p-2 border rounded mb-2"
            />
            <input
              name="personalEmail"
              placeholder="Personal Email"
              value={formData.personalEmail}
              onChange={(e) => setFormData({ ...formData, personalEmail: e.target.value })}
              className="w-full p-2 border rounded mb-2"
            />
            <input
              name="cardStatus"
              placeholder="Card Status"
              value={formData.cardStatus}
              onChange={(e) => setFormData({ ...formData, cardStatus: e.target.value })}
              className="w-full p-2 border rounded mb-2"
            />
            <input type="file" accept="image/*" onChange={handleImageChange} className="w-full p-2 border rounded mb-2" />
            <input
              name="currentAddress"
              placeholder="Current Address"
              value={formData.currentAddress}
              onChange={(e) => setFormData({ ...formData, currentAddress: e.target.value })}
              className="w-full p-2 border rounded mb-2"
            />
            <input
              name="dsDivision"
              placeholder="DS Division"
              value={formData.dsDivision}
              onChange={(e) => setFormData({ ...formData, dsDivision: e.target.value })}
              className="w-full p-2 border rounded mb-2"
            />
            <input
              name="residencePhone"
              placeholder="Residence Phone"
              value={formData.residencePhone}
              onChange={(e) => setFormData({ ...formData, residencePhone: e.target.value })}
              className="w-full p-2 border rounded mb-2"
            />
            <input
              name="emergencyContact"
              placeholder="Emergency Contact"
              value={formData.emergencyContact}
              onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
              className="w-full p-2 border rounded mb-2"
            />
            <input
              name="workingStatus"
              placeholder="Working Status"
              value={formData.workingStatus}
              onChange={(e) => setFormData({ ...formData, workingStatus: e.target.value })}
              className="w-full p-2 border rounded mb-2"
            />
            <input
              name="department"
              placeholder="Department"
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              className="w-full p-2 border rounded mb-2"
            />
            <input
              name="attendanceNo"
              placeholder="Attendance No"
              value={formData.attendanceNo}
              onChange={(e) => setFormData({ ...formData, attendanceNo: e.target.value })}
              className="w-full p-2 border rounded mb-2"
            />
            <input
              name="nameWithInitials"
              placeholder="Name with Initials"
              value={formData.nameWithInitials}
              onChange={(e) => setFormData({ ...formData, nameWithInitials: e.target.value })}
              className="w-full p-2 border rounded mb-2"
            />
            <input
              name="surname"
              placeholder="Surname"
              value={formData.surname}
              onChange={(e) => setFormData({ ...formData, surname: e.target.value })}
              className="w-full p-2 border rounded mb-2"
            />
          </Modal>

          {/* Details Modal */}
          <Modal isOpen={detailsOpen} onClose={() => setDetailsOpen(false)} title="Employee Details">
            {selectedReg && (
              <div className="space-y-2">
                <p><strong>EPF No:</strong> {selectedReg.epfNo}</p>
                <p><strong>Full Name:</strong> {selectedReg.fullName}</p>
                <p><strong>NIC No:</strong> {selectedReg.nicNo || 'N/A'}</p>
                <p><strong>Date of Birth:</strong> {selectedReg.dateOfBirth || 'N/A'}</p>
                <p><strong>Civil Status:</strong> {selectedReg.civilStatus || 'N/A'}</p>
                <p><strong>Gender:</strong> {selectedReg.gender || 'N/A'}</p>
                <p><strong>Race:</strong> {selectedReg.race || 'N/A'}</p>
                <p><strong>Religion:</strong> {selectedReg.religion || 'N/A'}</p>
                <p><strong>Blood Group:</strong> {selectedReg.bloodGroup || 'N/A'}</p>
                <p><strong>Permanent Address:</strong> {selectedReg.permanentAddress || 'N/A'}</p>
                <p><strong>District:</strong> {selectedReg.district || 'N/A'}</p>
                <p><strong>Mobile No:</strong> {selectedReg.mobileNo || 'N/A'}</p>
                <p><strong>Personal Email:</strong> {selectedReg.personalEmail || 'N/A'}</p>
                <p><strong>Card Status:</strong> {selectedReg.cardStatus || 'N/A'}</p>
                <p><strong>Current Address:</strong> {selectedReg.currentAddress || 'N/A'}</p>
                <p><strong>DS Division:</strong> {selectedReg.dsDivision || 'N/A'}</p>
                <p><strong>Residence Phone:</strong> {selectedReg.residencePhone || 'N/A'}</p>
                <p><strong>Emergency Contact:</strong> {selectedReg.emergencyContact || 'N/A'}</p>
                <p><strong>Working Status:</strong> {selectedReg.workingStatus || 'N/A'}</p>
                <p><strong>Department:</strong> {selectedReg.department || 'N/A'}</p>
                <p><strong>Attendance No:</strong> {selectedReg.attendanceNo || 'N/A'}</p>
                <p><strong>Name with Initials:</strong> {selectedReg.nameWithInitials || 'N/A'}</p>
                <p><strong>Surname:</strong> {selectedReg.surname || 'N/A'}</p>
                {selectedReg.imageUrl && (
                  <img src={selectedReg.imageUrl} alt="Profile" className="w-32 h-32 object-cover mt-2" />
                )}
              </div>
            )}
          </Modal>

          <button onClick={toggleSidebar} className="md:hidden fixed top-4 left-4 p-2 bg-gray-200 rounded">
            Menu
          </button>
        </main>
      </div>
    </div>
  );
}
