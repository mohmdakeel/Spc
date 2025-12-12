'use client';
/* eslint-disable @next/next/no-img-element */

import { useState } from 'react';
import Topbar from '../../../components/Topbar';
import Sidebar from '../../../components/Sidebar';
import api from '../../../lib/api';
import { useAuth } from '../../../hooks/useAuth';
import {
  Save,
  User,
  Mail,
  Building,
  Shield,
  Key,
  Camera,
  Eye,
  EyeOff,
  XCircle,
  CheckCircle,
} from 'lucide-react';

export default function Profile() {
  const { user, setUser } = useAuth();

  // ---------------- state ----------------
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [isOpenSidebar, setIsOpenSidebar] = useState(false);
  const usernameForAutofill = user?.username ?? user?.email ?? '';

  // for avatar upload
  const [uploadingImage, setUploadingImage] = useState(false);

  // ---------------- permission logic ----------------
  const has = (p: string) => !!user?.permissions?.includes(p);

  const canViewSecurityCard = true;
  const canChangePassword = true;
  const canSeeRolesAndPerms =
    has('READ') || has('PERM_READ') || user?.roles?.includes('ADMIN');

  // ---------------- handlers ----------------
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canChangePassword) return;

    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/change-password', { oldPassword, newPassword });
      setSuccess('Password changed successfully!');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  // handle selecting a new profile photo
  const handleSelectNewPhoto = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];

    setError('');
    setSuccess('');

    try {
      setUploadingImage(true);

      // 1. upload file -> backend -> Cloudinary
      const fd = new FormData();
      fd.append('file', file);

      const { data: uploadRes } = await api.post('/upload', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const newUrl = uploadRes.url; // secure_url from backend

      // 2. tell backend to save this URL on my profile (Registration.imageUrl)
      await api.post('/auth/me/image', { imageUrl: newUrl });

      // 3. update local auth context so UI updates instantly
      if (setUser && user) {
        setUser({
          ...user,
          imageUrl: newUrl,
        });
      }

      setSuccess('Profile photo updated!');
    } catch (err: any) {
      console.error(err);
      setError(
        err?.response?.data?.message || 'Failed to upload new photo'
      );
    } finally {
      setUploadingImage(false);
      // allow selecting same file again
      e.target.value = '';
    }
  };

  const toggleSidebar = () => setIsOpenSidebar(!isOpenSidebar);

  // ---------------- loading guard ----------------
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  // ---------------- UI ----------------
  return (
    <div className="auth-shell">
      <Sidebar user={user} isOpen={isOpenSidebar} onClose={toggleSidebar} />

      <div className="auth-shell__main overflow-hidden">
        <Topbar user={user} />

        <main className="auth-shell__content">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Profile Settings
                </h1>
                <p className="text-gray-600 mt-1">
                  Manage your account information and security
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* LEFT SIDE: Profile Info */}
              <div className="lg:col-span-2 space-y-6">
                {/* Profile Information Card */}
                <div className="bg-white rounded-2xl shadow-lg p-6 border border-orange-200">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-900">
                      Profile Information
                    </h2>
                    <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                      <User className="w-5 h-5 text-orange-600" />
                    </div>
                  </div>

                  <div className="space-y-4">
                    {/* Username */}
                    <div className="flex items-center gap-4 p-3 bg-orange-50 rounded-lg">
                      <User className="w-5 h-5 text-orange-600" />
                      <div>
                        <p className="text-sm text-gray-600">Username</p>
                        <p className="font-semibold text-gray-900">
                          {user.username}
                        </p>
                      </div>
                    </div>

                    {/* Email */}
                    <div className="flex items-center gap-4 p-3 bg-orange-50 rounded-lg">
                      <Mail className="w-5 h-5 text-orange-600" />
                      <div>
                        <p className="text-sm text-gray-600">Email</p>
                        <p className="font-semibold text-gray-900">
                          {user.email || 'Not provided'}
                        </p>
                      </div>
                    </div>

                    {/* Full Name */}
                    <div className="flex items-center gap-4 p-3 bg-orange-50 rounded-lg">
                      <User className="w-5 h-5 text-orange-600" />
                      <div>
                        <p className="text-sm text-gray-600">Full Name</p>
                        <p className="font-semibold text-gray-900">
                          {user.fullName || 'Not provided'}
                        </p>
                      </div>
                    </div>

                    {/* Department */}
                    <div className="flex items-center gap-4 p-3 bg-orange-50 rounded-lg">
                      <Building className="w-5 h-5 text-orange-600" />
                      <div>
                        <p className="text-sm text-gray-600">Department</p>
                        <p className="font-semibold text-gray-900">
                          {user.department || 'Not assigned'}
                        </p>
                      </div>
                    </div>

                    {/* Roles */}
                    {canSeeRolesAndPerms && (
                      <div className="flex items-start gap-4 p-3 bg-orange-50 rounded-lg">
                        <Shield className="w-5 h-5 text-orange-600 mt-1" />
                        <div className="flex-1">
                          <p className="text-sm text-gray-600">Roles</p>
                          <div className="flex gap-1 flex-wrap mt-1">
                            {user.roles?.length ? (
                              user.roles.map((role: string) => (
                                <span
                                  key={role}
                                  className="bg-orange-100 text-orange-700 px-2 py-1 rounded-full text-xs font-medium"
                                >
                                  {role}
                                </span>
                              ))
                            ) : (
                              <span className="text-xs text-gray-500">
                                None
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Permissions */}
                    {canSeeRolesAndPerms &&
                      user.permissions &&
                      user.permissions.length > 0 && (
                        <div className="flex items-start gap-4 p-3 bg-orange-50 rounded-lg">
                          <Key className="w-5 h-5 text-orange-600 mt-1" />
                          <div className="flex-1">
                            <p className="text-sm text-gray-600">
                              Permissions
                            </p>
                            <div className="flex gap-1 flex-wrap mt-1">
                              {user.permissions.map((perm: string) => (
                                <span
                                  key={perm}
                                  className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-medium"
                                >
                                  {perm}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                  </div>
                </div>
              </div>

              {/* RIGHT SIDE: Avatar + Password change */}
              <div className="space-y-6">
                {/* Profile Picture Card */}
                <div className="bg-white rounded-2xl shadow-lg p-6 border border-orange-200">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-900">
                      Profile Picture
                    </h2>
                    <Camera className="w-5 h-5 text-orange-600" />
                  </div>

                  <div className="flex flex-col items-center space-y-4">
                    <div className="w-32 h-32 bg-orange-100 rounded-full flex items-center justify-center overflow-hidden border-4 border-orange-200">
                      {user.imageUrl ? (
                        <img
                          src={user.imageUrl}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-12 h-12 text-orange-600" />
                  )}
                </div>

                {/* image upload control */}
                <label className="text-orange-600 hover:text-orange-700 text-sm font-medium transition-colors cursor-pointer">
                  {uploadingImage ? 'Uploading...' : 'Change Photo'}
                  <input
                    id="profilePhotoUpload"
                    name="profilePhotoUpload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={uploadingImage}
                    onChange={handleSelectNewPhoto}
                      />
                    </label>
                  </div>
                </div>

                {/* Change Password Card */}
                {canViewSecurityCard && (
                  <div className="bg-white rounded-2xl shadow-lg p-6 border border-orange-200">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-xl font-bold text-gray-900">
                        Change Password
                      </h2>
                      <Key className="w-5 h-5 text-orange-600" />
                    </div>

                    <form
                      onSubmit={handleChangePassword}
                      className="space-y-4"
                    >
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

                      {/* success / error alert boxes */}
                      {success && (
                        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 flex-shrink-0" />
                          <span>{success}</span>
                        </div>
                      )}

                      {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-start gap-2">
                          <XCircle className="w-4 h-4 flex-shrink-0" />
                          <span>{error}</span>
                        </div>
                      )}

                      {/* Old password */}
                      <div>
                        <label
                          htmlFor="profileCurrentPassword"
                          className="block text-sm font-medium text-gray-700 mb-2"
                        >
                          Current Password
                        </label>
                        <div className="relative">
                          <input
                            id="profileCurrentPassword"
                            name="profileCurrentPassword"
                            type={showOldPassword ? 'text' : 'password'}
                            value={oldPassword}
                            onChange={(e) =>
                              setOldPassword(e.target.value)
                            }
                            placeholder="Enter current password"
                            autoComplete="current-password"
                            className="w-full border border-gray-300 rounded-lg px-4 py-3 pr-10 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                            required
                            disabled={!canChangePassword || loading}
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setShowOldPassword(!showOldPassword)
                            }
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                            tabIndex={-1}
                            aria-label={
                              showOldPassword
                                ? 'Hide current password'
                                : 'Show current password'
                            }
                          >
                            {showOldPassword ? (
                              <EyeOff size={20} />
                            ) : (
                              <Eye size={20} />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* New password */}
                      <div>
                        <label
                          htmlFor="profileNewPassword"
                          className="block text-sm font-medium text-gray-700 mb-2"
                        >
                          New Password
                        </label>
                        <div className="relative">
                          <input
                            id="profileNewPassword"
                            name="profileNewPassword"
                            type={showNewPassword ? 'text' : 'password'}
                            value={newPassword}
                            onChange={(e) =>
                              setNewPassword(e.target.value)
                            }
                            placeholder="Enter new password"
                            autoComplete="new-password"
                            className="w-full border border-gray-300 rounded-lg px-4 py-3 pr-10 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                            required
                            disabled={!canChangePassword || loading}
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setShowNewPassword(!showNewPassword)
                            }
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                            tabIndex={-1}
                            aria-label={
                              showNewPassword
                                ? 'Hide new password'
                                : 'Show new password'
                            }
                          >
                            {showNewPassword ? (
                              <EyeOff size={20} />
                            ) : (
                              <Eye size={20} />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Confirm new password */}
                      <div>
                        <label
                          htmlFor="profileConfirmPassword"
                          className="block text-sm font-medium text-gray-700 mb-2"
                        >
                          Confirm New Password
                        </label>
                        <div className="relative">
                          <input
                            id="profileConfirmPassword"
                            name="profileConfirmPassword"
                            type={
                              showConfirmPassword ? 'text' : 'password'
                            }
                            value={confirmPassword}
                            onChange={(e) =>
                              setConfirmPassword(e.target.value)
                            }
                            placeholder="Confirm new password"
                            autoComplete="new-password"
                            className="w-full border border-gray-300 rounded-lg px-4 py-3 pr-10 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                            required
                            disabled={!canChangePassword || loading}
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setShowConfirmPassword(
                                !showConfirmPassword
                              )
                            }
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                            tabIndex={-1}
                            aria-label={
                              showConfirmPassword
                                ? 'Hide confirmation password'
                                : 'Show confirmation password'
                            }
                          >
                            {showConfirmPassword ? (
                              <EyeOff size={20} />
                            ) : (
                              <Eye size={20} />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Submit */}
                      <button
                        type="submit"
                        disabled={!canChangePassword || loading}
                        className="w-full bg-orange-600 text-white py-3 rounded-lg hover:bg-orange-700 disabled:bg-orange-400 disabled:cursor-not-allowed transition-all duration-200 font-semibold shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                      >
                        {loading ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Updating...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4" />
                            Update Password
                          </>
                        )}
                      </button>
                    </form>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Mobile Sidebar Button */}
          <button
            className="md:hidden fixed bottom-6 right-6 w-14 h-14 bg-orange-600 text-white rounded-full shadow-lg hover:bg-orange-700 transition-all flex items-center justify-center z-40"
            onClick={toggleSidebar}
          >
            <span className="text-lg font-bold">☰</span>
          </button>
        </main>
      </div>
    </div>
  );
}
