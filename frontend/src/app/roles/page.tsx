'use client';

import { useEffect, useMemo, useState } from 'react';
import Topbar from '../../../components/Topbar';
import Sidebar from '../../../components/Sidebar';
import Modal from '../../../components/Modal';
import api from '../../../lib/api';
import { useAuth } from '../../../hooks/useAuth';
import { Check, X } from 'lucide-react';

type Role = { id: number; code: string; name: string; description: string };
type Perm = { id: number; code: string; description?: string };
type UserLite = { id: number; username: string; fullName?: string };

const GLOBAL5 = new Set(["CREATE","READ","UPDATE","DELETE","PRINT"]);

export default function Roles() {
  const { user, refresh } = useAuth();

  const [roles, setRoles] = useState<Role[]>([]);
  const [allPerms, setAllPerms] = useState<Perm[]>([]);

  const [selectedRole, setSelectedRole] = useState<string>('');
  const [roleUsers, setRoleUsers] = useState<UserLite[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');

  const [effectivePerms, setEffectivePerms] = useState<string[]>([]);
  const [directPerms, setDirectPerms] = useState<string[]>([]);

  const [mode, setMode] = useState<'grant' | 'revoke'>('grant');
  const [manageOpen, setManageOpen] = useState(false);
  const [selectedPerms, setSelectedPerms] = useState<string[]>([]);

  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isOpenSidebar, setIsOpenSidebar] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user?.roles?.includes('ADMIN')) return;
    (async () => {
      try {
        setLoading(true);
        const [{ data: r }, { data: p }] = await Promise.all([
          api.get<Role[]>('/roles'),
          api.get<Perm[]>('/roles/permissions'),
        ]);
        setRoles(Array.isArray(r) ? r : []);
        const globals = (Array.isArray(p) ? p : []).filter(x => GLOBAL5.has(x.code));
        setAllPerms(globals);
      } catch (e: any) {
        setErrorMessage(e?.response?.data?.message || 'Failed to load roles or permissions');
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  useEffect(() => {
    setRoleUsers([]);
    setSelectedUserId('');
    setEffectivePerms([]);
    setDirectPerms([]);
    if (!selectedRole) return;

    (async () => {
      try {
        setLoading(true);
        const { data } = await api.get<UserLite[]>(`/users/by-role/${encodeURIComponent(selectedRole)}`);
        setRoleUsers(Array.isArray(data) ? data : []);
      } catch (e: any) {
        setRoleUsers([]);
        setErrorMessage(e?.response?.data?.message || 'Failed to load users for selected role');
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
        const [{ data: eff }, { data: direct }] = await Promise.all([
          api.get<string[]>(`/users/${uid}/permissions/effective`),
          api.get<string[]>(`/users/${uid}/permissions/direct`),
        ]);
        const filter = (xs: string[] = []) => xs.filter(c => GLOBAL5.has(c));
        setEffectivePerms(filter(Array.isArray(eff) ? eff : []));
        setDirectPerms(filter(Array.isArray(direct) ? direct : []));
      } catch (e: any) {
        setErrorMessage(e?.response?.data?.message || 'Failed to load user permissions');
      } finally {
        setLoading(false);
      }
    })();
  }, [selectedUserId]);

  const permissionOptions = useMemo(() => {
    const eff = new Set(effectivePerms);
    if (mode === 'grant') {
      return allPerms.filter((p) => !eff.has(p.code));
    }
    const direct = new Set(directPerms);
    return allPerms.filter((p) => direct.has(p.code));
  }, [allPerms, effectivePerms, directPerms, mode]);

  const openManageModal = (which: 'grant' | 'revoke') => {
    if (!selectedRole) return setErrorMessage('Select a role first');
    if (!selectedUserId) return setErrorMessage('Select a user first');
    setMode(which);
    setSelectedPerms([]);
    setManageOpen(true);
    setErrorMessage('');
  };

  const togglePerm = (code: string) =>
    setSelectedPerms((prev) => (prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]));

  const toggleAll = () =>
    setSelectedPerms((prev) =>
      prev.length === permissionOptions.length ? [] : permissionOptions.map((p) => p.code)
    );

  const submitManage = async () => {
    if (!selectedUserId || selectedPerms.length === 0) {
      setErrorMessage('Pick at least one permission');
      return;
    }
    try {
      const uid = Number(selectedUserId);
      if (mode === 'grant') {
        await Promise.all(selectedPerms.map((code) =>
          api.post(`/users/${uid}/grant/${encodeURIComponent(code)}`)));
      } else {
        await Promise.all(selectedPerms.map((code) =>
          api.post(`/users/${uid}/revoke/${encodeURIComponent(code)}`)));
      }

      const [{ data: eff }, { data: direct }] = await Promise.all([
        api.get<string[]>(`/users/${uid}/permissions/effective`),
        api.get<string[]>(`/users/${uid}/permissions/direct`),
      ]);
      const filter = (xs: string[] = []) => xs.filter(c => GLOBAL5.has(c));
      setEffectivePerms(filter(Array.isArray(eff) ? eff : []));
      setDirectPerms(filter(Array.isArray(direct) ? direct : []));

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

  const toggleSidebar = () => setIsOpenSidebar((v) => !v);

  if (!user || !user.roles?.includes('ADMIN')) return <div className="p-6">Access Denied</div>;

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar user={user} isOpen={isOpenSidebar} onClose={toggleSidebar} />
      <div className="flex-1 flex flex-col">
        <Topbar user={user} />
        <main className="flex-1 p-6 overflow-auto">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold">Roles</h1>
            {loading && <span className="text-sm text-gray-500">Loading…</span>}
          </div>

          {successMessage && <p className="mb-4 text-green-500 flex items-center"><Check className="mr-2" /> {successMessage}</p>}
          {errorMessage && <p className="mb-4 text-red-500 flex items-center"><X className="mr-2" /> {errorMessage}</p>}

          <table className="w-full bg-white rounded shadow mb-6">
            <thead>
              <tr className="bg-gray-200">
                <th className="p-2 text-left">Code</th>
                <th className="p-2 text-left">Name</th>
                <th className="p-2 text-left">Description</th>
              </tr>
            </thead>
            <tbody>
              {roles.map((r) => (
                <tr key={r.id} className="border-b">
                  <td className="p-2">{r.code}</td>
                  <td className="p-2">{r.name}</td>
                  <td className="p-2">{r.description}</td>
                </tr>
              ))}
              {!roles.length && (
                <tr>
                  <td colSpan={3} className="p-3 text-center text-gray-500">
                    No roles found
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <div className="bg-white p-6 rounded shadow space-y-4">
            <h2 className="text-xl font-semibold">Manage User Permissions</h2>

            <div>
              <label className="block text-sm mb-1">Role</label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="w-full p-2 border rounded"
              >
                <option value="">Select Role (e.g., TRANSPORT)</option>
                {roles.map((r) => (
                  <option key={r.id} value={r.code}>{r.code}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm mb-1">User with selected role</label>
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="w-full p-2 border rounded"
                disabled={!selectedRole}
              >
                <option value="">Select User</option>
                {roleUsers.map((u) => (
                  <option key={u.id} value={String(u.id)}>
                    {u.username}{u.fullName ? ` (${u.fullName})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => openManageModal('grant')}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
                disabled={!selectedUserId}
              >
                Grant
              </button>
              <button
                onClick={() => openManageModal('revoke')}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
                disabled={!selectedUserId}
              >
                Revoke
              </button>
            </div>

            {selectedUserId && (
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-3 border rounded">
                  <div className="font-semibold mb-2 text-sm">Effective permissions</div>
                  <div className="text-sm break-words">{effectivePerms.join(', ') || '—'}</div>
                </div>
                <div className="p-3 border rounded">
                  <div className="font-semibold mb-2 text-sm">Direct (user-only) permissions</div>
                  <div className="text-sm break-words">{directPerms.join(', ') || '—'}</div>
                </div>
              </div>
            )}
          </div>

          <Modal
            isOpen={manageOpen}
            onClose={() => setManageOpen(false)}
            title={`${mode === 'grant' ? 'Grant' : 'Revoke'} Permissions`}
            onSubmit={submitManage}
          >
            <div className="mb-2 text-sm">
              <strong>{mode === 'grant' ? 'Available to grant' : 'Currently granted to this user'}</strong>
            </div>

            <div className="flex items-center mb-3">
              <input
                id="selectAll"
                type="checkbox"
                checked={selectedPerms.length === permissionOptions.length && permissionOptions.length > 0}
                onChange={() =>
                  setSelectedPerms(prev => prev.length === permissionOptions.length ? [] : permissionOptions.map(p => p.code))
                }
                className="mr-2"
              />
              <label htmlFor="selectAll" className="text-sm">Select all</label>
            </div>

            <div className="max-h-64 overflow-auto border rounded p-3 space-y-2">
              {permissionOptions.length === 0 ? (
                <div className="text-sm text-gray-500">No permissions to {mode}.</div>
              ) : (
                permissionOptions.map((p) => (
                  <label key={p.code} className="flex items-center text-sm">
                    <input
                      type="checkbox"
                      checked={selectedPerms.includes(p.code)}
                      onChange={() =>
                        setSelectedPerms(prev => prev.includes(p.code) ? prev.filter(c => c !== p.code) : [...prev, p.code])
                      }
                      className="mr-2"
                    />
                    <span className="font-mono mr-2">{p.code}</span>
                    <span className="text-gray-600">— {p.description || p.code}</span>
                  </label>
                ))
              )}
            </div>
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
