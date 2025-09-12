'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

type FormEl = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

export default function UserAddPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    epfNo: '',
    username: '',
    email: '',
    password: '',
    fullName: '',
    department: '',
    designation: '',
    contactNo: '',
    company: '',
    copyFromPrivileges: '',
    remarks: '',
    active: true,
    role: 'USER', // ADMIN / STAFF / USER
  });

  const [showPwd, setShowPwd] = useState(false);
  const [submitting, setSubmitting] = useState(false);

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
      // Only send fields your backend expects for creation.
      const payload = {
        epfNo: formData.epfNo.trim(),
        username: formData.username.trim(),
        email: formData.email.trim(),
        password: formData.password, // hashed on server
        fullName: formData.fullName || null,
        department: formData.department || null,
        designation: formData.designation || null,
        contactNo: formData.contactNo || null,
        company: formData.company || null,
        copyFromPrivileges: formData.copyFromPrivileges || null,
        remarks: formData.remarks || null,
        active: formData.active,
        role: formData.role, // "ADMIN" | "STAFF" | "USER"
      };

      const res = await fetch('http://localhost:8080/api/auth/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || 'Failed to create user');
      }

      alert('User created successfully!');
      router.push('/Dewmini/Marketing'); // back to list
    } catch (err: any) {
      alert(`Error: ${err?.message || 'Failed to create user'}`);
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

  return (
    <div className="min-h-screen bg-gray-100 antialiased">
      {/* Start a new stacking context, force full opacity, and put above any overlay */}
      <div className="relative z-50 opacity-100">
        <div className="max-w-4xl mx-auto p-6">
          <div className="bg-white border border-gray-200 shadow-md rounded-xl p-6 text-gray-900">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold">Add New App User</h1>
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
                <label className={labelCls}>Password *</label>
                <div className="relative">
                  <input
                    type={showPwd ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className={`${inputCls} pr-16`}
                    required
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
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="Full Name"
                  className={inputCls}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className={labelCls}>Contact No</label>
                <input
                  name="contactNo"
                  value={formData.contactNo}
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
                  value={formData.department}
                  onChange={handleChange}
                  placeholder="Department"
                  className={inputCls}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className={labelCls}>Designation</label>
                <input
                  name="designation"
                  value={formData.designation}
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
                  value={formData.company}
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
                <label className={labelCls}>Copy From Privileges (username/EPF)</label>
                <input
                  name="copyFromPrivileges"
                  value={formData.copyFromPrivileges}
                  onChange={handleChange}
                  placeholder="e.g., johndoe or 12345"
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

              {/* Remarks (full width) */}
              <div className="md:col-span-2 flex flex-col gap-1">
                <label className={labelCls}>Remarks</label>
                <textarea
                  name="remarks"
                  value={formData.remarks}
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
                  {submitting ? 'Saving…' : 'Submit'}
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
