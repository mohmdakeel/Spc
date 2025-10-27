// app/admin/users/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Topbar from '../../../components/Topbar';
import Sidebar from '../../../components/Sidebar';
import Modal from '../../../components/Modal';
import api from '../../../lib/api';
import { useAuth } from '../../../hooks/useAuth';
import { User as UserType, Registration } from '../../../types';
import { 
  Plus, 
  Printer, 
  ArrowRightLeft, 
  CheckCircle, 
  XCircle, 
  Download, 
  Users as UsersIcon,
  Edit,
  Eye,
  Shield,
  Key,
  Mail,
  User as UserIcon,
  Search,
  Filter
} from 'lucide-react';
import Papa from 'papaparse';

interface Role {
  id: number;
  code: string;
  name: string;
  description: string;
}

export default function UsersManagement() {  // Changed from 'Users' to 'UsersManagement'
  const { user } = useAuth();

  const [users, setUsers] = useState<UserType[]>([]);
  const [employees, setEmployees] = useState<Registration[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Modals & UI state
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isOpenSidebar, setIsOpenSidebar] = useState(false);

  // Forms
  const [formData, setFormData] = useState({ username: '', email: '', password: '', role: '' });
  const [editFormData, setEditFormData] = useState({ username: '', email: '', role: '' });

  // Selections
  const [selectedEpf, setSelectedEpf] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [fromUserId, setFromUserId] = useState('');
  const [toUserId, setToUserId] = useState('');
  const [roleCode, setRoleCode] = useState('');

  // Messages
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // ---- GLOBAL 5 permission helpers ----
  const has       = (p: string) => !!user?.permissions?.includes(p);
  const canRead   = has('READ');
  const canCreate = has('CREATE');
  const canUpdate = has('UPDATE');
  const canDelete = has('DELETE');
  const canPrint  = has('PRINT');

  // Filter users based on search term
  const filteredUsers = users.filter(u =>
    u.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.epfNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.roles?.some(role => role.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  useEffect(() => {
    if (!user) return;

    if (canRead) {
      fetchUsers();
      fetchEmployees();
    }
    fetchRoles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // ---- Fetchers ----
  const fetchUsers = async () => {
    try {
      const { data } = await api.get('/users');
      const base: any[] = Array.isArray(data) ? data : [];

      // hydrate roles per user (keeps your helper endpoint)
      const usersWithRoles: UserType[] = await Promise.all(
        base.map(async (u: any) => {
          let roles: string[] = [];
          try {
            const { data: rs } = await api.get(`/users/${encodeURIComponent(u.username)}/roles`);
            roles = Array.isArray(rs) ? rs : [];
          } catch { /* ignore */ }

          return {
            ...u,
            roles,
            permissions: Array.isArray(u.permissions) ? u.permissions : [],
          } as UserType;
        })
      );

      setUsers(usersWithRoles);
    } catch (error: any) {
      if (error?.response?.status === 403) {
        setErrorMessage('Forbidden (403): missing READ permission.');
      } else {
        setErrorMessage('Failed to fetch users');
      }
    }
  };

  const fetchEmployees = async () => {
    try {
      const { data } = await api.get('/registrations');
      setEmployees(data);
    } catch (error) {
      console.error('Failed to fetch employees:', error);
    }
  };

  const fetchRoles = async () => {
    try {
      const { data } = await api.get('/roles');
      setRoles(Array.isArray(data) ? data : []);
    } catch (error) {
      console.warn('Fetching roles failed (likely restricted):', error);
    }
  };

  // ---- UI Handlers ----
  const handleOpen = () => {
    if (!canCreate) { setErrorMessage('You do not have permission (CREATE).'); return; }
    setFormData({ username: '', email: '', password: '', role: '' });
    setSelectedEpf('');
    setOpen(true);
    setErrorMessage('');
  };

  const handleEditOpen = (u: UserType) => {
    if (!canUpdate) { setErrorMessage('You do not have permission (UPDATE).'); return; }
    setSelectedUser(u);
    setEditFormData({ username: u.username, email: u.email || '', role: '' });
    setEditOpen(true);
    setErrorMessage('');
  };

  const handleViewOpen = (u: UserType) => { setSelectedUser(u); setViewOpen(true); };

  // Create user from employee
  const handleSubmit = async () => {
    if (!canCreate) { setErrorMessage('You do not have permission (CREATE).'); return; }
    if (!selectedEpf) { setErrorMessage('Please select an employee'); return; }

    try {
      await api.post('/users/create-from-employee', formData, { params: { epfNo: selectedEpf } });
      setOpen(false);
      setSuccessMessage('User created successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
      if (canRead) fetchUsers();
    } catch (error: any) {
      setErrorMessage(error?.response?.data?.message || 'Failed to create user');
    }
  };

  const handleEditSubmit = async () => {
    if (!canUpdate || !selectedUser) return;
    try {
      if (editFormData.email) {
        await api.put(`/users/${selectedUser.id}`, { email: editFormData.email });
      }
      if (editFormData.role) {
        await api.post(`/users/${selectedUser.id}/assign-role`, { roleCode: editFormData.role });
      }
      setEditOpen(false);
      setSuccessMessage('User updated successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
      if (canRead) fetchUsers();
    } catch (error: any) {
      setErrorMessage(error?.response?.data?.message || 'Failed to update user');
    }
  };

  // Transfer role (gated by UPDATE)
  const handleTransfer = async () => {
    if (!canUpdate) { setErrorMessage('You do not have permission (UPDATE).'); return; }
    if (!fromUserId || !toUserId || !roleCode) {
      setErrorMessage('Please select source user, target user, and role');
      return;
    }
    try {
      await api.post(`/users/${fromUserId}/transfer-role/${toUserId}/${roleCode}`);
      setTransferOpen(false);
      setConfirmOpen(true);
      if (canRead) fetchUsers();
    } catch (error: any) {
      setErrorMessage(error?.response?.data?.message || 'Failed to transfer role');
    }
  };

  const handleConfirmTransfer = () => {
    setConfirmOpen(false);
    setSuccessMessage('Role transferred successfully!');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  // Export & Print (both gated by PRINT)
  const handleExport = () => {
    if (!canPrint) { setErrorMessage('You do not have permission (PRINT).'); return; }
    const csv = Papa.unparse(users);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'users.csv';
    link.click();
  };

  const handlePrint = () => {
    if (!canPrint) { setErrorMessage('You do not have permission (PRINT).'); return; }
    window.print();
  };

  if (!user) {
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
              <UsersIcon className="w-8 h-8 text-orange-600" />
              <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
            </div>
            <p className="text-gray-600">Manage system users and their roles</p>
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
            {/* MAIN CONTENT - USERS TABLE */}
            <div className="xl:col-span-3">
              <div className="bg-white rounded-2xl shadow-lg border border-orange-200 overflow-hidden">
                <div className="p-6 border-b border-orange-200 bg-orange-50">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                      <UserIcon className="w-5 h-5 text-orange-600" />
                      System Users
                    </h2>
                    
                    <div className="flex flex-col sm:flex-row gap-3">
                      {/* Search Box */}
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                          type="text"
                          placeholder="Search users..."
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
                        onClick={handleOpen}
                        className="flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium"
                      >
                        <Plus className="w-4 h-4 mr-2" /> 
                        Add User
                      </button>
                    )}

                    {canUpdate && (
                      <button
                        onClick={() => setTransferOpen(true)}
                        className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
                      >
                        <ArrowRightLeft className="w-4 h-4 mr-2" /> 
                        Transfer Role
                      </button>
                    )}

                    {canPrint && (
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
                        onClick={handlePrint}
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
                      You don't have permission to view users (need{' '}
                      <code className="bg-gray-100 px-2 py-1 rounded text-sm">READ</code>{' '}
                      permission).
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-orange-50">
                        <tr>
                          <th className="p-3 text-left text-sm font-semibold text-gray-700">Username</th>
                          <th className="p-3 text-left text-sm font-semibold text-gray-700">Full Name</th>
                          <th className="p-3 text-left text-sm font-semibold text-gray-700">Email</th>
                          <th className="p-3 text-left text-sm font-semibold text-gray-700">EPF No</th>
                          <th className="p-3 text-left text-sm font-semibold text-gray-700">Roles</th>
                          <th className="p-3 text-left text-sm font-semibold text-gray-700">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {filteredUsers.length > 0 ? (
                          filteredUsers.map((u) => (
                            <tr key={u.id} className="hover:bg-orange-50 transition-colors">
                              <td className="p-3">
                                <div className="font-medium text-gray-900">{u.username}</div>
                              </td>
                              <td className="p-3">
                                <div className="text-gray-900">{u.fullName}</div>
                              </td>
                              <td className="p-3">
                                <div className="text-gray-600 flex items-center gap-2">
                                  <Mail className="w-4 h-4 text-gray-400" />
                                  {u.email || 'N/A'}
                                </div>
                              </td>
                              <td className="p-3">
                                <div className="text-gray-600">{u.epfNo || 'N/A'}</div>
                              </td>
                              <td className="p-3">
                                <div className="flex flex-wrap gap-1">
                                  {(u.roles || []).map(role => (
                                    <span key={role} className="bg-orange-100 text-orange-700 px-2 py-1 rounded text-xs font-medium">
                                      {role}
                                    </span>
                                  ))}
                                </div>
                              </td>
                              <td className="p-3">
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleViewOpen(u)}
                                    className="flex items-center px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm"
                                  >
                                    <Eye className="w-4 h-4 mr-1" />
                                    View
                                  </button>

                                  {canUpdate && (
                                    <button
                                      onClick={() => handleEditOpen(u)}
                                      className="flex items-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                                    >
                                      <Edit className="w-4 h-4 mr-1" />
                                      Edit
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={6} className="p-6 text-center text-gray-500">
                              {searchTerm ? 'No matching users found' : 'No users available'}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT COLUMN - QUICK STATS & PERMISSIONS */}
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
                    <span className="text-gray-600">Total Users</span>
                    <span className="text-2xl font-bold text-orange-600">{users.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Filtered</span>
                    <span className="text-2xl font-bold text-blue-600">{filteredUsers.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Available Roles</span>
                    <span className="text-2xl font-bold text-green-600">{roles.length}</span>
                  </div>
                </div>
              </div>

              {/* YOUR PERMISSIONS */}
              <div className="bg-white rounded-2xl shadow-lg border border-orange-200 overflow-hidden">
                <div className="p-6 border-b border-orange-200 bg-orange-50">
                  <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <Key className="w-5 h-5 text-orange-600" />
                    Your Permissions
                  </h2>
                </div>
                <div className="p-6">
                  <div className="space-y-3">
                    <div className={`p-3 rounded-lg border ${canRead ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">View Users</span>
                        {canRead ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <XCircle className="w-4 h-4 text-gray-400" />
                        )}
                      </div>
                    </div>
                    <div className={`p-3 rounded-lg border ${canCreate ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">Create Users</span>
                        {canCreate ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <XCircle className="w-4 h-4 text-gray-400" />
                        )}
                      </div>
                    </div>
                    <div className={`p-3 rounded-lg border ${canUpdate ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">Edit Users</span>
                        {canUpdate ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <XCircle className="w-4 h-4 text-gray-400" />
                        )}
                      </div>
                    </div>
                    <div className={`p-3 rounded-lg border ${canPrint ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">Export/Print</span>
                        {canPrint ? (
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

          {/* ADD USER MODAL */}
          <Modal
            isOpen={open}
            onClose={() => setOpen(false)}
            title="Add User from Employee"
            onSubmit={handleSubmit}
            submitText="Create User"
            size="md"
          >
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Employee *</label>
                <select
                  value={selectedEpf}
                  onChange={(e) => setSelectedEpf(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value="">Select Employee EPF</option>
                  {employees
                    .filter((emp) => !users.some((u) => u.epfNo === emp.epfNo))
                    .map((emp) => (
                      <option key={emp.epfNo} value={emp.epfNo}>
                        {emp.epfNo} - {emp.fullName}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Username *</label>
                <input
                  placeholder="Username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  placeholder="Email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password *</label>
                <input
                  type="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Initial Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value="">Select Initial Role</option>
                  {roles.map((r) => (
                    <option key={r.code} value={r.code}>
                      {r.code} - {r.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </Modal>

          {/* EDIT USER MODAL */}
          <Modal
            isOpen={editOpen}
            onClose={() => setEditOpen(false)}
            title="Update User"
            onSubmit={handleEditSubmit}
            submitText="Update User"
            size="md"
          >
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
                <input
                  placeholder="Username"
                  value={editFormData.username}
                  disabled
                  className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 opacity-75"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  placeholder="Email"
                  value={editFormData.email}
                  onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Assign Additional Role</label>
                <select
                  value={editFormData.role}
                  onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value="">Select Role to Assign</option>
                  {roles.map((r) => (
                    <option key={r.code} value={r.code}>
                      {r.code} - {r.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </Modal>

          {/* VIEW USER MODAL */}
          <Modal
            isOpen={viewOpen}
            onClose={() => setViewOpen(false)}
            title="User Details"
            size="md"
            showFooter={false}
          >
            {selectedUser && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                    <p className="text-gray-900">{selectedUser.username}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                    <p className="text-gray-900">{selectedUser.fullName}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <p className="text-gray-900">{selectedUser.email || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">EPF No</label>
                    <p className="text-gray-900">{selectedUser.epfNo || 'N/A'}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                  <p className="text-gray-900">{selectedUser.department || 'N/A'}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Roles</label>
                  <div className="flex flex-wrap gap-1">
                    {(selectedUser.roles || []).length > 0 ? (
                      selectedUser.roles.map(role => (
                        <span key={role} className="bg-orange-100 text-orange-700 px-2 py-1 rounded text-xs font-medium">
                          {role}
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-500 text-sm">No roles assigned</span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </Modal>

          {/* TRANSFER ROLE MODAL */}
          <Modal
            isOpen={transferOpen}
            onClose={() => setTransferOpen(false)}
            title="Transfer Role"
            onSubmit={handleTransfer}
            submitText="Transfer Role"
            size="md"
          >
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">From User *</label>
                <select
                  value={fromUserId}
                  onChange={(e) => setFromUserId(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value="">Select Source User</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id?.toString()}>
                      {u.username} - Roles: {(u.roles || []).join(', ')}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">To User *</label>
                <select
                  value={toUserId}
                  onChange={(e) => setToUserId(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value="">Select Target User</option>
                  {users
                    .filter((u) => u.id?.toString() !== fromUserId)
                    .map((u) => (
                      <option key={u.id} value={u.id?.toString()}>
                        {u.username} - Roles: {(u.roles || []).join(', ')}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Role to Transfer *</label>
                <select
                  value={roleCode}
                  onChange={(e) => setRoleCode(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value="">Select Role</option>
                  {users.find((u) => u.id?.toString() === fromUserId)?.roles?.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </Modal>

          {/* CONFIRM TRANSFER MODAL */}
          <Modal
            isOpen={confirmOpen}
            onClose={() => setConfirmOpen(false)}
            title="Transfer Successful"
            onSubmit={handleConfirmTransfer}
            submitText="Confirm"
            size="sm"
          >
            <div className="text-center">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <p className="text-gray-700 mb-2">Role transferred successfully!</p>
              <p className="text-sm text-gray-500">Click confirm to continue.</p>
            </div>
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