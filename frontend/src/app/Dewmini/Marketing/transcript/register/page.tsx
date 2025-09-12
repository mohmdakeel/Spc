'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

type FormEl = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

export default function RegisterFormPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    epfNo: '',
    attendanceNo: '',
    nameWithInitials: '',
    surname: '',
    fullName: '',
    nicNo: '',
    dateOfBirth: '',
    civilStatus: '',
    gender: '',
    race: '',
    religion: '',
    bloodGroup: '',
    permanentAddress: '',
    district: '',
    mobileNo: '',
    personalEmail: '',
    cardStatus: 'Active',
    currentAddress: '',
    dsDivision: '',
    residencePhone: '',
    emergencyContact: '',
    workingStatus: 'Employed',
  });

  const handleChange = (e: React.ChangeEvent<FormEl>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:8080/api/auth/registrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || 'Failed to register');
      }
      alert('Registration successful!');
      router.push('/Dewmini/Marketing/transcript');
    } catch (err: any) {
      alert(`Error: ${err.message || 'Failed to register'}`);
    }
  };

  const inputCls =
    'w-full border border-gray-300 bg-white text-gray-900 placeholder-gray-500 rounded px-3 py-2 ' +
    'focus:outline-none focus:ring-2 focus:ring-blue-500';

  const selectCls =
    'w-full border border-gray-300 bg-white text-gray-900 rounded px-3 py-2 ' +
    'focus:outline-none focus:ring-2 focus:ring-blue-500';

  return (
    <div className="min-h-screen bg-gray-100 antialiased">
      {/* Start a new stacking context, force full opacity, and put above any overlay */}
      <div className="relative z-50 opacity-100">
        <div className="max-w-4xl mx-auto p-6">
          <div className="bg-white border border-gray-200 shadow-md rounded-xl p-6 text-gray-900">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold">Register New User</h1>
              <button
                onClick={() => router.push('/Dewmini/Marketing')}
                className="px-4 py-2 rounded-lg border hover:bg-gray-50"
                type="button"
              >
                Back to List
              </button>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input name="epfNo" value={formData.epfNo} onChange={handleChange} placeholder="EPF No*" className={inputCls} required />
              <input name="attendanceNo" value={formData.attendanceNo} onChange={handleChange} placeholder="Attendance No" className={inputCls} />

              <input name="nameWithInitials" value={formData.nameWithInitials} onChange={handleChange} placeholder="Name with Initials" className={inputCls} />
              <input name="surname" value={formData.surname} onChange={handleChange} placeholder="Surname" className={inputCls} />

              <input name="fullName" value={formData.fullName} onChange={handleChange} placeholder="Full Name*" className={inputCls} required />
              <input name="nicNo" value={formData.nicNo} onChange={handleChange} placeholder="NIC No" className={inputCls} />

              <input type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} className={inputCls} />
              <select name="civilStatus" value={formData.civilStatus} onChange={handleChange} className={selectCls}>
                <option value="">Civil Status</option>
                <option>Single</option>
                <option>Married</option>
                <option>Divorced</option>
                <option>Widowed</option>
              </select>

              <select name="gender" value={formData.gender} onChange={handleChange} className={selectCls}>
                <option value="">Gender</option>
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
              </select>
              <input name="race" value={formData.race} onChange={handleChange} placeholder="Race" className={inputCls} />

              <input name="religion" value={formData.religion} onChange={handleChange} placeholder="Religion" className={inputCls} />
              <input name="bloodGroup" value={formData.bloodGroup} onChange={handleChange} placeholder="Blood Group (e.g., B+)" className={inputCls} />

              <input name="permanentAddress" value={formData.permanentAddress} onChange={handleChange} placeholder="Permanent Address" className={`${inputCls} md:col-span-2`} />
              <input name="currentAddress" value={formData.currentAddress} onChange={handleChange} placeholder="Current Address" className={`${inputCls} md:col-span-2`} />

              <input name="district" value={formData.district} onChange={handleChange} placeholder="District" className={inputCls} />
              <input name="dsDivision" value={formData.dsDivision} onChange={handleChange} placeholder="DS Division" className={inputCls} />

              <input name="mobileNo" value={formData.mobileNo} onChange={handleChange} placeholder="Mobile No" className={inputCls} />
              <input name="residencePhone" value={formData.residencePhone} onChange={handleChange} placeholder="Residence Phone" className={inputCls} />

              <input type="email" name="personalEmail" value={formData.personalEmail} onChange={handleChange} placeholder="Personal Email" className={inputCls} />
              <select name="cardStatus" value={formData.cardStatus} onChange={handleChange} className={selectCls}>
                <option>Active</option>
                <option>Inactive</option>
                <option>Pending</option>
              </select>

              <input name="emergencyContact" value={formData.emergencyContact} onChange={handleChange} placeholder="Emergency Contact" className={inputCls} />
              <select name="workingStatus" value={formData.workingStatus} onChange={handleChange} className={selectCls}>
                <option>Employed</option>
                <option>Unemployed</option>
                <option>On Leave</option>
                <option>Retired</option>
              </select>

              <div className="md:col-span-2 flex items-center justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => router.push('/Dewmini/Marketing/transcript')}
                  className="px-5 py-2 rounded-lg border hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white"
                >
                  Submit
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
