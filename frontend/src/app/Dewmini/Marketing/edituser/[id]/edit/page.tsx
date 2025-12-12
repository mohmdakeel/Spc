'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

type FormEl = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

type UserDTO = {
  id: number;
  epfNo: string;
  username: string;
  email: string;
  password?: string; // optional on edit
  fullName?: string;
  department?: string;
  designation?: string;
  contactNo?: string;
  company?: string;
  copyFromPrivileges?: string;
  remarks?: string;
  active: boolean;
  role: 'ADMIN' | 'STAFF' | 'USER';
};

export default function UserEditPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = useMemo(() => params?.id, [params]);

  const [formData, setFormData] = useState<UserDTO>({
    id: 0,
    epfNo: '',
    username: '',
    email: '',
    password: '', // keep empty; only sent if changed
    fullName: '',
    department: '',
    designation: '',
    contactNo: '',
    company: '',
    copyFromPrivileges: '',
    remarks: '',
    active: true,
    role: 'USER',
  });

  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- Adjust these if your endpoints differ ---
  const API_BASE = 'http://localhost:8080';
  // GET one user by id
  const GET_URL = `${API_BASE}/api/auth/users/${id}`;
  // UPDATE user by id (use /api/auth/register/${id} if your API exposes it there)
  const PUT_URL = `${API_BASE}/api/auth/users/${id}`;

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(GET_URL, { cache: 'no-store' });
        if (!res.ok) {
          const msg = await res.text();
          throw new Error(msg || 'Failed to load user');
        }
        const data = await res.json();

        // normalize incoming payload to our form shape
        setFormData({
          id: data.id,
          epfNo: data.epfNo ?? '',
          username: data.username ?? '',
          email: data.email ?? '',
          password: '', // do not prefill
          fullName: data.fullName ?? '',
          department: data.department ?? '',
          designation: data.designation ?? '',
          contactNo: data.contactNo ?? '',
          company: data.company ?? '',
          copyFromPrivileges: data.copyFromPrivileges ?? '',
          remarks: data.remarks ?? '',
          active: Boolean(data.active),
          role: (data.role as 'ADMIN' | 'STAFF' | 'USER') ?? 'USER',
        });
        setError(null);
      } catch (e: any) {
        setError(e?.message || 'Failed to load user');
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleChange = (e: React.ChangeEvent<FormEl>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckbox = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      // Build payload and exclude empty password so backend won’t overwrite it.
      const {
        id: _omitId,
        password,
        ...rest
      } = formData;
      void _omitId;

      const payload: any = { ...rest };
      if (password && password.trim().length > 0) {
        payload.password = password;
      }

      const res = await fetch(PUT_URL, {
        method: 'PUT', // or 'PATCH' based on your API
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || 'Failed to update user');
      }

      alert('User updated successfully!');
      router.push('/Dewmini/Marketing'); // back to list
    } catch (err: any) {
      alert(`Error: ${err?.message || 'Failed to update user'}`);
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls =
    'w-full border border-gray-300 bg-white text-gray-900 placeholder-gray-500 rounded px-3 py-2 ' +
    'focus:outline-none focus:ring-2 focus:ring-blue-500';

  const selectCls =
    'w-full border border-gray-300 bg-white text-gray-900 rounded px-3 py-2 ' +
    'focus:outline-none focus:ring-2 focus:ring-blue-500';

  const labelCls = 'text-sm font-medium text-gray-700';

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 antialiased">
        <div className="max-w-4xl mx-auto p-6">
          <div className="bg-white border border-gray-200 shadow-md rounded-xl p-6">
            <p className="text-gray-700">Loading user…</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 antialiased">
        <div className="max-w-4xl mx-auto p-6">
          <div className="bg-white border border-red-200 shadow-md rounded-xl p-6">
            <p className="text-red-700">Error: {error}</p>
            <button
              onClick={() => router.refresh()}
              className="mt-4 px-4 py-2 rounded-lg border hover:bg-gray-50"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 antialiased">
      <div className="relative z-50 opacity-100">
        <div className="max-w-4xl mx-auto p-6">
          <div className="bg-white border border-gray-200 shadow-md rounded-xl p-6 text-gray-900">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold">Edit User (ID: {id})</h1>
              <button
                onClick={() => router.push('/Dewmini/Marketing')}
                className="px-4 py-2 rounded-lg border hover:bg-gray-50"
                type="button"
              >
                Back to List
              </button>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* EPF / Username */}
              <div className="flex flex-col gap-1">
                <label className={labelCls}>EPF No *</label>
                <input
                  name="epfNo"
                  value={formData.epfNo}
                  onChange={handleChange}
                  placeholder="EPF No"
                  className={inputCls}
                  required
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className={labelCls}>Username *</label>
                <input
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="Username"
                  className={inputCls}
                  required
                />
              </div>

              {/* Email / Password */}
              <div className="flex flex-col gap-1">
                <label className={labelCls}>Email *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="name@company.com"
                  className={inputCls}
                  required
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className={labelCls}>Password (leave blank to keep same)</label>
                <div className="relative">
                  <input
                    type={showPwd ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className={`${inputCls} pr-16`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd(s => !s)}
                    className="absolute top-1/2 -translate-y-1/2 right-2 text-sm px-2 py-1 rounded border hover:bg-gray-50"
                  >
                    {showPwd ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              {/* Full name / Contact */}
              <div className="flex flex-col gap-1">
                <label className={labelCls}>Full Name</label>
                <input
                  name="fullName"
                  value={formData.fullName ?? ''}
                  onChange={handleChange}
                  placeholder="Full Name"
                  className={inputCls}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className={labelCls}>Contact No</label>
                <input
                  name="contactNo"
                  value={formData.contactNo ?? ''}
                  onChange={handleChange}
                  placeholder="+94xxxxxxxxx"
                  className={inputCls}
                />
              </div>

              {/* Department / Designation */}
              <div className="flex flex-col gap-1">
                <label className={labelCls}>Department</label>
                <input
                  name="department"
                  value={formData.department ?? ''}
                  onChange={handleChange}
                  placeholder="Department"
                  className={inputCls}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className={labelCls}>Designation</label>
                <input
                  name="designation"
                  value={formData.designation ?? ''}
                  onChange={handleChange}
                  placeholder="Designation"
                  className={inputCls}
                />
              </div>

              {/* Company / Role */}
              <div className="flex flex-col gap-1">
                <label className={labelCls}>Company</label>
                <input
                  name="company"
                  value={formData.company ?? ''}
                  onChange={handleChange}
                  placeholder="Company"
                  className={inputCls}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className={labelCls}>Role *</label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className={selectCls}
                  required
                >
                  <option value="ADMIN">ADMIN</option>
                  <option value="STAFF">STAFF</option>
                  <option value="USER">USER</option>
                </select>
              </div>

              {/* Copy privileges / Active */}
              <div className="flex flex-col gap-1">
                <label className={labelCls}>Copy From Privileges</label>
                <input
                  name="copyFromPrivileges"
                  value={formData.copyFromPrivileges ?? ''}
                  onChange={handleChange}
                  placeholder="e.g., johndoe or EPF"
                  className={inputCls}
                />
              </div>

              <div className="flex items-center gap-2 pt-7">
                <input
                  id="active"
                  type="checkbox"
                  name="active"
                  checked={formData.active}
                  onChange={handleCheckbox}
                  className="h-4 w-4"
                />
                <label htmlFor="active" className={labelCls}>Active</label>
              </div>

              {/* Remarks */}
              <div className="md:col-span-2 flex flex-col gap-1">
                <label className={labelCls}>Remarks</label>
                <textarea
                  name="remarks"
                  value={formData.remarks ?? ''}
                  onChange={handleChange}
                  placeholder="Notes / remarks"
                  className={`${inputCls} min-h-[96px]`}
                />
              </div>

              {/* Actions */}
              <div className="md:col-span-2 flex items-center justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => router.push('/Dewmini/Marketing')}
                  className="px-5 py-2 rounded-lg border hover:bg-gray-50"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white disabled:opacity-70"
                  disabled={submitting}
                >
                  {submitting ? 'Saving…' : 'Update'}
                </button>
              </div>
            </form>

            <p className="text-xs text-gray-600 mt-3">Fields marked with * are required.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
