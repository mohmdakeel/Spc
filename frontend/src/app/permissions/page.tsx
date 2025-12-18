'use client';

import { useEffect, useMemo, useState } from 'react';
import Topbar from '../../../components/Topbar';
import Sidebar from '../../../components/Sidebar';
import Modal from '../../../components/Modal';
import api from '../../../lib/api';
import { useAuth } from '../../../hooks/useAuth';
import { readCache, writeCache } from '../../../lib/cache';
import {
  CheckCircle,
  XCircle,
  Check,
  X,
  Key,
  Shield,
  Users,
  User,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

// ===== backend shapes =====
type Role = { id: number; code: string; name: string; description: string };
type Perm = { id: number; code: string; description?: string };
type UserLite = { id: number; username: string; fullName?: string };
type UserRow = {
  id: number;
  username: string;
  fullName?: string;
  roles?: string[];
  permissions?: string[];
};

// we ONLY care about these 5 perms everywhere in UI
const GLOBAL5 = new Set(['CREATE', 'READ', 'UPDATE', 'DELETE', 'PRINT']);

// only show these 5 perms in UI
const onlyGlobalFive = (codes: string[] = []) =>
  ['CREATE', 'READ', 'UPDATE', 'DELETE', 'PRINT'].filter((c) =>
    codes.includes(c)
  );

export default function PermissionsPage() {
  const { user, refresh } = useAuth();

  // ================= GENERAL UI STATE =================
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isOpenSidebar, setIsOpenSidebar] = useState(false);
  const cachedRoles = readCache<Role[]>('cache:auth:roles') || [];
  const cachedPerms = readCache<Perm[]>('cache:auth:perms') || [];
  const cachedUsers = readCache<UserRow[]>('cache:auth:users') || [];

  const hasCached = cachedRoles.length && cachedPerms.length && cachedUsers.length;
  const [loading, setLoading] = useState(!hasCached);
  const [isRefreshing, setIsRefreshing] = useState(false);

  function showSuccess(msg: string) {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(''), 3000);
  }
  function showError(msg: string) {
    setErrorMessage(msg);
  }

  // ================= DATA FROM BACKEND =================
  const [roles, setRoles] = useState<Role[]>(cachedRoles);
  const [allPerms, setAllPerms] = useState<Perm[]>(cachedPerms);
  const [users, setUsers] = useState<UserRow[]>(cachedUsers);

  // ----- dropdown section state -----
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [roleUsers, setRoleUsers] = useState<UserLite[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');

  // permissions for the selected userId (right column)
  const [effectivePerms, setEffectivePerms] = useState<string[]>([]);
  const [directPerms, setDirectPerms] = useState<string[]>([]);

  // ----- grant/revoke modal -----
  const [manageOpen, setManageOpen] = useState(false);
  const [mode, setMode] = useState<'grant' | 'revoke'>('grant');
  const [selectedPerms, setSelectedPerms] = useState<string[]>([]);
  const [selectedUserLabel, setSelectedUserLabel] = useState<string>('');

  // ----- view modal -----
  const [viewOpen, setViewOpen] = useState(false);
  const [viewUser, setViewUser] = useState<UserRow | null>(null);

  // ================= PAGINATION =================
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(10); // 10 or 15

  // whenever pageSize changes, go back to page 1
  useEffect(() => {
    setPage(1);
  }, [pageSize]);

  const totalPages = Math.max(
    1,
    Math.ceil(users.length / pageSize)
  );
  const safePage = Math.min(page, totalPages);
  const startIdx = (safePage - 1) * pageSize;
  const currentPageUsers = users.slice(startIdx, startIdx + pageSize);

  // ================= HELPERS TO/FROM BACKEND =================
  const fetchPermsForUser = async (uid: number) => {
    const [effRes, dirRes] = await Promise.all([
      api.get<string[]>(`/users/${uid}/permissions/effective`),
      api.get<string[]>(`/users/${uid}/permissions/direct`),
    ]);

    const filter5 = (xs: string[] = []) => xs.filter((c) => GLOBAL5.has(c));

    setEffectivePerms(
      filter5(Array.isArray(effRes.data) ? effRes.data : [])
    );
    setDirectPerms(
      filter5(Array.isArray(dirRes.data) ? dirRes.data : [])
    );
  };

  const refreshUsersList = async () => {
    const { data } = await api.get<UserRow[]>('/users');
    const safe = (data || []).map((u) => ({
      ...u,
      roles: Array.isArray(u.roles) ? u.roles : [],
      permissions: Array.isArray(u.permissions)
        ? onlyGlobalFive(u.permissions)
        : [],
    }));
    setUsers(safe);
    writeCache('cache:auth:users', safe);
  };

  const refreshRoleUsers = async (roleCode: string) => {
    try {
      const { data } = await api.get<UserLite[]>(
        `/users/by-role/${encodeURIComponent(roleCode)}`
      );
      setRoleUsers(Array.isArray(data) ? data : []);
    } catch {
      // ignore if forbidden etc.
    }
  };

  // ================= INITIAL LOAD =================
  useEffect(() => {
    if (!user?.roles?.includes('ADMIN')) {
      setLoading(false);
      return;
    }

    const silent = !!hasCached;
    if (silent) {
      setIsRefreshing(true);
    } else {
      setLoading(true);
    }

    (async () => {
      try {
        const [rolesRes, permsRes, usersRes] = await Promise.all([
          api.get<Role[]>('/roles'),
          api.get<Perm[]>('/roles/permissions'),
          api.get<UserRow[]>('/users'),
        ]);

        const rolesList = Array.isArray(rolesRes.data) ? rolesRes.data : [];
        setRoles(rolesList);
        writeCache('cache:auth:roles', rolesList);

        const globals = (Array.isArray(permsRes.data) ? permsRes.data : []).filter(
          (p) => GLOBAL5.has(p.code)
        );
        setAllPerms(globals);
        writeCache('cache:auth:perms', globals);

        const safe = (usersRes.data || []).map((u: any) => ({
          ...u,
          roles: Array.isArray(u.roles) ? u.roles : [],
          permissions: Array.isArray(u.permissions)
            ? onlyGlobalFive(u.permissions)
            : [],
        }));
        setUsers(safe);
        writeCache('cache:auth:users', safe);
      } catch (e: any) {
        showError(
          e?.response?.data?.message || 'Failed to load initial data'
        );
      } finally {
        setLoading(false);
        setIsRefreshing(false);
      }
    })();
  }, [user, hasCached]);

  // ================ DROPDOWN FLOW ================
  useEffect(() => {
    setRoleUsers([]);
    setSelectedUserId('');
    setEffectivePerms([]);
    setDirectPerms([]);

    if (!selectedRole) return;

    (async () => {
      try {
        setLoading(true);
        const { data } = await api.get<UserLite[]>(
          `/users/by-role/${encodeURIComponent(selectedRole)}`
        );
        setRoleUsers(Array.isArray(data) ? data : []);
      } catch (e: any) {
        setRoleUsers([]);
        showError(
          e?.response?.data?.message ||
            'Failed to load users for selected role'
        );
      } finally {
        setLoading(false);
      }
    })();
  }, [selectedRole]);

  useEffect(() => {
    setEffectivePerms([]);
    setDirectPerms([]);
    if (!selectedUserId) return;

    (async () => {
      try {
        setLoading(true);
        const uid = Number(selectedUserId);
        await fetchPermsForUser(uid);
      } catch (e: any) {
        showError(
          e?.response?.data?.message || 'Failed to load user permissions'
        );
      } finally {
        setLoading(false);
      }
    })();
  }, [selectedUserId]);

  // ================ TABLE ACTIONS ================
  const handleRowClick = (u: UserRow) => {
    setViewUser(u);
    setViewOpen(true);
  };

  const handleOpenPermissionsFromRow = async (u: UserRow) => {
    const uid = Number(u.id);
    try {
      setLoading(true);

      setSelectedUserId(String(uid));
      setSelectedUserLabel(
        u.fullName ? `${u.username} (${u.fullName})` : u.username
      );

      await fetchPermsForUser(uid);

      setMode('grant');
      setSelectedPerms([]);

      setManageOpen(true);
      setErrorMessage('');
    } catch (e: any) {
      showError(
        e?.response?.data?.message ||
          'Failed to open user permissions'
      );
    } finally {
      setLoading(false);
    }
  };

  // ================ PERMISSION MODAL LOGIC ================
  // list of permissions shown in modal depending on grant/revoke mode
  const permissionOptions = useMemo(() => {
    const effSet = new Set(effectivePerms);

    if (mode === 'grant') {
      // can only GRANT permissions the user doesn't already effectively have
      return allPerms.filter((p) => !effSet.has(p.code));
    } else {
      // can only REVOKE permissions the user has directly
      const directSet = new Set(directPerms);
      return allPerms.filter((p) => directSet.has(p.code));
    }
  }, [allPerms, effectivePerms, directPerms, mode]);

  const openManageModalFromDropdown = (which: 'grant' | 'revoke') => {
    if (!selectedUserId) {
      showError('Select a user first');
      return;
    }
    const chosen = roleUsers.find(
      (ru) => String(ru.id) === selectedUserId
    );
    setSelectedUserLabel(
      chosen
        ? chosen.fullName
          ? `${chosen.username} (${chosen.fullName})`
          : chosen.username
        : ''
    );
    setMode(which);
    setSelectedPerms([]);
    setManageOpen(true);
    setErrorMessage('');
  };

  const togglePerm = (code: string) => {
    setSelectedPerms((prev) =>
      prev.includes(code)
        ? prev.filter((c) => c !== code)
        : [...prev, code]
    );
  };

  const toggleAll = () => {
    setSelectedPerms((prev) =>
      prev.length === permissionOptions.length
        ? []
        : permissionOptions.map((p) => p.code)
    );
  };

  const submitManage = async () => {
    if (!selectedUserId || selectedPerms.length === 0) {
      showError('Pick at least one permission');
      return;
    }

    const uid = Number(selectedUserId);

    try {
      setLoading(true);

      if (mode === 'grant') {
        await Promise.all(
          selectedPerms.map((code) =>
            api.post(
              `/users/${uid}/grant/${encodeURIComponent(code)}`
            )
          )
        );
      } else {
        await Promise.all(
          selectedPerms.map((code) =>
            api.post(
              `/users/${uid}/revoke/${encodeURIComponent(code)}`
            )
          )
        );
      }

      await fetchPermsForUser(uid);
      await refreshUsersList();

      if (user?.id === uid) {
        await refresh();
      }

      if (selectedRole) {
        await refreshRoleUsers(selectedRole);
      }

      setManageOpen(false);
      setSelectedPerms([]);
      showSuccess(
        mode === 'grant'
          ? 'Permission(s) granted!'
          : 'Permission(s) revoked!'
      );
    } catch (e: any) {
      showError(e?.response?.data?.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  // ================ PAGE GUARD ================
  if (!user || !user.roles?.includes('ADMIN')) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center border border-orange-200">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Access Denied
          </h2>
          <p className="text-gray-600">
            Admin privileges required to access this page.
          </p>
        </div>
      </div>
    );
  }

  const showSkeleton = loading && users.length === 0;

  // ================ JSX ================
  return (
    <div className="auth-shell">
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
              <Shield className="w-8 h-8 text-orange-600" />
              <h1 className="text-3xl font-bold text-gray-900">
                Permissions Management
              </h1>
            </div>
            <p className="text-gray-600">
              Manage user permissions and access controls
            </p>
            {isRefreshing && (
              <div className="mt-2 text-xs text-orange-700 flex items-center gap-2">
                <div className="w-3 h-3 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                Updating latest data…
              </div>
            )}
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

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            {/* LEFT COLUMN - USERS TABLE */}
            <div className="xl:col-span-2">
              <div className="bg-white rounded-2xl shadow-lg border border-orange-200 overflow-hidden">
                {/* table header */}
                <div className="p-6 border-b border-orange-200 bg-orange-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <Users className="w-5 h-5 text-orange-600" />
                    System Users
                  </h2>

                  <div className="flex items-center gap-3">
                    {/* page size select */}
                    <select
                      value={pageSize}
                      onChange={(e) => setPageSize(Number(e.target.value))}
                      className="py-2 px-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    >
                      <option value={10}>10 / page</option>
                      <option value={15}>15 / page</option>
                    </select>
                  </div>
                </div>

                {/* table */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-orange-50">
                      <tr>
                        <th className="p-3 text-left text-sm font-semibold text-gray-700">
                          User
                        </th>
                        <th className="p-3 text-left text-sm font-semibold text-gray-700">
                          Roles
                        </th>
                        <th className="p-3 text-left text-sm font-semibold text-gray-700">
                          Permissions
                        </th>
                        <th className="p-3 text-left text-sm font-semibold text-gray-700">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {showSkeleton ? (
                        <tr>
                          <td colSpan={4} className="p-6">
                            <div className="space-y-3">
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                                Loading users & roles...
                              </div>
                              <div className="h-10 bg-orange-100/70 rounded animate-pulse" />
                              <div className="h-10 bg-orange-100/70 rounded animate-pulse" />
                              <div className="h-10 bg-orange-100/70 rounded animate-pulse" />
                            </div>
                          </td>
                        </tr>
                      ) : currentPageUsers.length > 0 ? (
                        currentPageUsers.map((u) => (
                          <tr
                            key={u.id}
                            className="border-b hover:bg-orange-50 transition-colors cursor-pointer"
                            onClick={() => handleRowClick(u)}
                          >
                            {/* user / fullName */}
                            <td className="p-3">
                              <div className="font-medium text-gray-900">
                                {u.username}
                              </div>
                              {u.fullName && (
                                <div className="text-sm text-gray-600">
                                  {u.fullName}
                                </div>
                              )}
                            </td>

                            {/* roles */}
                            <td className="p-3">
                              <div className="flex flex-wrap gap-1">
                                {(u.roles || []).map((role) => (
                                  <span
                                    key={role}
                                    className="bg-orange-100 text-orange-700 px-2 py-1 rounded text-xs font-medium"
                                  >
                                    {role}
                                  </span>
                                ))}
                                {(u.roles || []).length === 0 && (
                                  <span className="text-gray-500 text-sm">
                                    N/A
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* perms */}
                            <td className="p-3">
                              <div className="flex flex-wrap gap-1">
                                {onlyGlobalFive(u.permissions || []).map(
                                  (perm) => (
                                    <span
                                      key={perm}
                                      className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-medium"
                                    >
                                      {perm}
                                    </span>
                                  )
                                )}
                                {onlyGlobalFive(u.permissions || []).length ===
                                  0 && (
                                  <span className="text-gray-500 text-sm">
                                    N/A
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* actions */}
                            <td
                              className="p-3"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="flex flex-wrap gap-2">
                                <button
                                  onClick={() =>
                                    handleOpenPermissionsFromRow(u)
                                  }
                                  className="flex items-center px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm"
                                >
                                  <Key className="w-4 h-4 mr-1" />
                                  Permissions
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan={4}
                            className="p-6 text-center text-gray-500"
                          >
                            {loading
                              ? 'Loading users...'
                              : 'No users found'}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* pagination footer */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border-t border-gray-200 text-sm bg-white">
                  <div className="text-gray-600 mb-3 sm:mb-0">
                    Page {safePage} / {totalPages} • Showing{' '}
                    <span className="font-medium">
                      {currentPageUsers.length}
                    </span>{' '}
                    of{' '}
                    <span className="font-medium">
                      {users.length.toString().padStart(1, '0')}
                    </span>{' '}
                    users
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
                      onClick={() =>
                        setPage((p) => Math.min(totalPages, p + 1))
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
              </div>
            </div>

            {/* RIGHT COLUMN - MANAGEMENT */}
            <div className="space-y-8">
              {/* PERMISSION MANAGEMENT CARD */}
              <div className="bg-white rounded-2xl shadow-lg border border-orange-200 overflow-hidden">
                <div className="p-6 border-b border-orange-200 bg-orange-50">
                  <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <Key className="w-5 h-5 text-orange-600" />
                    Permission Management
                  </h2>
                </div>
                <div className="p-6 space-y-6">
                  {/* Role Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Role
                    </label>
                    <select
                      value={selectedRole}
                      onChange={(e) => setSelectedRole(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    >
                      <option value="">Choose a role...</option>
                      {roles.map((r) => (
                        <option key={r.id} value={r.code}>
                          {r.code} - {r.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* User Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select User
                    </label>
                    <select
                      value={selectedUserId}
                      onChange={(e) => {
                        setSelectedUserId(e.target.value);
                        const u = roleUsers.find(
                          (x) => String(x.id) === e.target.value
                        );
                        setSelectedUserLabel(
                          u
                            ? u.fullName
                              ? `${u.username} (${u.fullName})`
                              : u.username
                            : ''
                        );
                      }}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      disabled={!selectedRole}
                    >
                      <option value="">Choose a user...</option>
                      {roleUsers.map((ru) => (
                        <option key={ru.id} value={String(ru.id)}>
                          {ru.username}
                          {ru.fullName ? ` (${ru.fullName})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col gap-3">
                    <button
                      onClick={() =>
                        openManageModalFromDropdown('grant')
                      }
                      className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-green-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 font-medium"
                      disabled={!selectedUserId}
                    >
                      <Check className="w-4 h-4" />
                      Grant Permissions
                    </button>

                    <button
                      onClick={() =>
                        openManageModalFromDropdown('revoke')
                      }
                      className="w-full px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-red-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 font-medium"
                      disabled={!selectedUserId}
                    >
                      <X className="w-4 h-4" />
                      Revoke Permissions
                    </button>
                  </div>

                  {/* Permission Display */}
                  {selectedUserId && (
                    <div className="grid grid-cols-1 gap-4 text-sm">
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <h3 className="font-semibold text-green-800 mb-2 flex items-center gap-2">
                          <Check className="w-4 h-4" />
                          Effective Permissions
                        </h3>
                        <div className="flex flex-wrap gap-1">
                          {effectivePerms.length > 0 ? (
                            effectivePerms.map((perm) => (
                              <span
                                key={perm}
                                className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium"
                              >
                                {perm}
                              </span>
                            ))
                          ) : (
                            <span className="text-green-700 text-sm">
                              No permissions
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h3 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                          <User className="w-4 h-4" />
                          Direct Permissions
                        </h3>
                        <div className="flex flex-wrap gap-1">
                          {directPerms.length > 0 ? (
                            directPerms.map((perm) => (
                              <span
                                key={perm}
                                className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium"
                              >
                                {perm}
                              </span>
                            ))
                          ) : (
                            <span className="text-blue-700 text-sm">
                              No direct permissions
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* AVAILABLE PERMISSIONS */}
              <div className="bg-white rounded-2xl shadow-lg border border-orange-200 overflow-hidden">
                <div className="p-6 border-b border-orange-200 bg-orange-50">
                  <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-orange-600" />
                    Available Permissions
                  </h2>
                </div>
                <div className="p-6 text-sm">
                  <div className="grid grid-cols-1 gap-2">
                    {allPerms.map((perm) => (
                      <div
                        key={perm.id}
                        className="bg-blue-50 border border-blue-200 rounded-lg p-3"
                      >
                        <div className="font-mono text-sm font-medium text-blue-800">
                          {perm.code}
                        </div>
                        <div className="text-xs text-blue-600">
                          {perm.description}
                        </div>
                      </div>
                    ))}
                    {allPerms.length === 0 && (
                      <div className="text-center text-gray-500 text-xs py-6">
                        No permissions loaded
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* VIEW MODAL */}
          <Modal
            isOpen={viewOpen}
            onClose={() => setViewOpen(false)}
            title="User Details"
            size="md"
            showFooter={false}
          >
            {viewUser && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Username
                    </label>
                    <p className="text-gray-900">
                      {viewUser.username}
                    </p>
                  </div>
                  {viewUser.fullName && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Full Name
                      </label>
                      <p className="text-gray-900">
                        {viewUser.fullName}
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Roles
                  </label>
                  <div className="flex flex-wrap gap-1">
                    {(viewUser.roles || []).length > 0 ? (
                      (viewUser.roles || []).map((role) => (
                        <span
                          key={role}
                          className="bg-orange-100 text-orange-700 px-2 py-1 rounded text-xs font-medium"
                        >
                          {role}
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-500 text-sm">
                        No roles
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Permissions
                  </label>
                  <div className="flex flex-wrap gap-1">
                    {onlyGlobalFive(viewUser.permissions || []).length >
                    0 ? (
                      onlyGlobalFive(viewUser.permissions || []).map(
                        (perm) => (
                          <span
                            key={perm}
                            className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-medium"
                          >
                            {perm}
                          </span>
                        )
                      )
                    ) : (
                      <span className="text-gray-500 text-sm">
                        No permissions
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </Modal>

          {/* GRANT / REVOKE MODAL */}
          <Modal
            isOpen={manageOpen}
            onClose={() => setManageOpen(false)}
            title={`${
              mode === 'grant' ? 'Grant' : 'Revoke'
            } Permissions - ${selectedUserLabel}`}
            onSubmit={submitManage}
            submitText={
              mode === 'grant'
                ? 'Grant Selected'
                : 'Revoke Selected'
            }
            size="md"
            loading={loading}
          >
            <div className="space-y-4">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setMode('grant');
                    setSelectedPerms([]);
                  }}
                  className={`flex-1 px-4 py-2 rounded-lg border transition-colors ${
                    mode === 'grant'
                      ? 'bg-green-600 text-white border-green-700'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  Grant Permissions
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode('revoke');
                    setSelectedPerms([]);
                  }}
                  className={`flex-1 px-4 py-2 rounded-lg border transition-colors ${
                    mode === 'revoke'
                      ? 'bg-red-600 text-white border-red-700'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  Revoke Permissions
                </button>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-700">
                    {mode === 'grant'
                      ? 'Available Permissions'
                      : 'Current Direct Permissions'}
                  </span>
                  <span className="text-xs text-gray-500">
                    {selectedPerms.length} selected
                  </span>
                </div>

                <div className="max-h-64 overflow-y-auto space-y-2">
                  {permissionOptions.length === 0 ? (
                    <div className="text-center text-gray-500 py-4">
                      No permissions available to {mode}
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center p-2">
                        <input
                          id="selectAll"
                          name="selectAllPermissions"
                          type="checkbox"
                          className="mr-3"
                          checked={
                            selectedPerms.length ===
                              permissionOptions.length &&
                            permissionOptions.length > 0
                          }
                          onChange={toggleAll}
                        />
                        <label
                          htmlFor="selectAll"
                          className="text-sm font-medium text-gray-700"
                        >
                          Select all permissions
                        </label>
                      </div>

                        {permissionOptions.map((p) => (
                          <label
                            key={p.code}
                            className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer"
                          >
                            <input
                              name={`permission-${p.code}`}
                              type="checkbox"
                              className="mr-3"
                              checked={selectedPerms.includes(p.code)}
                              onChange={() => togglePerm(p.code)}
                            />
                          <div>
                            <div className="font-mono text-sm font-medium text-gray-900">
                              {p.code}
                            </div>
                            <div className="text-xs text-gray-600">
                              {p.description}
                            </div>
                          </div>
                        </label>
                      ))}
                    </>
                  )}
                </div>
              </div>
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
