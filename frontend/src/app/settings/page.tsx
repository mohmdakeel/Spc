'use client';

import { useState } from 'react';
import Topbar from '../../../components/Topbar';
import Sidebar from '../../../components/Sidebar';
import { useAuth } from '../../../hooks/useAuth';
import api from '../../../lib/api';
import { useTheme } from '../../../components/ThemeProvider';
import {
  UserCog,
  Info,
  KeyRound,
  Key,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff,
  Settings as SettingsIcon,
  Sun,
  Moon
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
  const usernameForAutofill = user?.username ?? user?.email ?? '';

  // ui feedback
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const { theme, setTheme } = useTheme();

  function flashSuccess(msg: string) {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(''), 3000);
  }
  function flashError(msg: string) {
    setErrorMessage(msg);
    setTimeout(() => setErrorMessage(''), 5000);
  }

  const extractError = (err: unknown, fallback: string) => {
    if (
      typeof err === 'object' &&
      err !== null &&
      'response' in err &&
      (err as { response?: { data?: { message?: string } } }).response?.data?.message
    ) {
      return (err as { response?: { data?: { message?: string } } }).response!.data!.message!;
    }
    return fallback;
  };

  const handleChangePassword = async (e?: React.FormEvent) => {
    e?.preventDefault();
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
    } catch (err) {
      flashError(extractError(err, 'Failed to change password'));
    } finally {
        setChanging(false);
    }
  };

  const setThemeMode = (mode: 'light' | 'dark') => {
    setTheme(mode);
    flashSuccess(`Appearance set to ${mode === 'dark' ? 'Dark' : 'Light'} mode.`);
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

          <div className="space-y-8">
            {/* MAIN CONTENT */}
            <div className="w-full space-y-6">
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

                    <form onSubmit={handleChangePassword} className="space-y-4">
                      {/* Hidden username field improves browser password manager compatibility */}
                      <input
                        type="text"
                        name="username"
                        autoComplete="username"
                        value={usernameForAutofill}
                        onChange={() => {}}
                        className="sr-only"
                        inputMode="text"
                      />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <label
                            htmlFor="currentPassword"
                            className="block text-sm font-medium text-gray-700 mb-2"
                          >
                            Current Password
                          </label>
                          <input
                            id="currentPassword"
                            name="currentPassword"
                            type={showPw ? 'text' : 'password'}
                            value={oldPassword}
                            onChange={(e) => setOldPassword(e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                            placeholder="Enter current password"
                            autoComplete="current-password"
                          />
                        </div>

                        <div>
                          <label
                            htmlFor="newPassword"
                            className="block text-sm font-medium text-gray-700 mb-2"
                          >
                            New Password
                          </label>
                          <div className="flex gap-2">
                            <input
                              id="newPassword"
                              name="newPassword"
                              type={showPw ? 'text' : 'password'}
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                              placeholder="Enter new password"
                              autoComplete="new-password"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPw((v) => !v)}
                              className="px-3 border border-gray-300 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                              title={showPw ? 'Hide passwords' : 'Show passwords'}
                              aria-label={showPw ? 'Hide passwords' : 'Show passwords'}
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
                        type="submit"
                        disabled={changing}
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
                    </form>
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

              {/* APPEARANCE */}
              <div className="bg-white rounded-2xl shadow-lg border border-orange-200 overflow-hidden">
                <div className="p-6 border-b border-orange-200 bg-orange-50 flex items-center gap-2">
                  {theme === 'dark' ? (
                    <Moon className="w-5 h-5 text-orange-600" />
                  ) : (
                    <Sun className="w-5 h-5 text-orange-600" />
                  )}
                  <h2 className="text-xl font-bold text-gray-900">Appearance</h2>
                </div>
                <div className="p-6 space-y-4">
                  <p className="text-sm text-gray-600">
                    Switch between light and dark modes for the entire workspace.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      type="button"
                      onClick={() => setThemeMode('light')}
                      className={`flex-1 rounded-lg border px-4 py-3 text-sm font-semibold transition ${
                        theme === 'light'
                          ? 'bg-orange-600 text-white border-orange-600 shadow'
                          : 'border-orange-200 text-orange-800 hover:bg-orange-50'
                      }`}
                    >
                      Light Mode
                    </button>
                    <button
                      type="button"
                      onClick={() => setThemeMode('dark')}
                      className={`flex-1 rounded-lg border px-4 py-3 text-sm font-semibold transition ${
                        theme === 'dark'
                          ? 'bg-orange-600 text-white border-orange-600 shadow'
                          : 'border-orange-200 text-orange-800 hover:bg-orange-50'
                      }`}
                    >
                      Dark Mode
                    </button>
                  </div>
                  <p className="text-xs text-gray-500">
                    Preference is stored locally as <code>workspace-theme</code>.
                  </p>
                </div>
              </div>
            </div>
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
