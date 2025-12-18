'use client';

import { useState } from 'react';
import { useAuth } from '../../../../../hooks/useAuth';
import api from '../../../../../lib/api';
import {
  Camera,
  Mail,
  User,
  Building2,
  Save,
  Key,
  Eye,
  EyeOff,
  Loader2,
} from 'lucide-react';

export default function TransportProfilePage() {
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

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="bg-white rounded-xl border border-orange-200 p-6 text-sm text-gray-600">
        Unable to load profile information right now.
      </div>
    );
  }

  const handlePasswordChange = async (e: React.FormEvent<HTMLFormElement>) => {
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

  return (
    <div className="space-y-4">
      <header className="space-y-1">
        <p className="text-xs font-semibold text-orange-700 uppercase tracking-wide">My profile</p>
        <h1 className="text-2xl font-bold text-orange-900">Transport workspace</h1>
        <p className="text-sm text-gray-600">
          Manage your profile, contact preferences, and credentials for transport operations.
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
            <Row label="Full name" value={user.fullName || user.name} />
            <Row label="Username" value={user.username} />
            <Row label="Employee ID" value={user.employeeId || user.epfNo} />
            <Row label="Department" value={user.department} />
          </dl>
        </section>

        <section className="bg-white rounded-2xl border border-orange-200 shadow-sm p-6 space-y-3">
          <h2 className="text-lg font-semibold text-orange-900 flex items-center gap-2">
            <Mail className="w-4 h-4" /> Contact & Access
          </h2>
          <dl className="space-y-2 text-sm text-gray-700">
            <Row label="Email" value={user.email} />
            <Row label="Phone" value={(user as any)?.phone} />
            <Row label="Office" value={(user as any)?.office || (user as any)?.location} />
          </dl>
          <p className="text-xs text-gray-500">
            To update access or contact details, raise a request with the HR or Auth team.
          </p>
        </section>
      </div>

      <section className="bg-white rounded-2xl border border-orange-200 shadow-sm p-6 space-y-4">
        <h2 className="text-lg font-semibold text-orange-900 flex items-center gap-2">
          <Camera className="w-4 h-4" /> Profile Photo
        </h2>
        <div className="flex flex-wrap items-center gap-4">
          <div className="w-24 h-24 rounded-full border-4 border-orange-200 overflow-hidden bg-orange-50 flex items-center justify-center">
            {user.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.imageUrl}
                alt={user.fullName || user.username || 'Transport user'}
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="w-10 h-10 text-orange-400" />
            )}
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-2">Upload a clear headshot to personalise your workspace.</p>
            <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-orange-200 text-sm font-medium text-orange-700 hover:bg-orange-50 cursor-pointer">
              <Camera size={16} />
              {uploadingImage ? 'Uploading...' : 'Update Photo'}
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={handleSelectNewPhoto}
                disabled={uploadingImage}
              />
            </label>
          </div>
        </div>
      </section>

      <section className="bg-white rounded-2xl border border-orange-200 shadow-sm p-6 space-y-4">
        <h2 className="text-lg font-semibold text-orange-900 flex items-center gap-2">
          <Building2 className="w-4 h-4" /> Workspace summary
        </h2>
        <div className="grid sm:grid-cols-2 gap-3 text-sm text-gray-700">
          <Row label="Roles" value={Array.isArray(user.roles) ? user.roles.join(', ') : ''} />
          <Row label="Permissions" value={Array.isArray((user as any)?.permissions) ? (user as any).permissions.join(', ') : ''} />
          <Row label="Location" value={(user as any)?.location || (user as any)?.office} />
          <Row label="Status" value={(user as any)?.status} />
        </div>
      </section>

      <section className="bg-white rounded-2xl border border-orange-200 shadow-sm p-6 space-y-4">
        <h2 className="text-lg font-semibold text-orange-900 flex items-center gap-2">
          <Key className="w-4 h-4" /> Change password
        </h2>
        <form onSubmit={handlePasswordChange} className="grid gap-3 sm:grid-cols-2">
          <PasswordField
            label="Current password"
            value={oldPassword}
            onChange={setOldPassword}
            show={showOldPassword}
            toggleShow={() => setShowOldPassword((s) => !s)}
          />
          <PasswordField
            label="New password"
            value={newPassword}
            onChange={setNewPassword}
            show={showNewPassword}
            toggleShow={() => setShowNewPassword((s) => !s)}
          />
          <PasswordField
            label="Confirm new password"
            value={confirmPassword}
            onChange={setConfirmPassword}
            show={showConfirmPassword}
            toggleShow={() => setShowConfirmPassword((s) => !s)}
          />

          <div className="sm:col-span-2 flex justify-end">
            <button
              type="submit"
              disabled={savingPassword}
              className="inline-flex items-center gap-2 bg-orange-600 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-orange-700 disabled:bg-orange-400"
            >
              {savingPassword && <Loader2 className="w-4 h-4 animate-spin" />}
              <Save size={16} />
              {savingPassword ? 'Updating…' : 'Update password'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

function Row({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-xs uppercase tracking-wide text-gray-500">{label}</span>
      <span className="font-medium text-gray-900 text-right">{value || '—'}</span>
    </div>
  );
}

function PasswordField({
  label,
  value,
  onChange,
  show,
  toggleShow,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  toggleShow: () => void;
}) {
  return (
    <label className="space-y-1 text-sm">
      <span className="font-medium text-gray-800">{label}</span>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-lg border border-orange-200 px-3 py-2 text-sm focus:ring-2 focus:ring-orange-300 focus:border-orange-400"
          required
        />
        <button
          type="button"
          onClick={toggleShow}
          className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700"
        >
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </label>
  );
}
