'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

type FormEl = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

type RegistrationDTO = {
  id?: number;
  epfNo: string;
  attendanceNo: string;
  nameWithInitials: string;
  surname: string;
  fullName: string;
  nicNo: string;
  dateOfBirth: string; // yyyy-mm-dd
  civilStatus: string;
  gender: string;
  race: string;
  religion: string;
  bloodGroup: string;
  permanentAddress: string;
  district: string;
  mobileNo: string;
  personalEmail: string;
  cardStatus: string;
  imageUrl?: string | null;
  currentAddress: string;
  dsDivision: string;
  residencePhone: string;
  emergencyContact: string;
  workingStatus: string;
  version?: number; // optimistic locking
};

const toYYYYMMDD = (v?: string) => (v ? v.split('T')[0] : '');

export default function EditRegistrationPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id; // registration id from the URL

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [formData, setFormData] = useState<RegistrationDTO>({
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

  useEffect(() => {
    const run = async () => {
      try {
        const res = await fetch(`http://localhost:8080/api/auth/registrations/${id}`);
        if (!res.ok) throw new Error(`Load failed: ${res.status}`);
        const data: RegistrationDTO = await res.json();

        setFormData({
          id: data.id,
          epfNo: data.epfNo || '',
          attendanceNo: data.attendanceNo || '',
          nameWithInitials: data.nameWithInitials || '',
          surname: data.surname || '',
          fullName: data.fullName || '',
          nicNo: data.nicNo || '',
          dateOfBirth: toYYYYMMDD(data.dateOfBirth),
          civilStatus: data.civilStatus || '',
          gender: data.gender || '',
          race: data.race || '',
          religion: data.religion || '',
          bloodGroup: data.bloodGroup || '',
          permanentAddress: data.permanentAddress || '',
          district: data.district || '',
          mobileNo: data.mobileNo || '',
          personalEmail: data.personalEmail || '',
          cardStatus: data.cardStatus || 'Active',
          imageUrl: data.imageUrl ?? null,
          currentAddress: data.currentAddress || '',
          dsDivision: data.dsDivision || '',
          residencePhone: data.residencePhone || '',
          emergencyContact: data.emergencyContact || '',
          workingStatus: data.workingStatus || 'Employed',
          version: data.version,
        });

        setLoading(false);
      } catch (e: any) {
        setErr(e.message || 'Failed to load');
        setLoading(false);
      }
    };
    run();
  }, [id]);

  const handleChange = (e: React.ChangeEvent<FormEl>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: RegistrationDTO = {
        ...formData,
        id: Number(id),
      };
      const res = await fetch(`http://localhost:8080/api/auth/registrations/${id}`, {
        method: 'PUT', // update
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || 'Update failed');
      }
      alert('Registration updated successfully.');
      router.push('/Dewmini/Marketing/transcript');
    } catch (e: any) {
      alert(`Error: ${e.message || 'Update failed'}`);
    }
  };

  const inputCls =
    'w-full border border-gray-300 bg-white text-gray-900 placeholder-gray-500 rounded px-3 py-2 ' +
    'focus:outline-none focus:ring-2 focus:ring-blue-500';
  const selectCls =
    'w-full border border-gray-300 bg-white text-gray-900 rounded px-3 py-2 ' +
    'focus:outline-none focus:ring-2 focus:ring-blue-500';

  if (loading) return <div className="min-h-screen grid place-items-center text-gray-800">Loading…</div>;
  if (err) return <div className="min-h-screen grid place-items-center text-red-600">Error: {err}</div>;

  return (
    <div className="min-h-screen bg-gray-100 antialiased">
      {/* keep above any overlays */}
      <div className="relative z-[999] opacity-100">
        <div className="max-w-4xl mx-auto p-6">
          <div className="bg-white border border-gray-200 shadow-md rounded-xl p-6 text-gray-900">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold">Edit Registration</h1>
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
                <button type="submit" className="px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white">
                  Save Changes
                </button>
              </div>
            </form>

            <p className="text-xs text-gray-600 mt-3">Updating registration #{id}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
