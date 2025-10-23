// app/admin/users/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Topbar from '../../../components/Topbar';
import Sidebar from '../../../components/Sidebar';
import Modal from '../../../components/Modal';
import api from '../../../lib/api';
import { useAuth } from '../../../hooks/useAuth';
import { User as UserType, Registration } from '../../../types';
import { Plus, Printer, ArrowRightLeft, CheckCircle, XCircle, Download } from 'lucide-react';
import Papa from 'papaparse';

interface Role {
  id: number;
  code: string;
  name: string;
  description: string;
}

export default function Users() {
  const { user } = useAuth();

  const [users, setUsers] = useState<UserType[]>([]);
  const [employees, setEmployees] = useState<Registration[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);

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
  const canDelete = has('DELETE'); // reserved if you add delete later
  const canPrint  = has('PRINT');  // also gates Export CSV

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

  const toggleSidebar = () => setIsOpenSidebar(!isOpenSidebar);

  if (!user) return <div>Loading...</div>;

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar user={user} isOpen={isOpenSidebar} onClose={toggleSidebar} />
      <div className="flex-1 flex flex-col">
        <Topbar user={user} />
        <main className="flex-1 p-6 overflow-auto">
          {/* Toolbar */}
          <div className="flex flex-wrap gap-3 mb-4">
            {canCreate && (
              <button
                onClick={handleOpen}
                className="flex items-center px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                <Plus className="w-4 h-4 mr-2" /> Add User
              </button>
            )}

            {canPrint && (
              <button
                onClick={handlePrint}
                className="flex items-center px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                <Printer className="w-4 h-4 mr-2" /> Print
              </button>
            )}

            {canPrint && (
              <button
                onClick={handleExport}
                className="flex items-center px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              >
                <Download className="w-4 h-4 mr-2" /> Export CSV
              </button>
            )}

            {canUpdate && (
              <button
                onClick={() => setTransferOpen(true)}
                className="flex items-center px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
              >
                <ArrowRightLeft className="w-4 h-4 mr-2" /> Transfer Role
              </button>
            )}
          </div>

          {successMessage && (
            <p className="mb-4 text-green-500 flex items-center">
              <CheckCircle className="mr-2" /> {successMessage}
            </p>
          )}
          {errorMessage && (
            <p className="mb-4 text-red-500 flex items-center">
              <XCircle className="mr-2" /> {errorMessage}
            </p>
          )}

          {/* Users Table / No-permission state */}
          {!canRead ? (
            <div className="p-4 bg-white rounded shadow">
              You don’t have permission to view users (need <code>READ</code>).
            </div>
          ) : (
            <table className="w-full bg-white rounded shadow">
              <thead>
                <tr className="bg-gray-200">
                  <th className="p-2 text-left">Username</th>
                  <th className="p-2 text-left">Full Name</th>
                  <th className="p-2 text-left">Email</th>
                  <th className="p-2 text-left">Roles</th>
                  <th className="p-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.length ? (
                  users.map((u) => (
                    <tr key={u.id} className="border-b">
                      <td className="p-2">{u.username}</td>
                      <td className="p-2">{u.fullName}</td>
                      <td className="p-2">{u.email}</td>
                      <td className="p-2">{(u.roles || []).join(', ')}</td>
                      <td className="p-2">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleViewOpen(u)}
                            className="text-blue-600 hover:text-blue-800"
                            title="View"
                          >
                            View
                          </button>

                          {canUpdate && (
                            <button
                              onClick={() => handleEditOpen(u)}
                              className="text-indigo-600 hover:text-indigo-800"
                              title="Edit"
                            >
                              Edit
                            </button>
                          )}

                          {canPrint && (
                            <button
                              onClick={handlePrint}
                              className="text-gray-600 hover:text-gray-800"
                              title="Print"
                            >
                              <Printer className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="p-2 text-center">
                      No users available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}

          {/* Add User Modal */}
          <Modal
            isOpen={open}
            onClose={() => setOpen(false)}
            title="Add User from Employee"
            onSubmit={handleSubmit}
          >
            <select
              value={selectedEpf}
              onChange={(e) => setSelectedEpf(e.target.value)}
              className="w-full p-2 border rounded mb-2"
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
            <input
              placeholder="Username"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              className="w-full p-2 border rounded mb-2"
            />
            <input
              placeholder="Email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full p-2 border rounded mb-2"
            />
            <input
              type="password"
              placeholder="Password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full p-2 border rounded mb-2"
            />
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full p-2 border rounded mb-2"
            >
              <option value="">Select Initial Role</option>
              {roles.map((r) => (
                <option key={r.code} value={r.code}>
                  {r.code}
                </option>
              ))}
            </select>
          </Modal>

          {/* Edit User Modal */}
          <Modal
            isOpen={editOpen}
            onClose={() => setEditOpen(false)}
            title="Update User"
            onSubmit={handleEditSubmit}
          >
            <input
              placeholder="Username"
              value={editFormData.username}
              disabled
              className="w-full p-2 border rounded mb-2 opacity-50"
            />
            <input
              placeholder="Email"
              value={editFormData.email}
              onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
              className="w-full p-2 border rounded mb-2"
            />
            <select
              value={editFormData.role}
              onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value })}
              className="w-full p-2 border rounded mb-2"
            >
              <option value="">Assign Additional Role</option>
              {roles.map((r) => (
                <option key={r.code} value={r.code}>
                  {r.code}
                </option>
              ))}
            </select>
          </Modal>

          {/* View User Modal */}
          <Modal
            isOpen={viewOpen}
            onClose={() => setViewOpen(false)}
            title="User Details"
          >
            {selectedUser && (
              <div className="space-y-2">
                <p><strong>Username:</strong> {selectedUser.username}</p>
                <p><strong>Full Name:</strong> {selectedUser.fullName}</p>
                <p><strong>Email:</strong> {selectedUser.email || 'N/A'}</p>
                <p><strong>EPF No:</strong> {selectedUser.epfNo || 'N/A'}</p>
                <p><strong>Department:</strong> {selectedUser.department || 'N/A'}</p>
                <p><strong>Roles:</strong> {(selectedUser.roles || []).length ? selectedUser.roles.join(', ') : 'None'}</p>
              </div>
            )}
          </Modal>

          {/* Transfer Role Modal (gated by UPDATE) */}
          <Modal
            isOpen={transferOpen}
            onClose={() => setTransferOpen(false)}
            title="Transfer Role"
            onSubmit={handleTransfer}
          >
            <select
              value={fromUserId}
              onChange={(e) => setFromUserId(e.target.value)}
              className="w-full p-2 border rounded mb-2"
            >
              <option value="">From User</option>
              {users.map((u) => (
                <option key={u.id} value={u.id?.toString()}>
                  {u.username} - Roles: {(u.roles || []).join(', ')}
                </option>
              ))}
            </select>

            <select
              value={toUserId}
              onChange={(e) => setToUserId(e.target.value)}
              className="w-full p-2 border rounded mb-2"
            >
              <option value="">To User</option>
              {users
                .filter((u) => u.id?.toString() !== fromUserId)
                .map((u) => (
                  <option key={u.id} value={u.id?.toString()}>
                    {u.username} - Roles: {(u.roles || []).join(', ')}
                  </option>
                ))}
            </select>

            <select
              value={roleCode}
              onChange={(e) => setRoleCode(e.target.value)}
              className="w-full p-2 border rounded mb-2"
            >
              <option value="">Role to Transfer</option>
              {users.find((u) => u.id?.toString() === fromUserId)?.roles?.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </Modal>

          {/* Confirm Transfer */}
          <Modal
            isOpen={confirmOpen}
            onClose={() => setConfirmOpen(false)}
            title="Transfer Confirmation"
            onSubmit={handleConfirmTransfer}
          >
            <p className="mb-4">Role transferred successfully. Confirm to continue.</p>
          </Modal>

          <button
            onClick={toggleSidebar}
            className="md:hidden fixed top-4 left-4 p-2 bg-gray-200 rounded"
          >
            Menu
          </button>
        </main>
      </div>
    </div>
  );
}
