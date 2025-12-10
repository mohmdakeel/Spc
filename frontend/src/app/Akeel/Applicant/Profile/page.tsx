'use client';

import { useState } from 'react';
import { useAuth } from '../../../../../hooks/useAuth';
import api from '../../../../../lib/api';
import {
  Camera,
  Mail,
  User,
  Building2,
  Phone,
  MapPin,
  Save,
  Key,
  Eye,
  EyeOff,
  Loader2,
} from 'lucide-react';

export default function ApplicantProfilePage() {
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
        <h1 className="text-2xl font-bold text-orange-900">Applicant workspace</h1>
        <p className="text-sm text-gray-600">
          Manage your profile, contact preferences, and credentials.
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
                alt={user.fullName || user.username || 'Applicant'}
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
        <div className="grid gap-3 md:grid-cols-3 text-sm text-gray-700">
          <Summary
            icon={<MapPin className="w-4 h-4 text-orange-500" />}
            label="Default route"
            value={(user as any)?.defaultRoute || 'Not set'}
          />
          <Summary
            icon={<Phone className="w-4 h-4 text-orange-500" />}
            label="Emergency contact"
            value={(user as any)?.emergencyContact || 'Not provided'}
          />
          <Summary
            icon={<Mail className="w-4 h-4 text-orange-500" />}
            label="Notifications"
            value="Managed under Settings"
          />
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
    </div>
  );
}

function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex justify-between">
      <dt className="font-medium text-gray-500">{label}</dt>
      <dd className="text-right text-gray-800">{value || '—'}</dd>
    </div>
  );
}

function Summary({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-xl border border-orange-100 bg-orange-50/50">
      <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center shadow-sm">{icon}</div>
      <div>
        <p className="text-xs uppercase tracking-wide text-gray-500">{label}</p>
        <p className="text-sm font-semibold text-orange-900">{value}</p>
      </div>
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
  onChange: (val: string) => void;
  show: boolean;
  toggle: () => void;
  disabled: boolean;
}) {
  return (
    <label className="text-sm text-gray-700 space-y-1">
      <span className="font-semibold">{label}</span>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-lg border border-orange-200 px-3 py-2 pr-10 focus:border-orange-400 focus:ring-2 focus:ring-orange-200 text-sm"
          disabled={disabled}
        />
        <button
          type="button"
          onClick={toggle}
          className="absolute inset-y-0 right-3 flex items-center text-gray-500"
          tabIndex={-1}
        >
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </label>
  );
}
