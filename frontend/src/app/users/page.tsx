'use client';

import { useState, useEffect, useMemo } from 'react';
import Topbar from '../../../components/Topbar';
import Sidebar from '../../../components/Sidebar';
import Modal from '../../../components/Modal';
import { PermissionGate } from '../../../components/PermissionGate';
import ResetPasswordModal from '../users/ResetPasswordModal';
import api from '../../../lib/api';
import { useAuth } from '../../../hooks/useAuth';
import { usePermissionFlags } from '../../../hooks/usePermissionFlags';
import { User as UserType, Registration } from '../../../types';
import { printDocument, escapeHtml } from '../../../lib/print';
import { readCache, writeCache } from '../../../lib/cache';

import {
  Plus,
  Printer,
  ArrowRightLeft,
  CheckCircle,
  XCircle,
  Download,
  Users as UsersIcon,
  Edit,
  Shield,
  Mail,
  User as UserIcon,
  Search,
  ChevronLeft,
  ChevronRight,
  Lock,
} from 'lucide-react';

import Papa from 'papaparse';

// helper: safe text display
const txt = (v?: string) => (v && v.trim() !== '' ? v : 'N/A');

const formatPrintValue = (value?: string | number | null) => {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return escapeHtml(trimmed.length ? trimmed : '—');
  }
  return escapeHtml(String(value));
};

// ---- Role type ----
interface Role {
  id: number;
  code: string;
  name: string;
  description: string;
}

export default function UsersManagement() {
  const { user } = useAuth();

  // ----------------------------
  // DATA STATE (seed from cache for instant render)
  // ----------------------------
  const cachedUsers = readCache<UserType[]>('cache:auth:users:list') || [];
  const cachedEmployees = readCache<Registration[]>('cache:auth:employees:list') || [];
  const cachedRoles = readCache<Role[]>('cache:auth:roles:list') || [];
  const [users, setUsers] = useState<UserType[]>(cachedUsers);
  const [employees, setEmployees] = useState<Registration[]>(cachedEmployees);
  const [roles, setRoles] = useState<Role[]>(cachedRoles);

  // ----------------------------
  // FILTER / PAGINATION STATE
  // ----------------------------
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(10); // 10 or 15

  // ----------------------------
  // UI STATE (modals etc.)
  // ----------------------------
  const [open, setOpen] = useState(false); // Add User modal
  const [editOpen, setEditOpen] = useState(false); // Edit User modal
  const [viewOpen, setViewOpen] = useState(false); // View User modal
  const [transferOpen, setTransferOpen] = useState(false); // Transfer Role modal
  const [confirmOpen, setConfirmOpen] = useState(false); // Transfer done confirm modal
  const [isOpenSidebar, setIsOpenSidebar] = useState(false); // mobile sidebar

  // NEW: Reset Password modal
  const [resetOpen, setResetOpen] = useState(false);
  const [resetUser, setResetUser] = useState<UserType | null>(null);

  // ----------------------------
  // FORM STATE
  // ----------------------------
  // create user
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: '',
  });

  // edit user
  const [editFormData, setEditFormData] = useState({
    username: '',
    email: '',
    role: '',
  });

  // transfer role
  const [fromUserId, setFromUserId] = useState('');
  const [toUserId, setToUserId] = useState('');
  const [roleCode, setRoleCode] = useState('');

  // selections
  const [selectedEpf, setSelectedEpf] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);

  // ----------------------------
  // MESSAGE STATE
  // ----------------------------
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const hasCached = cachedUsers.length > 0 || cachedEmployees.length > 0;
  const [loading, setLoading] = useState(!hasCached);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // ----------------------------
  // PERMISSIONS
  // ----------------------------
  const { canRead, canCreate, canUpdate, canPrint } = usePermissionFlags();

  // ----------------------------
  // FILTER + PAGINATION LOGIC
  // ----------------------------
  const filteredUsers = useMemo(() => {
    const t = searchTerm.toLowerCase();
    return users.filter((u) => {
      return (
        u.username?.toLowerCase().includes(t) ||
        u.fullName?.toLowerCase().includes(t) ||
        u.email?.toLowerCase().includes(t) ||
        u.epfNo?.toLowerCase().includes(t) ||
        (u.roles || []).some((r) => r.toLowerCase().includes(t))
      );
    });
  }, [users, searchTerm]);

  // whenever search or pageSize changes, jump to page 1
  useEffect(() => {
    setPage(1);
  }, [searchTerm, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const startIdx = (safePage - 1) * pageSize;
  const currentPageUsers = filteredUsers.slice(startIdx, startIdx + pageSize);

  // ----------------------------
  // DATA LOADING
  // ----------------------------
  useEffect(() => {
    if (!user) return;

    const silent = !!hasCached;
    if (user && canRead) {
      fetchUsers({ silent });
      fetchEmployees({ silent });
    } else {
      setUsers([]);
      setEmployees([]);
    }
    fetchRoles({ silent });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, canRead]);

  const withTimeout = <T,>(promiseFactory: (signal: AbortSignal) => Promise<T>, ms = 10000) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), ms);
    const run = promiseFactory(controller.signal).finally(() => clearTimeout(timeout));
    return { run };
  };

  const fetchUsers = async (opts?: { silent?: boolean }) => {
    if (opts?.silent) setIsRefreshing(true);
    else setLoading(true);

    const { run } = withTimeout((signal) => api.get('/users', { signal }), 10000);

    try {
      const { data } = await run as any;
      const base: any[] = Array.isArray(data) ? data : [];

      const normalised: UserType[] = base.map((u: any) => ({
        ...u,
        roles: Array.isArray(u.roles) ? u.roles : [],
        permissions: Array.isArray(u.permissions) ? u.permissions : [],
      }));

      setUsers(normalised);
      writeCache('cache:auth:users:list', normalised);
    } catch (error: any) {
      if (error?.response?.status === 403) {
        setErrorMessage('Forbidden (403): missing READ permission.');
      } else if (error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED' || error?.name === 'AbortError') {
        setErrorMessage('Fetching users timed out. Showing cached data.');
      } else {
        setErrorMessage('Failed to fetch users');
      }
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const fetchEmployees = async (opts?: { silent?: boolean }) => {
    if (opts?.silent) setIsRefreshing(true);
    const { run } = withTimeout((signal) => api.get('/registrations', { signal }), 10000);
    try {
      const { data } = await run as any;
      const list = Array.isArray(data) ? data : [];
      setEmployees(list);
      writeCache('cache:auth:employees:list', list);
    } catch (error: any) {
      console.error('Failed to fetch employees:', error);
      if (error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED' || error?.name === 'AbortError') {
        setErrorMessage('Employee lookup timed out. Showing cached list.');
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  const fetchRoles = async (opts?: { silent?: boolean }) => {
    if (opts?.silent) setIsRefreshing(true);
    const { run } = withTimeout((signal) => api.get('/roles', { signal }), 10000);
    try {
      const { data } = await run as any;
      const list = Array.isArray(data) ? data : [];
      setRoles(list);
      writeCache('cache:auth:roles:list', list);
    } catch (error) {
      // roles endpoint may be restricted
      console.warn('Fetching roles may be restricted:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // ----------------------------
  // OPEN MODALS / ACTION HANDLERS
  // ----------------------------
  const openAddUserModal = () => {
    if (!canCreate) {
      setErrorMessage('You do not have permission (CREATE).');
      return;
    }
    setFormData({
      username: '',
      email: '',
      password: '',
      role: '',
    });
    setSelectedEpf('');
    setOpen(true);
    setErrorMessage('');
  };

  const openEditUserModal = (u: UserType) => {
    if (!canUpdate) {
      setErrorMessage('You do not have permission (UPDATE).');
      return;
    }
    setSelectedUser(u);
    setEditFormData({
      username: u.username,
      email: u.email || '',
      role: '',
    });
    setEditOpen(true);
    setErrorMessage('');
  };

  const openViewUserModal = (u: UserType) => {
    setSelectedUser(u);
    setViewOpen(true);
  };

  // NEW: open reset password modal
  const openResetModal = (u: UserType) => {
    if (!canUpdate) {
      setErrorMessage('You do not have permission (UPDATE).');
      return;
    }
    setResetUser(u);
    setResetOpen(true);
  };

  // row click -> view user
  const handleRowClick = (u: UserType) => {
    openViewUserModal(u);
  };

  // ----------------------------
  // CREATE USER
  // ----------------------------
  const handleSubmitCreate = async () => {
    if (!canCreate) {
      setErrorMessage('You do not have permission (CREATE).');
      return;
    }
    if (!selectedEpf) {
      setErrorMessage('Please select an employee');
      return;
    }

    try {
      await api.post(
        '/users/create-from-employee',
        formData,
        { params: { epfNo: selectedEpf } }
      );

      setOpen(false);
      setSuccessMessage('User created successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);

      if (canRead) fetchUsers();
    } catch (error: any) {
      setErrorMessage(
        error?.response?.data?.message || 'Failed to create user'
      );
    }
  };

  // ----------------------------
  // UPDATE USER (email / assign role)
  // ----------------------------
  const handleSubmitEdit = async () => {
    if (!canUpdate || !selectedUser) return;

    try {
      // update email
      if (editFormData.email) {
        await api.put(`/users/${selectedUser.id}`, {
          email: editFormData.email,
        });
      }

      // assign new role
      if (editFormData.role) {
        await api.post(`/users/${selectedUser.id}/assign-role`, {
          roleCode: editFormData.role,
        });
      }

      setEditOpen(false);
      setSuccessMessage('User updated successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);

      if (canRead) fetchUsers();
    } catch (error: any) {
      setErrorMessage(
        error?.response?.data?.message || 'Failed to update user'
      );
    }
  };

  // ----------------------------
  // TRANSFER ROLE
  // ----------------------------
  const handleTransferRole = async () => {
    if (!canUpdate) {
      setErrorMessage('You do not have permission (UPDATE).');
      return;
    }

    if (!fromUserId || !toUserId || !roleCode) {
      setErrorMessage(
        'Please select source user, target user, and role'
      );
      return;
    }

    try {
      await api.post(
        `/users/${fromUserId}/transfer-role/${toUserId}/${roleCode}`
      );
      setTransferOpen(false);
      setConfirmOpen(true);

      if (canRead) fetchUsers();
    } catch (error: any) {
      setErrorMessage(
        error?.response?.data?.message || 'Failed to transfer role'
      );
    }
  };

  const handleConfirmTransfer = () => {
    setConfirmOpen(false);
    setSuccessMessage('Role transferred successfully!');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  // ----------------------------
  // EXPORT CSV
  // ----------------------------
  const handleExportCsv = () => {
    if (!canPrint) {
      setErrorMessage('You do not have permission (PRINT).');
      return;
    }
    const csv = Papa.unparse(users);
    const blob = new Blob([csv], {
      type: 'text/csv;charset=utf-8;',
    });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'users.csv';
    link.click();
  };

  // ----------------------------
  // PRINT ALL TABLE
  // ----------------------------
  const handlePrintTable = () => {
    if (!canPrint) {
      setErrorMessage('You do not have permission (PRINT).');
      return;
    }

    const rows = filteredUsers;
    const tableRows = rows
      .map(
        (u, index) => `
        <tr>
          <td>${formatPrintValue(index + 1)}</td>
          <td>${formatPrintValue(u.username)}</td>
          <td>${formatPrintValue(u.fullName)}</td>
          <td>${formatPrintValue(u.email)}</td>
          <td>${formatPrintValue(u.department)}</td>
          <td>${formatPrintValue((u.roles || []).join(', '))}</td>
        </tr>
      `
      )
      .join('');

    const tableHtml = rows.length
      ? `<table class="spc-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Username</th>
              <th>Full Name</th>
              <th>Email</th>
              <th>Department</th>
              <th>Roles</th>
            </tr>
          </thead>
          <tbody>${tableRows}</tbody>
        </table>`
      : '<div class="spc-empty">No users match the current filters.</div>';

    printDocument({
      title: 'System Users Report',
      subtitle: rows.length ? `Records shown: ${rows.length}` : undefined,
      contentHtml: tableHtml,
      printedBy: user?.fullName?.trim() || user?.username || undefined,
    });
  };

  // ----------------------------
  // PRINT SINGLE USER PAGE
  // ----------------------------
  const handlePrintUser = (u: UserType) => {
    if (!canPrint) {
      setErrorMessage('You do not have permission (PRINT).');
      return;
    }

    const rolesSection =
      (u.roles || []).length > 0
        ? (u.roles || [])
            .map(
              (role) => `<span class="spc-chip spc-chip--role">${formatPrintValue(role)}</span>`
            )
            .join('')
        : '<div class="spc-empty">No roles assigned.</div>';

    const permsSection =
      (u.permissions || []).length > 0
        ? (u.permissions || [])
            .map(
              (perm) => `<span class="spc-chip spc-chip--perm">${formatPrintValue(perm)}</span>`
            )
            .join('')
        : '<div class="spc-empty">No permissions assigned.</div>';

    const contentHtml = `
      <div class="spc-section">
        <p class="spc-section__title">Account Information</p>
        <table class="spc-definition">
          <tr><td>Username</td><td>${formatPrintValue(u.username)}</td></tr>
          <tr><td>Full Name</td><td>${formatPrintValue(u.fullName)}</td></tr>
          <tr><td>Email</td><td>${formatPrintValue(u.email)}</td></tr>
          <tr><td>EPF No</td><td>${formatPrintValue(u.epfNo)}</td></tr>
          <tr><td>Department</td><td>${formatPrintValue(u.department)}</td></tr>
        </table>
      </div>
      <div class="spc-section">
        <p class="spc-section__title">Roles</p>
        ${rolesSection}
      </div>
      <div class="spc-section">
        <p class="spc-section__title">Effective Permissions</p>
        ${permsSection}
      </div>
    `;

    printDocument({
      title: 'User Profile',
      subtitle: `Username: ${txt(u.username)}`,
      contentHtml,
      printedBy: user?.fullName?.trim() || user?.username || undefined,
    });
  };

  // ----------------------------
  // RENDER EARLY RETURN IF NO USER
  // ----------------------------
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

  // ----------------------------
  // MAIN RENDER
  // ----------------------------
  const showSkeleton = loading && users.length === 0;
  return (
    <div className="auth-shell">
      {/* Sidebar */}
      <Sidebar
        user={user}
        isOpen={isOpenSidebar}
        onClose={() => setIsOpenSidebar(false)}
      />

      <div className="auth-shell__main overflow-hidden">
        <Topbar user={user} />

        <main className="auth-shell__content">
          {/* HEADER */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <UsersIcon className="w-8 h-8 text-orange-600" />
              <h1 className="text-3xl font-bold text-gray-900">
                User Management
              </h1>
            </div>
            <p className="text-gray-600">
              Manage system users and their roles
            </p>
            {isRefreshing && (
              <div className="mt-2 text-xs text-orange-700 flex items-center gap-2">
                <div className="w-3 h-3 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                Updating latest data…
              </div>
            )}
          </div>

          {/* GLOBAL MESSAGES */}
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
            {/* MAIN TABLE CARD */}
            <div className="w-full">
              <div className="bg-white rounded-2xl shadow-lg border border-orange-200 overflow-hidden">
                {/* TABLE HEADER / FILTERS */}
                <div className="p-6 border-b border-orange-200 bg-orange-50">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                      <UserIcon className="w-5 h-5 text-orange-600" />
                      System Users
                    </h2>

                    <div className="flex flex-col sm:flex-row gap-3">
                      {/* Search */}
                      <div className="relative">
                        <label htmlFor="userTableSearch" className="sr-only">
                          Search users
                        </label>
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                          id="userTableSearch"
                          name="userTableSearch"
                          type="text"
                          placeholder="Search users..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
                        />
                      </div>

                      {/* Page size */}
                      <div className="flex flex-col">
                        <label htmlFor="userPageSize" className="sr-only">
                          Users per page
                        </label>
                        <select
                          id="userPageSize"
                          name="userPageSize"
                          value={pageSize}
                          onChange={(e) =>
                            setPageSize(Number(e.target.value))
                          }
                          className="py-2 px-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        >
                          <option value={10}>10 / page</option>
                          <option value={15}>15 / page</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* TOP TOOLBAR */}
                <div className="p-4 border-b border-gray-200 bg-white">
                  <div className="flex flex-wrap gap-3">
                    <PermissionGate require="CREATE">
                      <button
                        onClick={openAddUserModal}
                        className="flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add User
                      </button>
                    </PermissionGate>

                    <PermissionGate require="UPDATE">
                      <button
                        onClick={() => setTransferOpen(true)}
                        className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
                      >
                        <ArrowRightLeft className="w-4 h-4 mr-2" />
                        Transfer Role
                      </button>
                    </PermissionGate>

                    <PermissionGate require="PRINT">
                      <button
                        onClick={handleExportCsv}
                        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Export CSV
                      </button>
                    </PermissionGate>

                    {canPrint && (
                      <button
                        onClick={handlePrintTable}
                        className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium"
                      >
                        <Printer className="w-4 h-4 mr-2" />
                        Print
                      </button>
                    )}
                  </div>
                </div>

                {/* TABLE BODY */}
                {!canRead ? (
                  <div className="p-8 text-center">
                    <Shield className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600">
                      You don&apos;t have permission to view users (need{' '}
                      <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                        READ
                      </code>{' '}
                      permission).
                    </p>
                  </div>
                ) : showSkeleton ? (
                  <div className="p-8 space-y-3">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                      Loading users...
                    </div>
                    <div className="h-10 bg-orange-100/70 rounded animate-pulse" />
                    <div className="h-10 bg-orange-100/70 rounded animate-pulse" />
                    <div className="h-10 bg-orange-100/70 rounded animate-pulse" />
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-orange-50">
                          <tr>
                            <th className="p-3 text-left text-sm font-semibold text-gray-700">
                              Username
                            </th>
                            <th className="p-3 text-left text-sm font-semibold text-gray-700">
                              Full Name
                            </th>
                            <th className="p-3 text-left text-sm font-semibold text-gray-700">
                              Email
                            </th>
                            <th className="p-3 text-left text-sm font-semibold text-gray-700">
                              EPF No
                            </th>
                            <th className="p-3 text-left text-sm font-semibold text-gray-700">
                              Roles
                            </th>
                            <th className="p-3 text-left text-sm font-semibold text-gray-700">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {currentPageUsers.length > 0 ? (
                            currentPageUsers.map((u) => (
                              <tr
                                key={u.id}
                                className="hover:bg-orange-50 transition-colors cursor-pointer"
                                onClick={() => handleRowClick(u)}
                              >
                                {/* Username */}
                                <td className="p-3">
                                  <div className="font-medium text-gray-900">
                                    {u.username}
                                  </div>
                                </td>

                                {/* Full name */}
                                <td className="p-3 text-gray-900">
                                  {u.fullName || 'N/A'}
                                </td>

                                {/* Email */}
                                <td className="p-3">
                                  <div className="text-gray-600 flex items-center gap-2">
                                    <Mail className="w-4 h-4 text-gray-400" />
                                    {u.email || 'N/A'}
                                  </div>
                                </td>

                                {/* EPF */}
                                <td className="p-3 text-gray-600">
                                  {u.epfNo || 'N/A'}
                                </td>

                                {/* Roles */}
                                <td className="p-3">
                                  <div className="flex flex-wrap gap-1">
                                    {(u.roles || []).map((r) => (
                                      <span
                                        key={r}
                                        className="bg-orange-100 text-orange-700 px-2 py-1 rounded text-xs font-medium"
                                      >
                                        {r}
                                      </span>
                                    ))}
                                    {(u.roles || []).length === 0 && (
                                      <span className="text-gray-500 text-sm">
                                        N/A
                                      </span>
                                    )}
                                  </div>
                                </td>

                                {/* Actions */}
                                <td
                                  className="p-3"
                                  // prevent row click when pressing buttons
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <div className="flex flex-wrap gap-2">
                                    {canPrint && (
                                      <button
                                        onClick={() => handlePrintUser(u)}
                                        className="flex items-center px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
                                      >
                                        <Printer className="w-4 h-4 mr-1" />
                                        Print
                                      </button>
                                    )}

                                    {canUpdate && (
                                      <button
                                        onClick={() =>
                                          openEditUserModal(u)
                                        }
                                        className="flex items-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                                      >
                                        <Edit className="w-4 h-4 mr-1" />
                                        Edit
                                      </button>
                                    )}

                                    {canUpdate && (
                                      <button
                                        onClick={() => {
                                          setFromUserId(
                                            u.id?.toString() || ''
                                          );
                                          setToUserId('');
                                          setRoleCode('');
                                          setTransferOpen(true);
                                        }}
                                        className="flex items-center px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
                                      >
                                        <ArrowRightLeft className="w-4 h-4 mr-1" />
                                        Transfer
                                      </button>
                                    )}

                                    {canUpdate && (
                                      <button
                                        onClick={() => openResetModal(u)}
                                        className="flex items-center px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                                      >
                                        <Lock className="w-4 h-4 mr-1" />
                                        Reset PW
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td
                                colSpan={6}
                                className="p-6 text-center text-gray-500"
                              >
                                {searchTerm
                                  ? 'No matching users found'
                                  : 'No users available'}
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* PAGINATION FOOTER */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border-t border-gray-200 text-sm bg-white">
                      <div className="text-gray-600 mb-3 sm:mb-0">
                        Page {safePage} / {totalPages} • Showing{' '}
                        <span className="font-medium">
                          {currentPageUsers.length}
                        </span>{' '}
                        of{' '}
                        <span className="font-medium">
                          {filteredUsers.length.toString()}
                        </span>{' '}
                        users
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            setPage((p) => Math.max(1, p - 1))
                          }
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
                          onClick={() =>
                            setPage((p) =>
                              Math.min(totalPages, p + 1)
                            )
                          }
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

          {/* ========== MODALS ========== */}

          {/* ADD USER MODAL */}
          <Modal
            isOpen={open}
            onClose={() => setOpen(false)}
            title="Add User from Employee"
            onSubmit={handleSubmitCreate}
            submitText="Create User"
            size="md"
          >
            <div className="space-y-4">
              {/* Select employee */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Employee *
                </label>
                <select
                  value={selectedEpf}
                  onChange={(e) => setSelectedEpf(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value="">Select Employee EPF</option>
                  {employees
                    .filter(
                      (emp) =>
                        !users.some((u) => u.epfNo === emp.epfNo)
                    )
                    .map((emp) => (
                      <option key={emp.epfNo} value={emp.epfNo}>
                        {emp.epfNo} - {emp.fullName}
                      </option>
                    ))}
                </select>
              </div>

              {/* username */}
              <div>
                <label htmlFor="createUsername" className="block text-sm font-medium text-gray-700 mb-2">
                  Username *
                </label>
                <input
                  id="createUsername"
                  name="username"
                  placeholder="Username"
                  value={formData.username}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      username: e.target.value,
                    })
                  }
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>

              {/* email */}
              <div>
                <label htmlFor="createEmail" className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  id="createEmail"
                  name="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      email: e.target.value,
                    })
                  }
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>

              {/* password */}
              <div>
                <label htmlFor="createPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  Password *
                </label>
                <input
                  id="createPassword"
                  name="password"
                  type="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      password: e.target.value,
                    })
                  }
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>

              {/* Initial role */}
              <div>
                <label htmlFor="createRole" className="block text-sm font-medium text-gray-700 mb-2">
                  Initial Role
                </label>
                <select
                  id="createRole"
                  name="initialRole"
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      role: e.target.value,
                    })
                  }
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
            onSubmit={handleSubmitEdit}
            submitText="Update User"
            size="md"
          >
            <div className="space-y-4">
              {/* Username (readonly) */}
              <div>
                <label htmlFor="editUsername" className="block text-sm font-medium text-gray-700 mb-2">
                  Username
                </label>
                <input
                  id="editUsername"
                  name="editUsername"
                  placeholder="Username"
                  value={editFormData.username}
                  disabled
                  className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 opacity-75"
                />
              </div>

              {/* Email */}
              <div>
                <label htmlFor="editEmail" className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  id="editEmail"
                  name="editEmail"
                  placeholder="Email"
                  value={editFormData.email}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      email: e.target.value,
                    })
                  }
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>

              {/* Assign role */}
              <div>
                <label htmlFor="editAssignRole" className="block text-sm font-medium text-gray-700 mb-2">
                  Assign Additional Role
                </label>
                <select
                  id="editAssignRole"
                  name="editAssignRole"
                  value={editFormData.role}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      role: e.target.value,
                    })
                  }
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
                {/* BASIC INFO */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Username
                    </label>
                    <p className="text-gray-900">
                      {selectedUser.username}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name
                    </label>
                    <p className="text-gray-900">
                      {txt(selectedUser.fullName)}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <p className="text-gray-900">
                      {txt(selectedUser.email)}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      EPF No
                    </label>
                    <p className="text-gray-900">
                      {txt(selectedUser.epfNo)}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Department
                  </label>
                  <p className="text-gray-900">
                    {txt(selectedUser.department)}
                  </p>
                </div>

                {/* ROLES */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Roles
                  </label>
                  <div className="flex flex-wrap gap-1">
                    {(selectedUser.roles || []).length > 0 ? (
                      selectedUser.roles.map((role) => (
                        <span
                          key={role}
                          className="bg-orange-100 text-orange-700 px-2 py-1 rounded text-xs font-medium"
                        >
                          {role}
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-500 text-sm">
                        No roles assigned
                      </span>
                    )}
                  </div>
                </div>

                {/* PERMISSIONS */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Effective Permissions
                  </label>
                  <div className="text-sm text-gray-900 break-words">
                    {(selectedUser.permissions || []).length > 0
                      ? selectedUser.permissions.join(', ')
                      : 'N/A'}
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
            onSubmit={handleTransferRole}
            submitText="Transfer Role"
            size="md"
          >
            <div className="space-y-4">
              {/* From user */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  From User *
                </label>
                <select
                  value={fromUserId}
                  onChange={(e) => {
                    setFromUserId(e.target.value);
                    // reset role when source user changes
                    setRoleCode('');
                  }}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value="">Select Source User</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id?.toString()}>
                      {u.username} - Roles:{' '}
                      {(u.roles || []).join(', ') || 'N/A'}
                    </option>
                  ))}
                </select>
              </div>

              {/* To user */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  To User *
                </label>
                <select
                  value={toUserId}
                  onChange={(e) => setToUserId(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value="">Select Target User</option>
                  {users
                    .filter(
                      (u) => u.id?.toString() !== fromUserId
                    )
                    .map((u) => (
                      <option key={u.id} value={u.id?.toString()}>
                        {u.username} - Roles:{' '}
                        {(u.roles || []).join(', ') || 'N/A'}
                      </option>
                    ))}
                </select>
              </div>

              {/* Role to transfer */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role to Transfer *
                </label>
                <select
                  value={roleCode}
                  onChange={(e) => setRoleCode(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value="">Select Role</option>
                  {users
                    .find(
                      (u) => u.id?.toString() === fromUserId
                    )
                    ?.roles?.map((r) => (
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
              <p className="text-gray-700 mb-2">
                Role transferred successfully!
              </p>
              <p className="text-sm text-gray-500">
                Click confirm to continue.
              </p>
            </div>
          </Modal>

          {/* RESET PASSWORD MODAL */}
          <ResetPasswordModal
            isOpen={resetOpen}
            onClose={() => setResetOpen(false)}
            targetUser={resetUser}
          />

          {/* MOBILE MENU BUTTON */}
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
