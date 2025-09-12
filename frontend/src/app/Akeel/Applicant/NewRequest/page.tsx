'use client';

import * as React from 'react';
import ApplicantSidebar from '../components/ApplicantSidebar';
import { useForm } from 'react-hook-form';
import { createUsageRequest, type CreateUsageRequestDto } from '../../Transport/services/usageService';

function todayUtc() {
  const d = new Date();
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

const getStoredEmpId = () =>
  (typeof window !== 'undefined'
    ? (localStorage.getItem('employeeId') || localStorage.getItem('actor') || '')
    : '');

type FormValues = CreateUsageRequestDto & {
  travelWithOfficer: boolean;
  officerName?: string;
  officerId?: string;
  officerPhone?: string;
};

export default function ApplicantNewRequestPage() {
  const {
    register, handleSubmit, reset, setValue, watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: {
      applicantName: '',
      employeeId: '',               // hidden, filled from localStorage
      department: '',
      dateOfTravel: todayUtc(),
      timeFrom: '',
      timeTo: '',
      fromLocation: '',
      toLocation: '',
      officialDescription: '',
      goods: '',
      travelWithOfficer: false,
      officerName: '',
      officerId: '',
      officerPhone: '',
    },
  });

  const withOfficer = watch('travelWithOfficer');

  const [msg, setMsg] = React.useState<string | null>(null);
  const [err, setErr] = React.useState<string | null>(null);

  // Fill hidden employeeId from storage
  React.useEffect(() => {
    const eid = getStoredEmpId();
    if (eid) setValue('employeeId', eid);
  }, [setValue]);

  const onSubmit = async (data: FormValues) => {
    setMsg(null); setErr(null);
    try {
      if (data.timeFrom === data.timeTo) throw new Error('timeFrom must differ from timeTo');

      const { travelWithOfficer, officerName, officerId, officerPhone, ...base } = data;

      // Append officer details to description (until backend supports dedicated fields)
      let officialDescription = (base.officialDescription || '').trim();
      if (travelWithOfficer) {
        const officerLine =
          `Travelling Officer: ${officerName || '-'}${officerId ? ` (Employee ID: ${officerId})` : ''}${officerPhone ? `, Phone: ${officerPhone}` : ''}`;
        officialDescription = officialDescription ? `${officialDescription}\n${officerLine}` : officerLine;
      }

      const payload: CreateUsageRequestDto = { ...base, officialDescription };
      const saved = await createUsageRequest(payload);

      // Keep employee id in storage for future requests
      if (typeof window !== 'undefined' && base.employeeId) {
        localStorage.setItem('employeeId', base.employeeId);
        localStorage.setItem('actor', base.employeeId);
        localStorage.setItem('role', 'APPLICANT');
      }

      setMsg(`Request ${saved.requestCode} submitted.`);
      reset({
        ...data,
        timeFrom: '',
        timeTo: '',
        fromLocation: '',
        toLocation: '',
        officialDescription: '',
        goods: '',
        travelWithOfficer: false,
        officerName: '',
        officerId: '',
        officerPhone: '',
      });
    } catch (e: any) {
      setErr(e.message || 'Failed to save');
    }
  };

  const L = (s: string) => <label className="block text-[12px] font-medium text-orange-800 mb-1">{s}</label>;
  const errCls = (b: boolean) =>
    `w-full border rounded px-3 py-2 text-[13px] ${b ? 'border-red-500' : 'border-orange-200'}`;

  return (
    <div className="flex min-h-screen bg-orange-50">
      <ApplicantSidebar />
      <main className="p-4 flex-1">
        <h1 className="text-base md:text-lg font-bold text-orange-900 mb-2">New Vehicle Request</h1>

        {/* hidden employeeId field (kept for submission) */}
        <input type="hidden" {...register('employeeId', { required: true })} />

        {msg && <div className="mb-3 text-xs md:text-sm rounded bg-green-50 border border-green-200 text-green-800 px-3 py-2">{msg}</div>}
        {err && <div className="mb-3 text-xs md:text-sm rounded bg-red-50 border border-red-200 text-red-800 px-3 py-2">{err}</div>}

        <form className="bg-white rounded-xl border border-orange-200 p-4 md:p-5 space-y-4" onSubmit={handleSubmit(onSubmit)}>
          {/* Applicant (Employee ID removed from UI) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            <div>
              {L('Applicant Name *')}
              <input className={errCls(!!errors.applicantName)} {...register('applicantName', { required: 'Required', maxLength: 100 })} />
            </div>
            <div>
              {L('Department *')}
              <input className={errCls(!!errors.department)} {...register('department', { required: 'Required', maxLength: 100 })} />
            </div>
          </div>

          {/* Dates & Times */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 md:gap-4">
            <div>
              {L('Date of Travel *')}
              <input type="date" min={todayUtc()} className={errCls(!!errors.dateOfTravel)} {...register('dateOfTravel', { required: 'Required' })} />
            </div>
            <div>
              {L('Time From *')}
              <input type="time" className={errCls(!!errors.timeFrom)} {...register('timeFrom', { required: 'Required', pattern: { value: /^\d{2}:\d{2}$/, message: 'HH:mm' } })} />
            </div>
            <div>
              {L('Time To *')}
              <input type="time" className={errCls(!!errors.timeTo)} {...register('timeTo', { required: 'Required', pattern: { value: /^\d{2}:\d{2}$/, message: 'HH:mm' } })} />
            </div>
            <div className="hidden md:flex items-end text-[11px] text-orange-700">
              <div className="bg-orange-50 border border-orange-200 rounded px-2 py-2 w-full text-center">Example: 05:00 — 18:00</div>
            </div>
          </div>

          {/* Route */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            <div>
              {L('From Location *')}
              <input className={errCls(!!errors.fromLocation)} {...register('fromLocation', { required: 'Required', maxLength: 200 })} />
            </div>
            <div>
              {L('To Location *')}
              <input className={errCls(!!errors.toLocation)} {...register('toLocation', { required: 'Required', maxLength: 200 })} />
            </div>
          </div>

          {/* Purpose / Goods */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            <div>
              {L('Official Trip Description')}
              <textarea rows={3} className="w-full border border-orange-200 rounded px-3 py-2 text-[13px]" {...register('officialDescription', { maxLength: 1000 })} />
            </div>
            <div>
              {L('Goods being transported (if any)')}
              <textarea rows={3} className="w-full border border-orange-200 rounded px-3 py-2 text-[13px]" {...register('goods', { maxLength: 500 })} />
            </div>
          </div>

          {/* Travelling Officer */}
          <div className="border border-orange-200 rounded-lg p-3 md:p-4 bg-orange-50/40">
            <label className="flex items-center gap-2 text-sm text-orange-900 font-medium">
              <input type="checkbox" {...register('travelWithOfficer')} />
              Travelling with Officer
            </label>

            {withOfficer && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 mt-3">
                <div>
                  {L('Name of Travelling Officer *')}
                  <input
                    className={errCls(!!errors.officerName)}
                    {...register('officerName', { required: 'Required when travelling with officer', maxLength: 100 })}
                  />
                </div>
                <div>
                  {L('Travelling Officer Employee ID')}
                  <input className={errCls(false)} placeholder="e.g., E12345" {...register('officerId', { maxLength: 50 })} />
                </div>
                <div>
                  {L('Travelling Officer Phone')}
                  <input className={errCls(false)} {...register('officerPhone', { maxLength: 20 })} />
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <button type="reset" className="px-3 md:px-4 py-2 rounded border text-[13px]">Clear</button>
            <button type="submit" disabled={isSubmitting} className="px-3 md:px-4 py-2 rounded bg-orange-600 text-white disabled:opacity-60 text-[13px]">
              {isSubmitting ? 'Saving…' : 'Submit Request'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
