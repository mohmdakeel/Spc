'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useAuth } from '../../../../../hooks/useAuth';
import api from '../../../../../lib/api';
import { Save, User, Mail, Key, Camera, Eye, EyeOff, Loader2, Shield } from 'lucide-react';

export default function GateProfilePage() {
  const { user, setUser, loading } = useAuth();

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [savingPassword, setSavingPassword] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setStatusMsg('');

    if (newPassword !== confirmPassword) {
      setErrorMsg('New passwords do not match.');
      return;
    }
    if (newPassword.length < 6) {
      setErrorMsg('New password must be at least 6 characters.');
      return;
    }

    setSavingPassword(true);
    try {
      await api.post('/auth/change-password', {
        oldPassword,
        newPassword,
      });
      setStatusMsg('Password updated successfully.');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || 'Failed to change password.');
    } finally {
      setSavingPassword(false);
    }
  };

  const handleSelectNewPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    const file = e.target.files[0];

    setErrorMsg('');
    setStatusMsg('');

    try {
      setUploadingImage(true);
      const fd = new FormData();
      fd.append('file', file);

      const { data: uploadRes } = await api.post('/upload', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const newUrl = uploadRes.url;
      await api.post('/auth/me/image', { imageUrl: newUrl });

      if (setUser && user) {
        setUser({ ...user, imageUrl: newUrl });
      }
      setStatusMsg('Profile photo updated.');
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || 'Failed to update profile photo.');
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <header className="space-y-1">
        <p className="text-xs font-semibold text-orange-700 uppercase tracking-wide">My profile</p>
        <h1 className="text-2xl font-bold text-orange-900">Gate Security</h1>
        <p className="text-sm text-gray-600">
          Manage your account details, credentials, and contact info.
        </p>
      </header>

      {(statusMsg || errorMsg) && (
        <div
          className={[
            'rounded-xl px-4 py-3 text-sm border',
            statusMsg ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700',
          ].join(' ')}
        >
          {statusMsg || errorMsg}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="bg-white rounded-2xl border border-orange-200 shadow-sm p-6 space-y-3">
          <h2 className="text-lg font-semibold text-orange-900 flex items-center gap-2">
            <User className="w-4 h-4" /> Identity
          </h2>
          <dl className="space-y-2 text-sm text-gray-700">
            <Row label="Full name" value={user.fullName} />
            <Row label="Username" value={user.username} />
            <Row label="Role" value="Gate Security" />
            <Row label="Department" value={user.department} />
          </dl>
        </section>

        <section className="bg-white rounded-2xl border border-orange-200 shadow-sm p-6 space-y-3">
          <h2 className="text-lg font-semibold text-orange-900 flex items-center gap-2">
            <Mail className="w-4 h-4" /> Contact & Access
          </h2>
          <dl className="space-y-2 text-sm text-gray-700">
            <Row label="Email" value={user.email} />
            <Row label="Roles" value={user.roles?.join(', ')} />
            <Row label="Permissions" value={user.permissions?.slice(0, 6).join(', ')} />
          </dl>
          <p className="text-xs text-gray-500">
            Need to adjust access or contact details? Raise a request via your administrator.
          </p>
        </section>
      </div>

      <section className="bg-white rounded-2xl border border-orange-200 shadow-sm p-6 space-y-4 max-w-2xl">
        <h2 className="text-lg font-semibold text-orange-900 flex items-center gap-2">
          <Camera className="w-4 h-4" /> Profile Photo
        </h2>
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-full border-4 border-orange-200 overflow-hidden bg-orange-50 flex items-center justify-center">
            {user.imageUrl ? (
              <Image
                src={user.imageUrl}
                alt={user.fullName || user.username || 'Gate User'}
                width={80}
                height={80}
                className="w-full h-full object-cover"
                unoptimized
              />
            ) : (
              <Shield className="w-8 h-8 text-orange-400" />
            )}
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-2">Upload a recent photo to help colleagues identify you.</p>
            <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-orange-200 text-sm font-medium text-orange-700 hover:bg-orange-50 cursor-pointer">
              <Camera size={16} />
              {uploadingImage ? 'Uploading...' : 'Update Photo'}
              <input type="file" accept="image/*" className="sr-only" onChange={handleSelectNewPhoto} disabled={uploadingImage} />
            </label>
          </div>
        </div>
      </section>

      <section className="bg-white rounded-2xl border border-orange-200 shadow-sm p-6 space-y-4">
        <h2 className="text-lg font-semibold text-orange-900 flex items-center gap-2">
          <Key className="w-4 h-4" /> Change Password
        </h2>
        <form onSubmit={handlePasswordChange} className="grid gap-4 md:grid-cols-3">
          <PasswordField
            label="Current password"
            value={oldPassword}
            onChange={setOldPassword}
            show={showOldPassword}
            toggle={() => setShowOldPassword((v) => !v)}
            disabled={savingPassword}
          />
          <PasswordField
            label="New password"
            value={newPassword}
            onChange={setNewPassword}
            show={showNewPassword}
            toggle={() => setShowNewPassword((v) => !v)}
            disabled={savingPassword}
          />
          <PasswordField
            label="Confirm new password"
            value={confirmPassword}
            onChange={setConfirmPassword}
            show={showConfirmPassword}
            toggle={() => setShowConfirmPassword((v) => !v)}
            disabled={savingPassword}
          />
          <div className="md:col-span-3 flex justify-end">
            <button
              type="submit"
              disabled={savingPassword}
              className="inline-flex items-center gap-2 bg-orange-600 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-orange-700 disabled:bg-orange-400"
            >
              {savingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save size={16} />}
              {savingPassword ? 'Saving...' : 'Update password'}
            </button>
          </div>
        </form>
      </section>
    </>
  );
}

function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-gray-500 w-28 shrink-0">{label}:</span>
      <span className="text-gray-900 font-medium">{value || '—'}</span>
    </div>
  );
}

function PasswordField({
  label,
  value,
  onChange,
  show,
  toggle,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  toggle: () => void;
  disabled?: boolean;
}) {
  return (
    <label className="space-y-1 text-sm text-gray-700">
      <span className="font-medium text-gray-900">{label}</span>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full border border-orange-200 rounded-lg px-3 py-2 pr-10 focus:ring-2 focus:ring-orange-400 focus:border-orange-400 text-sm"
          disabled={disabled}
          required
        />
        <button
          type="button"
          onClick={toggle}
          className="absolute inset-y-0 right-2 flex items-center text-gray-500 hover:text-orange-700"
          tabIndex={-1}
        >
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </label>
  );
}
