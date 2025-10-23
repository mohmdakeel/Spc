'use client';

import { useEffect, useMemo, useState } from 'react';
import Topbar from '../../../components/Topbar';
import Sidebar from '../../../components/Sidebar';
import Modal from '../../../components/Modal';
import api from '../../../lib/api';
import { useAuth } from '../../../hooks/useAuth';
import { Eye, Printer, CheckCircle, XCircle, Key } from 'lucide-react';

type Permission = { id: number; code: string; description: string };
type Role = { id: number; code: string; name: string; description: string };
type UserRow = {
  id: number;
  username: string;
  fullName?: string;
  roles?: string[];
  permissions?: string[];
};
type UserLite = { id: number; username: string; fullName?: string };

// ======= only show/manage the global 5 =======
const GLOBAL5 = new Set(["CREATE","READ","UPDATE","DELETE","PRINT"]);
const onlyGlobalFive = (codes: string[] = []) =>
  ["CREATE","READ","UPDATE","DELETE","PRINT"].filter(c => codes.includes(c));

export default function Permissions() {
  const { user, refresh } = useAuth();

  const has = (p: string) => !!user?.permissions?.includes(p);
  const canRead            = has('READ') || has('PERM_READ'); // allow either if you kept PERM_READ
  const canManageUserPerms = has('PERM_USER_MANAGE');
  const canManageRolePerms = has('PERM_ROLE_MANAGE');
  const canPrint           = has('PRINT');

  const [users, setUsers] = useState<UserRow[]>([]);
  const [permCatalog, setPermCatalog] = useState<Record<string, string>>({});
  const [roles, setRoles] = useState<Role[]>([]);
  const [allPerms, setAllPerms] = useState<Permission[]>([]);

  const [selectedRole, setSelectedRole] = useState('');
  const [rolePerms, setRolePerms] = useState<string[]>([]);
  const [roleUsers, setRoleUsers] = useState<UserLite[]>([]);

  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedUserLabel, setSelectedUserLabel] = useState('');
  const [effectivePerms, setEffectivePerms] = useState<string[]>([]);
  const [manageOpen, setManageOpen] = useState(false);
  const [mode, setMode] = useState<'grant' | 'revoke'>('grant');
  const [selectedPerms, setSelectedPerms] = useState<string[]>([]);

  const [manageRoleOpen, setManageRoleOpen] = useState(false);
  const [roleMode, setRoleMode] = useState<'grant' | 'revoke'>('grant');
  const [roleSelectedPerms, setRoleSelectedPerms] = useState<string[]>([]);

  const [viewOpen, setViewOpen] = useState(false);
  const [selected, setSelected] = useState<UserRow | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isOpenSidebar, setIsOpenSidebar] = useState(false);

  // bootstrap
  useEffect(() => {
    if (!user || !canRead) return;
    (async () => {
      try {
        const [{ data: catalog }, { data: usersData }, { data: rolesData }] = await Promise.all([
          api.get<Permission[]>('/roles/permissions'),
          api.get<UserRow[]>('/users'),
          api.get<Role[]>('/roles'),
        ]);

        // keep only the global 5 in the catalog and options
        const globals = (catalog || []).filter(p => GLOBAL5.has(p.code));
        const map: Record<string, string> = {};
        globals.forEach(p => map[p.code] = p.description || p.code);
        setPermCatalog(map);
        setAllPerms(globals);

        const safe = (usersData || []).map(u => ({
          ...u,
          roles: Array.isArray(u.roles) ? u.roles : [],
          permissions: Array.isArray(u.permissions) ? onlyGlobalFive(u.permissions) : [],
        }));
        setUsers(safe);

        setRoles(Array.isArray(rolesData) ? rolesData : []);
      } catch (e: any) {
        setErrorMessage(e?.response?.status === 403 ? 'Forbidden (403)' : 'Failed to load initial data');
      }
    })();
  }, [user, canRead]);

  // role change
  useEffect(() => {
    setRoleUsers([]);
    setRolePerms([]);
    if (!selectedRole || !canRead) return;

    (async () => {
      try {
        const [usersRes, permsRes] = await Promise.all([
          api.get<UserLite[]>(`/users/by-role/${encodeURIComponent(selectedRole)}`),
          api.get<string[]>(`/roles/${encodeURIComponent(selectedRole)}/permissions`),
        ]);
        setRoleUsers(Array.isArray(usersRes.data) ? usersRes.data : []);
        const raw = Array.isArray(permsRes.data) ? permsRes.data : [];
        setRolePerms(raw.filter(c => GLOBAL5.has(c)));
      } catch {
        setRoleUsers([]);
        setRolePerms([]);
        setErrorMessage('Failed to load data for selected role');
      }
    })();
  }, [selectedRole, canRead]);

  const prettyPerms = (codes?: string[]) =>
    (codes || []).join(', ');

  const tableRows = useMemo(
    () =>
      users.map((u) => (
        <tr key={u.id} className="border-b">
          <td className="p-2">
            {u.username}{u.fullName ? ` (${u.fullName})` : ''}
          </td>
          <td className="p-2">{(u.roles || []).join(', ') || '—'}</td>
          <td className="p-2">{prettyPerms(onlyGlobalFive(u.permissions)) || '—'}</td>
          <td className="p-2">
            <div className="flex gap-2">
              <button
                onClick={() => { setSelected(u); setViewOpen(true); }}
                className="flex items-center px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
              >
                <Eye className="w-3 h-3 mr-1" /> View
              </button>

              {canManageUserPerms && (
                <button
                  onClick={() => openUserPermissionsFromRow(u)}
                  className="flex items-center px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  <Key className="w-3 h-3 mr-1" /> Permissions
                </button>
              )}

              {canPrint && (
                <button
                  onClick={() => window.print()}
                className="flex items-center px-2 py-1 bg-gray-500 text-white rounded hover:bg-gray-600">
                  <Printer className="w-3 h-3 mr-1" /> Print
                </button>
              )}
            </div>
          </td>
        </tr>
      )),
    [users, canManageUserPerms, canPrint]
  );

  const openUserPermissionsFromRow = async (u: UserRow) => {
    if (!canManageUserPerms) {
      setErrorMessage('You do not have permission (PERM_USER_MANAGE).');
    return;
    }
    try {
      const uid = Number(u.id);
      setSelectedUserId(String(uid));
      setSelectedUserLabel(u.fullName ? `${u.username} (${u.fullName})` : u.username);
      setMode('grant');
      setSelectedPerms([]);

      const { data } = await api.get<string[]>(`/users/${uid}/permissions/effective`);
      setEffectivePerms(onlyGlobalFive(Array.isArray(data) ? data : []));
      setManageOpen(true);
      setErrorMessage('');
    } catch (e: any) {
      setErrorMessage(e?.response?.data?.message || 'Failed to open user permissions');
    }
  };

  const [selectedDropdownUserId, setSelectedDropdownUserId] = useState('');
  useEffect(() => {
    if (!selectedDropdownUserId) return;
    const u = users.find(x => String(x.id) === selectedDropdownUserId);
    if (u) openUserPermissionsFromRow(u);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDropdownUserId]);

  const permissionOptionsUser = useMemo(() => {
    const eff = new Set(effectivePerms);
    return mode === 'grant'
      ? allPerms.filter((p) => !eff.has(p.code))
      : allPerms.filter((p) => eff.has(p.code));
  }, [allPerms, effectivePerms, mode]);

  const permissionOptionsRole = useMemo(() => {
    const roleSet = new Set(rolePerms);
    return roleMode === 'grant'
      ? allPerms.filter((p) => !roleSet.has(p.code))
      : allPerms.filter((p) => roleSet.has(p.code));
  }, [allPerms, rolePerms, roleMode]);

  const submitManageUser = async () => {
    if (!canManageUserPerms) {
      setErrorMessage('You do not have permission (PERM_USER_MANAGE).');
      return;
    }
    if (!selectedUserId || selectedPerms.length === 0) {
      setErrorMessage('Select at least one permission');
      return;
    }
    const uid = Number(selectedUserId);
    try {
      if (mode === 'grant') {
        await Promise.all(selectedPerms.map(code => api.post(`/users/${uid}/grant/${encodeURIComponent(code)}`)));
      } else {
        await Promise.all(selectedPerms.map(code => api.post(`/users/${uid}/revoke/${encodeURIComponent(code)}`)));
      }

      const { data } = await api.get<string[]>(`/users/${uid}/permissions/effective`);
      setEffectivePerms(onlyGlobalFive(Array.isArray(data) ? data : []));

      if (user?.id === uid) await refresh();

      setManageOpen(false);
      setSelectedPerms([]);
      setSuccessMessage(mode === 'grant' ? 'Permission(s) granted!' : 'Permission(s) revoked!');
      setTimeout(() => setSuccessMessage(''), 3000);
      setErrorMessage('');
    } catch (e: any) {
      setErrorMessage(e?.response?.data?.message || 'Operation failed');
    }
  };

  const submitManageRole = async () => {
    if (!canManageRolePerms) {
      setErrorMessage('You do not have permission (PERM_ROLE_MANAGE).');
      return;
    }
    if (!selectedRole || roleSelectedPerms.length === 0) {
      setErrorMessage('Select at least one permission');
      return;
    }
    try {
      if (roleMode === 'grant') {
        await Promise.all(roleSelectedPerms.map(code =>
          api.post(`/roles/${encodeURIComponent(selectedRole)}/grant/${encodeURIComponent(code)}`)));
      } else {
        await Promise.all(roleSelectedPerms.map(code =>
          api.post(`/roles/${encodeURIComponent(selectedRole)}/revoke/${encodeURIComponent(code)}`)));
      }

      const { data } = await api.get<string[]>(`/roles/${encodeURIComponent(selectedRole)}/permissions`);
      const filtered = (Array.isArray(data) ? data : []).filter(c => GLOBAL5.has(c));
      setRolePerms(filtered);
      setManageRoleOpen(false);
      setRoleSelectedPerms([]);

      if (user?.roles?.includes(selectedRole)) await refresh();

      setSuccessMessage(roleMode === 'grant' ? 'Role permission(s) granted!' : 'Role permission(s) revoked!');
      setTimeout(() => setSuccessMessage(''), 3000);
      setErrorMessage('');
    } catch (e: any) {
      setErrorMessage(e?.response?.data?.message || 'Operation failed');
    }
  };

  const togglePermRole = (code: string) =>
    setRoleSelectedPerms(prev => prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]);

  const toggleSidebar = () => setIsOpenSidebar(v => !v);

  if (!user) return <div>Loading...</div>;
  if (!canRead) {
    return (
      <div className="flex h-screen bg-gray-100">
        <Sidebar user={user} isOpen={isOpenSidebar} onClose={toggleSidebar} />
        <div className="flex-1 flex flex-col">
          <Topbar user={user} />
          <main className="flex-1 p-6 overflow-auto">
            <div className="p-4 bg-white rounded shadow">
              You don’t have permission to view this page (need READ).
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar user={user} isOpen={isOpenSidebar} onClose={toggleSidebar} />
      <div className="flex-1 flex flex-col">
        <Topbar user={user} />
        <main className="flex-1 p-6 overflow-auto">
          <h1 className="text-2xl font-bold mb-4">Permissions</h1>

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

          {/* users table */}
          <table className="w-full bg-white rounded shadow mb-6">
            <thead>
              <tr className="bg-gray-200">
                <th className="p-2 text-left">User</th>
                <th className="p-2 text-left">Roles</th>
                <th className="p-2 text-left">Permissions</th>
                <th className="p-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>{tableRows}</tbody>
          </table>

          {/* manage role & quick pick user */}
          <div className="bg-white p-6 rounded shadow space-y-6">
            <h2 className="text-xl font-semibold">Manage Role & User Permissions</h2>

            <div>
              <label className="block text-sm mb-1">Role</label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="w-full p-2 border rounded"
              >
                <option value="">Select Role</option>
                {roles.map((r) => (
                  <option key={r.id} value={r.code}>{r.code}</option>
                ))}
              </select>
            </div>

            {selectedRole && (
              <div className="p-4 border rounded space-y-3">
                <div className="font-semibold text-sm">Current role permissions</div>
                <div className="text-sm break-words">{rolePerms.length ? rolePerms.join(', ') : '—'}</div>
                <div className="flex gap-2">
                  {canManageRolePerms && (
                    <>
                      <button
                        onClick={() => { setRoleMode('grant'); setRoleSelectedPerms([]); setManageRoleOpen(true); }}
                        className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                      >
                        Grant to Role
                      </button>
                      <button
                        onClick={() => { setRoleMode('revoke'); setRoleSelectedPerms([]); setManageRoleOpen(true); }}
                        className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                      >
                        Revoke from Role
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm mb-1">User with selected role</label>
              <select
                value={selectedRole ? selectedDropdownUserId : ''}
                onChange={(e) => setSelectedDropdownUserId(e.target.value)}
                className="w-full p-2 border rounded"
                disabled={!selectedRole || !canManageUserPerms}
              >
                <option value="">Select User</option>
                {roleUsers.map((ru) => (
                  <option key={ru.id} value={String(ru.id)}>
                    {ru.username}{ru.fullName ? ` (${ru.fullName})` : ''}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">Tip: you can also click “Permissions” on a user row above.</p>
            </div>
          </div>

          {/* view modal */}
          <Modal isOpen={viewOpen} onClose={() => setViewOpen(false)} title="User Details">
            {selected && (
              <div className="space-y-2">
                <p><strong>Username:</strong> {selected.username}</p>
                {selected.fullName && <p><strong>Full Name:</strong> {selected.fullName}</p>}
                <p><strong>Roles:</strong> {(selected.roles || []).join(', ') || '—'}</p>
                <p><strong>Permissions:</strong> {prettyPerms(onlyGlobalFive(selected.permissions)) || '—'}</p>
              </div>
            )}
          </Modal>

          {/* manage USER modal */}
          <Modal
            isOpen={manageOpen}
            onClose={() => setManageOpen(false)}
            title={`Permissions for ${selectedUserLabel || 'User'}`}
            onSubmit={submitManageUser}
          >
            {!canManageUserPerms ? (
              <div className="text-sm text-red-600">You do not have permission (PERM_USER_MANAGE).</div>
            ) : (
              <>
                <div className="mb-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => { setMode('grant'); setSelectedPerms([]); }}
                    className={`px-3 py-1 rounded border ${mode === 'grant' ? 'bg-green-600 text-white border-green-700' : 'bg-white text-gray-700 border-gray-300'}`}
                  >
                    Grant
                  </button>
                  <button
                    type="button"
                    onClick={() => { setMode('revoke'); setSelectedPerms([]); }}
                    className={`px-3 py-1 rounded border ${mode === 'revoke' ? 'bg-red-600 text-white border-red-700' : 'bg-white text-gray-700 border-gray-300'}`}
                  >
                    Revoke
                  </button>
                </div>

                <div className="mb-2 text-sm">
                  <strong>{mode === 'grant' ? 'Available to grant' : 'Currently effective'}</strong>
                </div>

                <div className="max-h-64 overflow-auto border rounded p-3 space-y-2">
                  {permissionOptionsUser.length === 0 ? (
                    <div className="text-sm text-gray-500">No permissions to {mode}.</div>
                  ) : (
                    permissionOptionsUser.map((p) => (
                      <label key={p.code} className="flex items-center text-sm">
                        <input
                          type="checkbox"
                          checked={selectedPerms.includes(p.code)}
                          onChange={() => {
                            setSelectedPerms(prev => prev.includes(p.code) ? prev.filter(c => c !== p.code) : [...prev, p.code]);
                          }}
                          className="mr-2"
                        />
                        <span className="font-mono mr-2">{p.code}</span>
                        <span className="text-gray-600">— {p.description || p.code}</span>
                      </label>
                    ))
                  )}
                </div>
              </>
            )}
          </Modal>

          {/* manage ROLE modal */}
          <Modal
            isOpen={manageRoleOpen}
            onClose={() => setManageRoleOpen(false)}
            title={`${roleMode === 'grant' ? 'Grant' : 'Revoke'} Permissions (Role: ${selectedRole || ''})`}
            onSubmit={submitManageRole}
          >
            {!canManageRolePerms ? (
              <div className="text-sm text-red-600">You do not have permission (PERM_ROLE_MANAGE).</div>
            ) : (
              <>
                <div className="mb-2 text-sm">
                  <strong>{roleMode === 'grant' ? 'Available to grant' : 'Currently assigned to role'}</strong>
                </div>

                <div className="max-h-64 overflow-auto border rounded p-3 space-y-2">
                  {permissionOptionsRole.length === 0 ? (
                    <div className="text-sm text-gray-500">No permissions to {roleMode}.</div>
                  ) : (
                    permissionOptionsRole.map((p) => (
                      <label key={p.code} className="flex items-center text-sm">
                        <input
                          type="checkbox"
                          checked={roleSelectedPerms.includes(p.code)}
                          onChange={() => togglePermRole(p.code)}
                          className="mr-2"
                        />
                        <span className="font-mono mr-2">{p.code}</span>
                        <span className="text-gray-600">— {p.description || p.code}</span>
                      </label>
                    ))
                  )}
                </div>
              </>
            )}
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
