'use client';

import { useState } from 'react';
import Topbar from '../../../components/Topbar';
import Sidebar from '../../../components/Sidebar';
import { useAuth } from '../../../hooks/useAuth';
import api from '../../../lib/api';
import {
  Shield,
  UserCog,
  Info,
  AlertTriangle,
  KeyRound,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff,
  Settings as SettingsIcon,
  Users,
  Key,
  Database,
  LogOut
} from 'lucide-react';

export default function SettingsPage() {
  const { user, refresh } = useAuth();

  // sidebar mobile toggle
  const [isOpenSidebar, setIsOpenSidebar] = useState(false);

  // change password form
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [changing, setChanging] = useState(false);

  // ui feedback
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // fake "system config" toggles (future backend)
  const [protectRootEnabled, setProtectRootEnabled] = useState(true);
  const [requireStrongPw, setRequireStrongPw] = useState(true);
  const [auditTracking, setAuditTracking] = useState(true);

  function flashSuccess(msg: string) {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(''), 3000);
  }
  function flashError(msg: string) {
    setErrorMessage(msg);
    setTimeout(() => setErrorMessage(''), 5000);
  }

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword) {
      flashError('Please fill both fields');
      return;
    }
    try {
      setChanging(true);
      await api.post('/auth/change-password', {
        oldPassword,
        newPassword,
      });

      // attempt to refresh auth context (optional)
      await refresh?.();

      setOldPassword('');
      setNewPassword('');
      flashSuccess('Password updated successfully');
    } catch (err: any) {
      flashError(
        err?.response?.data?.message ||
          'Failed to change password'
      );
    } finally {
        setChanging(false);
    }
  };

  // NOTE:
  // "Danger Zone" buttons are wired to just alert()
  // You can later hook them to backend admin ops.
  const handleResetSeedData = () => {
    alert('TODO: call backend /admin/reset-seed (not implemented)');
  };

  const handleLogoutAllSessions = () => {
    alert('TODO: call backend /auth/logout-all (not implemented)');
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

  // Guard: only ADMIN should see system-level settings.
  const isAdmin = user.roles?.includes('ADMIN');

  return (
    <div className="flex h-screen bg-gradient-to-br from-orange-50 to-orange-100">
      <Sidebar
        user={user}
        isOpen={isOpenSidebar}
        onClose={() => setIsOpenSidebar(false)}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar user={user} />

        <main className="flex-1 overflow-y-auto p-6">
          {/* HEADER */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <SettingsIcon className="w-8 h-8 text-orange-600" />
              <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
            </div>
            <p className="text-gray-600">Manage your account and system configuration</p>
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
            {/* MAIN CONTENT */}
            <div className="xl:col-span-2 space-y-6">
              {/* MY ACCOUNT CARD */}
              <div className="bg-white rounded-2xl shadow-lg border border-orange-200 overflow-hidden">
                <div className="p-6 border-b border-orange-200 bg-orange-50">
                  <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <UserCog className="w-5 h-5 text-orange-600" />
                    My Account
                  </h2>
                </div>
                <div className="p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                      <div className="text-sm font-medium text-orange-700 mb-1">Username</div>
                      <div className="text-gray-900 font-medium">{user.username}</div>
                    </div>

                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                      <div className="text-sm font-medium text-orange-700 mb-1">Full Name</div>
                      <div className="text-gray-900 font-medium">{user.fullName || '—'}</div>
                    </div>

                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                      <div className="text-sm font-medium text-orange-700 mb-1">Email</div>
                      <div className="text-gray-900 font-medium">{user.email || '—'}</div>
                    </div>

                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                      <div className="text-sm font-medium text-orange-700 mb-1">Department</div>
                      <div className="text-gray-900 font-medium">{user.department || '—'}</div>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <KeyRound className="w-5 h-5 text-orange-600" />
                      Change Password
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Current Password
                        </label>
                        <input
                          type={showPw ? 'text' : 'password'}
                          value={oldPassword}
                          onChange={(e) => setOldPassword(e.target.value)}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                          placeholder="Enter current password"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          New Password
                        </label>
                        <div className="flex gap-2">
                          <input
                            type={showPw ? 'text' : 'password'}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                            placeholder="Enter new password"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPw((v) => !v)}
                            className="px-3 border border-gray-300 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                            title={showPw ? 'Hide passwords' : 'Show passwords'}
                          >
                            {showPw ? (
                              <EyeOff className="w-5 h-5 text-gray-600" />
                            ) : (
                              <Eye className="w-5 h-5 text-gray-600" />
                            )}
                          </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          • At least 8 characters
                          <br />
                          • Mix of letters and numbers
                        </p>
                      </div>
                    </div>

                    <button
                      disabled={changing}
                      onClick={handleChangePassword}
                      className="flex items-center px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-orange-400 disabled:cursor-not-allowed transition-colors font-medium"
                    >
                      {changing ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                          Updating Password...
                        </>
                      ) : (
                        <>
                          <Key className="w-4 h-4 mr-2" />
                          Update Password
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* SYSTEM INFO CARD */}
              <div className="bg-white rounded-2xl shadow-lg border border-orange-200 overflow-hidden">
                <div className="p-6 border-b border-orange-200 bg-orange-50">
                  <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <Info className="w-5 h-5 text-orange-600" />
                    System Information
                  </h2>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="text-sm font-medium text-blue-700 mb-1">Your Roles</div>
                      <div className="text-gray-900 font-medium">
                        {(user.roles || []).length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {(user.roles || []).map(role => (
                              <span key={role} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                                {role}
                              </span>
                            ))}
                          </div>
                        ) : (
                          '—'
                        )}
                      </div>
                    </div>

                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="text-sm font-medium text-green-700 mb-1">Your Permissions</div>
                      <div className="text-gray-900 font-medium">
                        {(user.permissions || []).length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {(user.permissions || []).map(perm => (
                              <span key={perm} className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">
                                {perm}
                              </span>
                            ))}
                          </div>
                        ) : (
                          '—'
                        )}
                      </div>
                    </div>

                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                      <div className="text-sm font-medium text-purple-700 mb-1">Access Scope</div>
                      <div className="text-gray-900 font-medium">
                        {user.roles?.includes('ADMIN')
                          ? 'Full Admin'
                          : user.roles?.includes('TRANSPORT_ADMIN')
                          ? 'Transport Admin'
                          : user.roles?.includes('TRANSPORT')
                          ? 'Transport Staff'
                          : user.roles?.includes('HR') || user.roles?.includes('HRD')
                          ? 'HR Department'
                          : 'Standard User'}
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500 bg-gray-50 border border-gray-200 rounded-lg p-3">
                    <Info className="w-4 h-4 inline mr-1" />
                    This information comes from your authentication session and backend permissions.
                    Contact ADMIN if anything appears incorrect.
                  </div>
                </div>
              </div>

              {/* DANGER ZONE - ADMIN ONLY */}
              {isAdmin && (
                <div className="bg-white rounded-2xl shadow-lg border border-red-300 overflow-hidden">
                  <div className="p-6 border-b border-red-300 bg-red-50">
                    <h2 className="text-xl font-bold text-red-900 flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-red-600" />
                      Danger Zone
                    </h2>
                  </div>
                  <div className="p-6 space-y-4">
                    <p className="text-gray-600">
                      High-impact maintenance actions. These operations affect all users and system data.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-3">
                      <button
                        onClick={handleLogoutAllSessions}
                        className="flex items-center px-4 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors font-medium"
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        Force Logout All Users
                      </button>

                      <button
                        onClick={handleResetSeedData}
                        className="flex items-center px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                      >
                        <Database className="w-4 h-4 mr-2" />
                        Reset Demo Data
                      </button>
                    </div>

                    <div className="text-sm text-gray-500 bg-gray-50 border border-gray-200 rounded-lg p-3">
                      <AlertTriangle className="w-4 h-4 inline mr-1 text-yellow-500" />
                      These actions are currently stubs. Backend endpoints to implement:
                      <br />
                      • <code className="bg-gray-100 px-1 rounded">POST /admin/force-logout-all</code>
                      <br />
                      • <code className="bg-gray-100 px-1 rounded">POST /admin/reset-seed</code>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT COLUMN - SECURITY POLICY */}
            {isAdmin && (
              <div className="space-y-6">
                {/* SECURITY POLICY CARD */}
                <div className="bg-white rounded-2xl shadow-lg border border-orange-200 overflow-hidden">
                  <div className="p-6 border-b border-orange-200 bg-orange-50">
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                      <Shield className="w-5 h-5 text-orange-600" />
                      Security Policy
                    </h2>
                  </div>
                  <div className="p-6">
                    <p className="text-sm text-gray-600 mb-4">
                      Configure system-wide security settings and policies.
                    </p>

                    <div className="space-y-4">
                      <label className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                        <input
                          type="checkbox"
                          checked={protectRootEnabled}
                          onChange={(e) => setProtectRootEnabled(e.target.checked)}
                          className="mt-1 text-orange-600 focus:ring-orange-500"
                        />
                        <div>
                          <div className="font-medium text-gray-900">Protect Root Accounts</div>
                          <div className="text-sm text-gray-500 mt-1">
                            Prevent editing or deleting critical system accounts (admin1, etc.)
                          </div>
                        </div>
                      </label>

                      <label className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                        <input
                          type="checkbox"
                          checked={requireStrongPw}
                          onChange={(e) => setRequireStrongPw(e.target.checked)}
                          className="mt-1 text-orange-600 focus:ring-orange-500"
                        />
                        <div>
                          <div className="font-medium text-gray-900">Require Strong Passwords</div>
                          <div className="text-sm text-gray-500 mt-1">
                            Enforce minimum length and complexity requirements
                          </div>
                        </div>
                      </label>

                      <label className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                        <input
                          type="checkbox"
                          checked={auditTracking}
                          onChange={(e) => setAuditTracking(e.target.checked)}
                          className="mt-1 text-orange-600 focus:ring-orange-500"
                        />
                        <div>
                          <div className="font-medium text-gray-900">Activity Audit Tracking</div>
                          <div className="text-sm text-gray-500 mt-1">
                            Log role assignments, permission changes, and login activity
                          </div>
                        </div>
                      </label>
                    </div>

                    <div className="mt-4 text-sm text-gray-500 bg-gray-50 border border-gray-200 rounded-lg p-3">
                      <Info className="w-4 h-4 inline mr-1" />
                      These settings are currently UI-only. Connect to backend via{' '}
                      <code className="bg-gray-100 px-1 rounded">/admin/security-policy</code>
                    </div>
                  </div>
                </div>

                {/* QUICK STATS */}
                <div className="bg-white rounded-2xl shadow-lg border border-orange-200 overflow-hidden">
                  <div className="p-6 border-b border-orange-200 bg-orange-50">
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                      <Users className="w-5 h-5 text-orange-600" />
                      Quick Stats
                    </h2>
                  </div>
                  <div className="p-6 space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Admin Access</span>
                      <span className="text-2xl font-bold text-green-600">Enabled</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Security Level</span>
                      <span className="text-2xl font-bold text-orange-600">High</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Audit Logging</span>
                      <span className="text-2xl font-bold text-blue-600">Active</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

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