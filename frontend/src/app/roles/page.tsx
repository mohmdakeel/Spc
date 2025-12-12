'use client';

import { useEffect, useMemo, useState } from 'react';
import Topbar from '../../../components/Topbar';
import Sidebar from '../../../components/Sidebar';
import Modal from '../../../components/Modal';
import api from '../../../lib/api';
import { useAuth } from '../../../hooks/useAuth';
import { Check, X, ArrowRightLeft, Shield, User, Users, Key } from 'lucide-react';
import { readCache, writeCache } from '../../../lib/cache';

// ===== backend shapes =====
type Role = { id: number; code: string; name: string; description: string };
type Perm = { id: number; code: string; description?: string };
type UserLite = { id: number; username: string; fullName?: string };
type FullUser = {
  id: number;
  username: string;
  fullName?: string;
  roles?: string[];
};

const GLOBAL5 = new Set(["CREATE","READ","UPDATE","DELETE","PRINT"]);

export default function RolesPage() {
  const { user, refresh } = useAuth();

  // ====== DATA FROM BACKEND ======
  const cachedRoles = readCache<Role[]>('cache:auth:roles') || [];
  const cachedPerms = readCache<Perm[]>('cache:auth:perms') || [];
  const cachedUsers = readCache<FullUser[]>('cache:auth:users') || [];
  const hasCached = cachedRoles.length && cachedPerms.length && cachedUsers.length;

  const [roles, setRoles] = useState<Role[]>(cachedRoles);
  const [allPerms, setAllPerms] = useState<Perm[]>(cachedPerms);
  const [allUsers, setAllUsers] = useState<FullUser[]>(cachedUsers);

  // ====== SELECTION STATE FOR PERMISSION MGMT ======
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [roleUsers, setRoleUsers] = useState<UserLite[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');

  // permissions for that selectedUserId
  const [effectivePerms, setEffectivePerms] = useState<string[]>([]);
  const [directPerms, setDirectPerms] = useState<string[]>([]);

  // grant/revoke modal state
  const [mode, setMode] = useState<'grant' | 'revoke'>('grant');
  const [manageOpen, setManageOpen] = useState(false);
  const [selectedPerms, setSelectedPerms] = useState<string[]>([]);

  // ====== TRANSFER ROLE STATE ======
  const [fromUserId, setFromUserId] = useState<string>('');
  const [toUserId, setToUserId] = useState<string>('');
  const [transferRoleCode, setTransferRoleCode] = useState<string>('');

  // ====== UI STATE ======
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isOpenSidebar, setIsOpenSidebar] = useState(false);
  const [loading, setLoading] = useState(!hasCached);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // -------------------------------------------
  // utils
  // -------------------------------------------

  function showSuccess(msg: string) {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(''), 3000);
  }

  function showError(msg: string) {
    setErrorMessage(msg);
  }

  // -------------------------------------------
  // initial load: roles, global perms, all users
  // -------------------------------------------
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
          api.get<any[]>('/users'),
        ]);

        // roles
        const rolesList = Array.isArray(rolesRes.data) ? rolesRes.data : [];
        setRoles(rolesList);
        writeCache('cache:auth:roles', rolesList);

        // keep only CREATE / READ / UPDATE / DELETE / PRINT
        const globals = (Array.isArray(permsRes.data) ? permsRes.data : [])
          .filter((x) => GLOBAL5.has(x.code));
        setAllPerms(globals);
        writeCache('cache:auth:perms', globals);

        // all users
        const mapped: FullUser[] = (Array.isArray(usersRes.data) ? usersRes.data : []).map(u => ({
          id: u.id,
          username: u.username,
          fullName: u.fullName,
          roles: Array.isArray(u.roles) ? u.roles : [],
        }));
        setAllUsers(mapped);
        writeCache('cache:auth:users', mapped);

      } catch (e: any) {
        showError(e?.response?.data?.message || 'Failed to load initial data');
      } finally {
        setLoading(false);
        setIsRefreshing(false);
      }
    })();
  }, [user, hasCached]);

  // -------------------------------------------
  // whenever selectedRole changes
  // -------------------------------------------
  useEffect(() => {
    setRoleUsers([]);
    setSelectedUserId('');
    setEffectivePerms([]);
    setDirectPerms([]);

    if (!selectedRole) return;
    (async () => {
      try {
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
      }
    })();
  }, [selectedRole]);

  // -------------------------------------------
  // whenever selectedUserId changes
  // -------------------------------------------
  useEffect(() => {
    setEffectivePerms([]);
    setDirectPerms([]);
    if (!selectedUserId) return;

    (async () => {
      try {
        const uid = Number(selectedUserId);
        const [effRes, dirRes] = await Promise.all([
          api.get<string[]>(`/users/${uid}/permissions/effective`),
          api.get<string[]>(`/users/${uid}/permissions/direct`),
        ]);

        const filter5 = (xs: string[] = []) => xs.filter(c => GLOBAL5.has(c));

        setEffectivePerms(
          filter5(Array.isArray(effRes.data) ? effRes.data : [])
        );
        setDirectPerms(
          filter5(Array.isArray(dirRes.data) ? dirRes.data : [])
        );
      } catch (e: any) {
        showError(
          e?.response?.data?.message || 'Failed to load user permissions'
        );
      }
    })();
  }, [selectedUserId]);

  // -------------------------------------------
  // permissionOptions for modal
  // -------------------------------------------
  const permissionOptions = useMemo(() => {
    const eff = new Set(effectivePerms);
    if (mode === 'grant') {
      return allPerms.filter((p) => !eff.has(p.code));
    } else {
      const direct = new Set(directPerms);
      return allPerms.filter((p) => direct.has(p.code));
    }
  }, [allPerms, effectivePerms, directPerms, mode]);

  // -------------------------------------------
  // open the Grant / Revoke modal
  // -------------------------------------------
  const openManageModal = (which: 'grant' | 'revoke') => {
    if (!selectedRole) {
      showError('Select a role first');
      return;
    }
    if (!selectedUserId) {
      showError('Select a user first');
      return;
    }
    setMode(which);
    setSelectedPerms([]);
    setManageOpen(true);
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

  // -------------------------------------------
  // submit Grant / Revoke to backend
  // -------------------------------------------
  const submitManage = async () => {
    if (!selectedUserId || selectedPerms.length === 0) {
      showError('Pick at least one permission');
      return;
    }
    const uid = Number(selectedUserId);

    try {
      if (mode === 'grant') {
        await Promise.all(
          selectedPerms.map((code) =>
            api.post(`/users/${uid}/grant/${encodeURIComponent(code)}`)
          )
        );
      } else {
        await Promise.all(
          selectedPerms.map((code) =>
            api.post(`/users/${uid}/revoke/${encodeURIComponent(code)}`)
          )
        );
      }

      const [effRes, dirRes] = await Promise.all([
        api.get<string[]>(`/users/${uid}/permissions/effective`),
        api.get<string[]>(`/users/${uid}/permissions/direct`),
      ]);
      const filter5 = (xs: string[] = []) => xs.filter(c => GLOBAL5.has(c));
      setEffectivePerms(
        filter5(Array.isArray(effRes.data) ? effRes.data : [])
      );
      setDirectPerms(
        filter5(Array.isArray(dirRes.data) ? dirRes.data : [])
      );

      if (user?.id === uid) {
        await refresh();
      }

      setManageOpen(false);
      setSelectedPerms([]);
      showSuccess(mode === 'grant'
        ? 'Permission(s) granted!'
        : 'Permission(s) revoked!'
      );
    } catch (e: any) {
      showError(e?.response?.data?.message || 'Operation failed');
    }
  };

  // -------------------------------------------
  // TRANSFER ROLE LOGIC
  // -------------------------------------------
  const fromUserRoles = useMemo(() => {
    if (!fromUserId) return [];
    const u = allUsers.find(u => String(u.id) === fromUserId);
    return u?.roles ?? [];
  }, [fromUserId, allUsers]);

  const handleTransferRole = async () => {
    if (!fromUserId || !toUserId || !transferRoleCode) {
      showError('Select source user, target user, and role to transfer');
      return;
    }
    try {
      await api.post(
        `/users/${fromUserId}/transfer-role/${toUserId}/${transferRoleCode}`
      );

      showSuccess('Role transferred successfully!');

      await reloadAllUsers();
      if (selectedRole) {
        await reloadRoleUsers(selectedRole);
      }

      if (user && (String(user.id) === fromUserId || String(user.id) === toUserId)) {
        await refresh();
      }

      setFromUserId('');
      setToUserId('');
      setTransferRoleCode('');
    } catch (e: any) {
      showError(e?.response?.data?.message || 'Failed to transfer role');
    }
  };

  const reloadAllUsers = async () => {
    try {
      const { data } = await api.get<any[]>('/users');
      const mapped: FullUser[] = (Array.isArray(data) ? data : []).map(u => ({
        id: u.id,
        username: u.username,
        fullName: u.fullName,
        roles: Array.isArray(u.roles) ? u.roles : [],
      }));
      setAllUsers(mapped);
    } catch {
      showError('Failed to reload user list after transfer');
    }
  };

  const reloadRoleUsers = async (roleCode: string) => {
    try {
      const { data } = await api.get<UserLite[]>(
        `/users/by-role/${encodeURIComponent(roleCode)}`
      );
      setRoleUsers(Array.isArray(data) ? data : []);
    } catch {
      /* ignore */
    }
  };

  const toggleSidebar = () => setIsOpenSidebar((v) => !v);

  // safety guard: only admin can use this page
  if (!user || !user.roles?.includes('ADMIN')) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center border border-orange-200">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">Admin privileges required to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-shell">
      <Sidebar user={user} isOpen={isOpenSidebar} onClose={toggleSidebar} />
      <div className="auth-shell__main overflow-hidden">
        <Topbar user={user} />
        <main className="auth-shell__content">
          {/* HEADER */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <Shield className="w-8 h-8 text-orange-600" />
              <h1 className="text-3xl font-bold text-gray-900">Roles & Permissions</h1>
            </div>
            <p className="text-gray-600">Manage user roles and permissions across the system</p>
            {isRefreshing && (
              <div className="mt-2 text-xs text-orange-700 flex items-center gap-2">
                <div className="w-3 h-3 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                Updating latest roles…
              </div>
            )}
          </div>

          {/* MESSAGES */}
          {successMessage && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center">
              <Check className="mr-2 text-green-600" /> 
              <span className="text-green-800">{successMessage}</span>
            </div>
          )}
          {errorMessage && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
              <X className="mr-2 text-red-600" /> 
              <span className="text-red-800">{errorMessage}</span>
            </div>
          )}

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            {/* LEFT COLUMN */}
            <div className="space-y-8">
              {/* ROLES TABLE */}
              <div className="bg-white rounded-2xl shadow-lg border border-orange-200 overflow-hidden">
                <div className="p-6 border-b border-orange-200 bg-orange-50">
                  <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <Users className="w-5 h-5 text-orange-600" />
                    System Roles
                  </h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-orange-50">
                      <tr>
                        <th className="p-3 text-left text-sm font-semibold text-gray-700">Code</th>
                        <th className="p-3 text-left text-sm font-semibold text-gray-700">Name</th>
                        <th className="p-3 text-left text-sm font-semibold text-gray-700">Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {loading && roles.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="p-6">
                            <div className="space-y-3">
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                                Loading roles...
                              </div>
                              <div className="h-8 bg-orange-100/70 rounded animate-pulse" />
                              <div className="h-8 bg-orange-100/70 rounded animate-pulse" />
                            </div>
                          </td>
                        </tr>
                      ) : roles.map((r) => (
                        <tr key={r.id} className="hover:bg-orange-50 transition-colors">
                          <td className="p-3">
                            <span className="font-mono text-sm bg-orange-100 text-orange-700 px-2 py-1 rounded">
                              {r.code}
                            </span>
                          </td>
                          <td className="p-3 text-sm font-medium text-gray-900">{r.name}</td>
                          <td className="p-3 text-sm text-gray-600">{r.description}</td>
                        </tr>
                      ))}
                      {!loading && !roles.length && (
                        <tr>
                          <td colSpan={3} className="p-6 text-center text-gray-500">
                            No roles found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* TRANSFER ROLE CARD */}
              <div className="bg-white rounded-2xl shadow-lg border border-orange-200 overflow-hidden">
                <div className="p-6 border-b border-orange-200 bg-orange-50">
                  <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <ArrowRightLeft className="w-5 h-5 text-purple-600" />
                    Transfer Role
                  </h2>
                </div>
                <div className="p-6 space-y-4">
                  <p className="text-sm text-gray-600">
                    Move a role from one user to another. The source user will lose the role, and the target user will gain it.
                  </p>

                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">From User</label>
                      <select
                        value={fromUserId}
                        onChange={(e) => {
                          setFromUserId(e.target.value);
                          setTransferRoleCode('');
                        }}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      >
                        <option value="">Select source user</option>
                        {allUsers.map((u) => (
                          <option key={u.id} value={String(u.id)}>
                            {u.username} {u.fullName && `(${u.fullName})`}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">To User</label>
                      <select
                        value={toUserId}
                        onChange={(e) => setToUserId(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        disabled={!fromUserId}
                      >
                        <option value="">Select target user</option>
                        {allUsers
                          .filter((u) => String(u.id) !== fromUserId)
                          .map((u) => (
                            <option key={u.id} value={String(u.id)}>
                              {u.username} {u.fullName && `(${u.fullName})`}
                            </option>
                          ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Role to Transfer</label>
                      <select
                        value={transferRoleCode}
                        onChange={(e) => setTransferRoleCode(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        disabled={!fromUserId}
                      >
                        <option value="">Select role</option>
                        {fromUserRoles.map((code) => (
                          <option key={code} value={code}>
                            {code}
                          </option>
                        ))}
                      </select>
                    </div>

                    <button
                      onClick={handleTransferRole}
                      className="w-full px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-purple-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 font-medium"
                      disabled={!fromUserId || !toUserId || !transferRoleCode}
                    >
                      <ArrowRightLeft className="w-4 h-4" />
                      Transfer Role
                    </button>
                  </div>

                  <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
                    Note: Protected accounts like <code className="bg-gray-200 px-1 rounded">admin1</code> are blocked from role changes.
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN - PERMISSION MANAGEMENT */}
            <div className="space-y-8">
              {/* PERMISSION MGMT CARD */}
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">Select Role</label>
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">Select User</label>
                    <select
                      value={selectedUserId}
                      onChange={(e) => setSelectedUserId(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      disabled={!selectedRole}
                    >
                      <option value="">Choose a user...</option>
                      {roleUsers.map((u) => (
                        <option key={u.id} value={String(u.id)}>
                          {u.username} {u.fullName && `(${u.fullName})`}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => openManageModal('grant')}
                      className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-green-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 font-medium"
                      disabled={!selectedUserId}
                    >
                      <Check className="w-4 h-4" />
                      Grant Permissions
                    </button>

                    <button
                      onClick={() => openManageModal('revoke')}
                      className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-red-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 font-medium"
                      disabled={!selectedUserId}
                    >
                      <X className="w-4 h-4" />
                      Revoke Permissions
                    </button>
                  </div>

                  {/* Permission Display */}
                  {selectedUserId && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <h3 className="font-semibold text-green-800 mb-2 flex items-center gap-2">
                          <Check className="w-4 h-4" />
                          Effective Permissions
                        </h3>
                        <div className="flex flex-wrap gap-1">
                          {effectivePerms.length > 0 ? (
                            effectivePerms.map((perm) => (
                              <span key={perm} className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">
                                {perm}
                              </span>
                            ))
                          ) : (
                            <span className="text-green-700 text-sm">No permissions</span>
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
                              <span key={perm} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                                {perm}
                              </span>
                            ))
                          ) : (
                            <span className="text-blue-700 text-sm">No direct permissions</span>
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
                <div className="p-6">
                  <div className="flex flex-wrap gap-2">
                    {allPerms.map((perm) => (
                      <div key={perm.id} className="bg-orange-100 border border-orange-200 rounded-lg px-3 py-2">
                        <div className="font-mono text-sm font-medium text-orange-800">{perm.code}</div>
                        <div className="text-xs text-orange-600">{perm.description}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* GRANT / REVOKE MODAL */}
          <Modal
            isOpen={manageOpen}
            onClose={() => setManageOpen(false)}
            title={`${mode === 'grant' ? 'Grant' : 'Revoke'} Permissions`}
            onSubmit={submitManage}
            submitText={mode === 'grant' ? 'Grant Selected' : 'Revoke Selected'}
            size="md"
          >
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                {mode === 'grant' 
                  ? 'Select permissions to grant to this user:' 
                  : 'Select permissions to revoke from this user:'}
              </p>

                <div className="flex items-center">
                  <input
                    id="selectAll"
                    name="selectAllPermissions"
                    type="checkbox"
                    className="mr-2"
                    checked={selectedPerms.length === permissionOptions.length && permissionOptions.length > 0}
                    onChange={toggleAll}
                  />
                <label htmlFor="selectAll" className="text-sm font-medium text-gray-700">
                  Select all available permissions
                </label>
              </div>

              <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg p-3 space-y-2">
                {permissionOptions.length === 0 ? (
                  <div className="text-center text-gray-500 py-4">
                    No permissions available to {mode}
                  </div>
                  ) : (
                    permissionOptions.map((p) => (
                      <label key={p.code} className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer">
                        <input
                          name={`permission-${p.code}`}
                          type="checkbox"
                          className="mr-3"
                          checked={selectedPerms.includes(p.code)}
                          onChange={() => togglePerm(p.code)}
                        />
                      <div>
                        <div className="font-mono text-sm font-medium text-gray-900">{p.code}</div>
                        <div className="text-xs text-gray-600">{p.description || p.code}</div>
                      </div>
                    </label>
                  ))
                )}
              </div>
            </div>
          </Modal>

          {/* Mobile Menu Button */}
          <button 
            onClick={toggleSidebar}
            className="md:hidden fixed bottom-6 right-6 w-14 h-14 bg-orange-600 text-white rounded-full shadow-lg hover:bg-orange-700 transition-all flex items-center justify-center z-40"
          >
            <span className="text-lg font-bold">☰</span>
          </button>
        </main>
      </div>
    </div>
  );
}
