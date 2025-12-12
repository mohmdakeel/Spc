'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';
import { useForm } from 'react-hook-form';
import { ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../../../../hooks/useAuth';
import { login } from '../../../../../lib/auth';
import api from '../../../../../lib/api';
import { readCache, writeCache } from '../../../../../lib/cache';
import type { Registration } from '../../../../../types';
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

const REQUESTS_ROUTE = '/Akeel/Applicant/MyRequests';

/* shared phone sanitizer */
const cleanPhone = (p?: string) =>
  (p ?? '')
    .replace(/[^\d+()\-\s./]/g, '') // allow digits + ( ) - / . and spaces
    .replace(/\s{2,}/g, ' ')
    .trim();

export default function ApplicantNewRequestPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [pendingData, setPendingData] = React.useState<FormValues | null>(null);
  const [verifyOpen, setVerifyOpen] = React.useState(false);
  const [accountPassword, setAccountPassword] = React.useState('');
  const [showAccountPassword, setShowAccountPassword] = React.useState(false);
  const [verifyError, setVerifyError] = React.useState<string | null>(null);
  const [verifying, setVerifying] = React.useState(false);
  const cachedEmployees = readCache<Registration[]>('cache:auth:employees') || [];
  const [employees, setEmployees] = React.useState<Registration[]>(cachedEmployees);
  const [employeesLoading, setEmployeesLoading] = React.useState(!cachedEmployees.length);
  const [employeesError, setEmployeesError] = React.useState<string | null>(null);
  const [selectedApplicant, setSelectedApplicant] = React.useState<Registration | null>(null);
  const [selectedOfficer, setSelectedOfficer] = React.useState<Registration | null>(null);
  const [applicantDropdownOpen, setApplicantDropdownOpen] = React.useState(false);
  const [officerDropdownOpen, setOfficerDropdownOpen] = React.useState(false);
  const applicantDropdownTimeout = React.useRef<NodeJS.Timeout | null>(null);
  const officerDropdownTimeout = React.useRef<NodeJS.Timeout | null>(null);

  const {
    register, handleSubmit, reset, setValue, watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: {
      applicantName: '',
      employeeId: '',
      department: '',
      dateOfTravel: todayUtc(),
      returnDate: '',
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
  const [err, setErr] = React.useState<string | null>(null);
  const applicantNameField = register('applicantName', { required: 'Required', maxLength: 100 });
  const officerNameField = register('officerName', {
    required: withOfficer ? 'Required when travelling with officer' : undefined,
    maxLength: 100,
  });
  const applicantNameValue = watch('applicantName') || '';
  const officerNameValue = watch('officerName') || '';
  const dateFromValue = watch('dateOfTravel');
  const returnDateValue = watch('returnDate');

  // confirmation modal state
  const [confirm, setConfirm] = React.useState<{ code: string; when: string } | null>(null);
  const redirectTimer = React.useRef<NodeJS.Timeout | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    const loadEmployees = async () => {
      setEmployeesLoading(true);
      setEmployeesError(null);
      try {
        const { data } = await api.get('/registrations');
        if (cancelled) return;
        const list = Array.isArray(data) ? data : [];
        setEmployees(list);
        writeCache('cache:auth:employees', list);
      } catch (error: any) {
        if (cancelled) return;
        const message = error?.response?.data?.message || error?.message || 'Unable to load employees';
        setEmployeesError(message);
      } finally {
        if (!cancelled) setEmployeesLoading(false);
      }
    };
    loadEmployees();
    return () => { cancelled = true; };
  }, []);

  React.useEffect(() => {
    return () => {
      if (applicantDropdownTimeout.current) clearTimeout(applicantDropdownTimeout.current);
      if (officerDropdownTimeout.current) clearTimeout(officerDropdownTimeout.current);
    };
  }, []);

  const filterEmployees = React.useCallback((term: string) => {
    const q = (term || '').trim().toLowerCase();
    const pool = employees || [];
    if (!q) return pool.slice(0, 8);
    return pool
      .filter((reg) => {
        const tokens = [
          reg.fullName,
          reg.nameWithInitials,
          reg.epfNo,
          reg.department,
          reg.nicNo,
          reg.mobileNo,
        ];
        return tokens.some((token) => token?.toLowerCase().includes(q));
      })
      .slice(0, 8);
  }, [employees]);

  const applicantMatches = React.useMemo(
    () => (applicantDropdownOpen ? filterEmployees(applicantNameValue) : []),
    [applicantDropdownOpen, filterEmployees, applicantNameValue]
  );

  const officerMatches = React.useMemo(
    () => (officerDropdownOpen ? filterEmployees(officerNameValue) : []),
    [officerDropdownOpen, filterEmployees, officerNameValue]
  );

  const handleSelectApplicant = React.useCallback((reg: Registration) => {
    const displayName = (reg.fullName || reg.nameWithInitials || reg.epfNo || '').trim() || 'Unnamed employee';
    setSelectedApplicant(reg);
    setValue('applicantName', displayName, { shouldDirty: true, shouldValidate: true });
    setValue('employeeId', reg.epfNo || '', { shouldDirty: true, shouldValidate: true });
    setValue('department', reg.department || '', { shouldDirty: true, shouldValidate: true });
    setApplicantDropdownOpen(false);
  }, [setValue]);

  const handleSelectOfficer = React.useCallback((reg: Registration) => {
    const displayName = (reg.fullName || reg.nameWithInitials || reg.epfNo || '').trim() || 'Unnamed employee';
    setSelectedOfficer(reg);
    setValue('officerName', displayName, { shouldDirty: true, shouldValidate: true });
    setValue('officerId', reg.epfNo || '', { shouldDirty: true, shouldValidate: true });
    setValue('officerPhone', cleanPhone(reg.mobileNo) || '', { shouldDirty: true, shouldValidate: true });
    setOfficerDropdownOpen(false);
  }, [setValue]);

  const closeVerifyModal = React.useCallback(() => {
    setVerifyOpen(false);
    setAccountPassword('');
    setVerifyError(null);
    setPendingData(null);
  }, []);

  const handleClear = React.useCallback(() => {
    reset(undefined);
    setErr(null);
    closeVerifyModal();
    setSelectedApplicant(null);
    setSelectedOfficer(null);
    setApplicantDropdownOpen(false);
    setOfficerDropdownOpen(false);
  }, [closeVerifyModal, reset]);

  React.useEffect(() => {
    const eid = getStoredEmpId();
    if (eid) setValue('employeeId', eid);
  }, [setValue]);

  React.useEffect(() => {
    if (!dateFromValue || !returnDateValue) return;
    if (returnDateValue < dateFromValue) {
      setValue('returnDate', dateFromValue, { shouldDirty: true, shouldValidate: true });
    }
  }, [dateFromValue, returnDateValue, setValue]);

  React.useEffect(() => {
    if (!withOfficer) {
      setSelectedOfficer(null);
      setOfficerDropdownOpen(false);
    }
  }, [withOfficer]);

  const processSubmission = React.useCallback(
    async (data: FormValues) => {
      setErr(null);
      if (data.timeFrom === data.timeTo) {
        const message = 'timeFrom must differ from timeTo';
        setErr(message);
        throw new Error(message);
      }

      const { travelWithOfficer, officerName, officerId, officerPhone, returnDate, ...base } = data;

      if (returnDate && returnDate < data.dateOfTravel) {
        const message = 'Return date must be the same day or after the start date';
        setErr(message);
        throw new Error(message);
      }

      const sanitizedPhone = cleanPhone(officerPhone);
      let officialDescription = (base.officialDescription || '').trim();
      if (travelWithOfficer) {
        const officerLine =
          `Travelling Officer: ${officerName || '-'}${officerId ? ` (Employee ID: ${officerId})` : ''}${sanitizedPhone ? `, Phone: ${sanitizedPhone}` : ''}`;
        officialDescription = officialDescription ? `${officialDescription}\n${officerLine}` : officerLine;
      }

      const payload: CreateUsageRequestDto = {
        ...base,
        officialDescription,
        travelWithOfficer,
        officerName,
        officerId,
        officerPhone: sanitizedPhone || undefined,
        returnDate: returnDate || undefined,
      };
      const saved = await createUsageRequest(payload).catch((error: any) => {
        const message = error?.response?.data?.message || error?.message || 'Failed to save';
        setErr(message);
        throw error;
      });

      if (typeof window !== 'undefined' && base.employeeId) {
        localStorage.setItem('employeeId', base.employeeId);
        localStorage.setItem('actor', base.employeeId);
        localStorage.setItem('role', 'APPLICANT');
      }

      reset({
        ...data,
        timeFrom: '',
        timeTo: '',
        fromLocation: '',
        toLocation: '',
        officialDescription: '',
        goods: '',
        returnDate: '',
        travelWithOfficer: false,
        officerName: '',
        officerId: '',
        officerPhone: '',
      });

      const code = saved?.requestCode || '—';
      setConfirm({ code, when: new Date().toLocaleString() });

      redirectTimer.current = setTimeout(() => {
        router.push(REQUESTS_ROUTE);
      }, 2000);
    },
    [reset, router]
  );

  const handleFormSubmit = React.useCallback((data: FormValues) => {
    setPendingData(data);
    setVerifyOpen(true);
    setAccountPassword('');
    setVerifyError(null);
  }, []);

  const finalizeSubmission = React.useCallback(async () => {
    if (!pendingData) return;
    if (!user?.username) {
      setVerifyError('Unable to read your account. Please re-login.');
      return;
    }
    if (!accountPassword) {
      setVerifyError('Enter your account password to confirm.');
      return;
    }
    setVerifyError(null);
    setVerifying(true);
    try {
      await login({ username: user.username, password: accountPassword });
      await processSubmission(pendingData);
      closeVerifyModal();
    } catch (error: any) {
      const msg = error?.response?.data?.message || error?.message || 'Password verification failed.';
      setVerifyError(msg);
    } finally {
      setVerifying(false);
    }
  }, [accountPassword, closeVerifyModal, pendingData, processSubmission, user]);

  const L = (s: string) => <label className="block text-[12px] font-medium text-orange-800 mb-1">{s}</label>;
  const errCls = (b: boolean) =>
    `w-full border rounded px-3 py-2 text-[13px] ${b ? 'border-red-500' : 'border-orange-200'}`;

  const closeModal = () => {
    if (redirectTimer.current) { clearTimeout(redirectTimer.current); redirectTimer.current = null; }
    setConfirm(null);
  };

  const goNow = () => {
    if (redirectTimer.current) { clearTimeout(redirectTimer.current); redirectTimer.current = null; }
    router.push(REQUESTS_ROUTE);
  };

  return (
    <div className="space-y-4">
      <header className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-orange-700">Create request</p>
        <h1 className="text-2xl font-bold text-orange-900">New vehicle request</h1>
        <p className="text-sm text-gray-600">Provide the journey details so the transport team can schedule a driver.</p>
      </header>

      {err && (
        <div className="text-xs md:text-sm rounded-lg bg-red-50 border border-red-200 text-red-800 px-3 py-2">
          {err}
        </div>
      )}

      <form className="bg-white rounded-2xl border border-orange-200 shadow-sm p-4 md:p-5 space-y-4" onSubmit={handleSubmit(handleFormSubmit)}>
        <input type="hidden" {...register('employeeId', { required: true })} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            <div className="relative">
              <div className="flex items-center justify-between gap-2">
                {L('Applicant Name *')}
                {employeesLoading ? (
                  <span className="text-[11px] text-gray-500">Loading directory…</span>
                ) : null}
              </div>
              <input
                {...applicantNameField}
                autoComplete="off"
                className={errCls(!!errors.applicantName)}
                onFocus={() => {
                  if (applicantDropdownTimeout.current) {
                    clearTimeout(applicantDropdownTimeout.current);
                    applicantDropdownTimeout.current = null;
                  }
                  setApplicantDropdownOpen(true);
                }}
                onChange={(e) => {
                  applicantNameField.onChange(e);
                  if (applicantDropdownTimeout.current) {
                    clearTimeout(applicantDropdownTimeout.current);
                    applicantDropdownTimeout.current = null;
                  }
                  setApplicantDropdownOpen(true);
                  if (selectedApplicant) {
                    setSelectedApplicant(null);
                    setValue('employeeId', '', { shouldDirty: true, shouldValidate: true });
                    setValue('department', '', { shouldDirty: true, shouldValidate: true });
                  }
                }}
                onBlur={(e) => {
                  applicantNameField.onBlur(e);
                  applicantDropdownTimeout.current = setTimeout(() => setApplicantDropdownOpen(false), 150);
                }}
              />
              {applicantDropdownOpen ? (
                <div className="absolute z-20 w-full bg-white border border-orange-100 rounded-lg shadow-lg mt-1 max-h-60 overflow-y-auto">
                  {employeesLoading ? (
                    <div className="px-3 py-2 text-[12px] text-gray-500">Loading employees…</div>
                  ) : applicantMatches.length ? (
                    applicantMatches.map((reg, index) => (
                      <button
                        type="button"
                        key={reg.epfNo || reg.id || index}
                        className="w-full text-left px-3 py-2 hover:bg-orange-50"
                        onMouseDown={(event) => {
                          event.preventDefault();
                          handleSelectApplicant(reg);
                        }}
                      >
                        <div className="text-[13px] font-medium text-orange-900">
                          {reg.fullName || reg.nameWithInitials || reg.epfNo || 'Unnamed'}
                        </div>
                        <div className="text-[11px] text-gray-600">
                          {reg.epfNo ? `EPF ${reg.epfNo}` : 'No EPF'}{reg.department ? ` • ${reg.department}` : ''}
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="px-3 py-2 text-[12px] text-gray-500">No employees match your search.</div>
                  )}
                </div>
              ) : null}
              {selectedApplicant ? (
                <p className="mt-1 text-[11px] text-gray-600">
                  Selected: {selectedApplicant.fullName || selectedApplicant.nameWithInitials || 'Employee'} ({selectedApplicant.epfNo || 'No EPF'})
                </p>
              ) : null}
              {!selectedApplicant ? (
                <p className="mt-1 text-[11px] text-orange-700">
                  Pick an employee from the list so their EPF number and department are captured.
                </p>
              ) : null}
              {employeesError && !employeesLoading ? (
                <p className="mt-1 text-[11px] text-red-600">{employeesError}</p>
              ) : null}
            </div>
            <div>
              {L('Department *')}
              <input className={errCls(!!errors.department)} {...register('department', { required: 'Required', maxLength: 100 })} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 md:gap-4">
            <div>
              {L('Date From *')}
              <input
                type="date"
                min={todayUtc()}
                className={errCls(!!errors.dateOfTravel)}
                {...register('dateOfTravel', { required: 'Required' })}
              />
            </div>
            <div>
              {L('Return Date')}
              <input
                type="date"
                min={dateFromValue || todayUtc()}
                className={errCls(!!errors.returnDate)}
                {...register('returnDate', {
                  validate: (value) => {
                    if (!value) return true;
                    if (!dateFromValue) return 'Select the start date first';
                    if (value < dateFromValue) return 'Return date must be same day or later';
                    return true;
                  },
                })}
              />
              <p className="mt-1 text-[11px] text-gray-500">Leave blank if the trip ends the same day.</p>
              {errors.returnDate && (
                <div className="mt-1 text-[11px] text-red-600">{String(errors.returnDate.message)}</div>
              )}
            </div>
            <div>
              {L('Time From *')}
              <input
                type="time"
                className={errCls(!!errors.timeFrom)}
                {...register('timeFrom', { required: 'Required', pattern: { value: /^\d{2}:\d{2}$/, message: 'HH:mm' } })}
              />
            </div>
            <div>
              {L('Time To *')}
              <input
                type="time"
                className={errCls(!!errors.timeTo)}
                {...register('timeTo', { required: 'Required', pattern: { value: /^\d{2}:\d{2}$/, message: 'HH:mm' } })}
              />
              <p className="mt-1 text-[11px] text-orange-700">Example: 05:00 — 18:00</p>
            </div>
          </div>

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

          <div className="border border-orange-200 rounded-lg p-3 md:p-4 bg-orange-50/40">
            <label className="flex items-center gap-2 text-sm text-orange-900 font-medium">
              <input type="checkbox" {...register('travelWithOfficer')} />
              Travelling with Officer
            </label>

            {withOfficer && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 mt-3">
                <div className="relative">
                  <div className="flex items-center justify-between gap-2">
                    {L('Name of Travelling Officer *')}
                    {employeesLoading && (
                      <span className="text-[11px] text-gray-500">Loading directory…</span>
                    )}
                  </div>
                  <input
                    {...officerNameField}
                    autoComplete="off"
                    className={errCls(!!errors.officerName)}
                    onFocus={() => {
                      if (!withOfficer) return;
                      if (officerDropdownTimeout.current) {
                        clearTimeout(officerDropdownTimeout.current);
                        officerDropdownTimeout.current = null;
                      }
                      setOfficerDropdownOpen(true);
                    }}
                    onChange={(e) => {
                      officerNameField.onChange(e);
                      if (officerDropdownTimeout.current) {
                        clearTimeout(officerDropdownTimeout.current);
                        officerDropdownTimeout.current = null;
                      }
                      if (withOfficer) setOfficerDropdownOpen(true);
                      if (selectedOfficer) {
                        setSelectedOfficer(null);
                        setValue('officerId', '', { shouldDirty: true, shouldValidate: true });
                        setValue('officerPhone', '', { shouldDirty: true, shouldValidate: true });
                      }
                    }}
                    onBlur={(e) => {
                      officerNameField.onBlur(e);
                      officerDropdownTimeout.current = setTimeout(
                        () => setOfficerDropdownOpen(false),
                        150
                      );
                    }}
                  />
                  {officerDropdownOpen && withOfficer ? (
                    <div className="absolute z-20 w-full bg-white border border-orange-100 rounded-lg shadow-lg mt-1 max-h-60 overflow-y-auto">
                      {employeesLoading ? (
                        <div className="px-3 py-2 text-[12px] text-gray-500">Loading employees…</div>
                      ) : officerMatches.length ? (
                        officerMatches.map((reg, index) => (
                          <button
                            type="button"
                            key={reg.epfNo || reg.id || index}
                            className="w-full text-left px-3 py-2 hover:bg-orange-50"
                            onMouseDown={(event) => {
                              event.preventDefault();
                              handleSelectOfficer(reg);
                            }}
                          >
                            <div className="text-[13px] font-medium text-orange-900">
                              {reg.fullName || reg.nameWithInitials || reg.epfNo || 'Unnamed'}
                            </div>
                            <div className="text-[11px] text-gray-600">
                              {reg.epfNo ? `EPF ${reg.epfNo}` : 'No EPF'}{reg.mobileNo ? ` • ${cleanPhone(reg.mobileNo)}` : ''}
                            </div>
                          </button>
                        ))
                      ) : (
                        <div className="px-3 py-2 text-[12px] text-gray-500">No employees match your search.</div>
                      )}
                    </div>
                  ) : null}
                  {selectedOfficer ? (
                    <p className="mt-1 text-[11px] text-gray-600">
                      Selected: {selectedOfficer.fullName || selectedOfficer.nameWithInitials || 'Officer'} ({selectedOfficer.epfNo || 'No EPF'})
                    </p>
                  ) : null}
                </div>
                <div>
                  {L('Travelling Officer Employee ID')}
                  <input className={errCls(false)} placeholder="e.g., E12345" {...register('officerId', { maxLength: 50 })} />
                </div>
                <div>
                  {L('Travelling Officer Phone')}
                  <input
                    inputMode="tel"
                    placeholder="e.g., +974 5555 1234"
                    className={errCls(!!errors.officerPhone)}
                    {...register('officerPhone', {
                      maxLength: { value: 25, message: 'Too long' },
                      pattern: { value: /^[0-9+()\-\s/.]{7,25}$/, message: 'Use digits, + ( ) - / . and spaces only' },
                    })}
                  />
                  {errors.officerPhone && (
                    <div className="mt-1 text-[11px] text-red-600">{String(errors.officerPhone.message)}</div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="border border-dashed border-orange-300 rounded-xl p-4 bg-orange-50/60 flex items-start gap-3">
            <ShieldCheck size={18} className="text-orange-500 mt-0.5" />
            <div className="text-sm text-gray-700">
              <p className="font-semibold text-orange-900">Account verification</p>
              <p className="text-xs text-gray-600">
                After you press <strong>Submit request</strong>, we will ask for your account password to confirm the submission and
                store your account as the requester, even if you filled the applicant details for someone else.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={handleClear} className="px-3 md:px-4 py-2 rounded border text-[13px]">Clear</button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-3 md:px-4 py-2 rounded bg-orange-600 text-white disabled:opacity-60 text-[13px]"
            >
              {isSubmitting ? 'Saving…' : 'Submit Request'}
            </button>
          </div>
        </form>

      {verifyOpen && pendingData ? createPortal(
        <div
          className="fixed inset-0 z-40 grid place-items-center bg-black/40 p-3"
          role="dialog"
          aria-modal
          onClick={closeVerifyModal}
        >
          <div
            className="w-full max-w-md rounded-xl bg-white shadow-xl border border-orange-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-4 py-3 border-b bg-orange-50 flex items-center gap-2">
              <ShieldCheck size={16} className="text-orange-500" />
              <h3 className="text-[14px] font-bold text-orange-900">Confirm submission</h3>
            </div>
            <div className="p-4 text-sm space-y-3">
              <p className="text-gray-700">
                You’re about to submit this request as{' '}
                <span className="font-semibold text-orange-900">{user?.fullName || user?.username || 'your account'}</span>.
              </p>
              <div className="bg-orange-50 border border-orange-100 rounded-lg p-3 text-[12px] text-gray-600 space-y-1">
                <p><span className="font-semibold text-orange-900">Applicant field:</span> {pendingData.applicantName} ({pendingData.employeeId || 'N/A'})</p>
                <p><span className="font-semibold text-orange-900">Account:</span> {user?.username || '—'} ({user?.department || pendingData.department || 'Department'})</p>
              </div>
              <div className="space-y-1 text-[13px]">
                <label className="font-medium text-orange-900">Account password</label>
                <div className="relative">
                  <input
                    type={showAccountPassword ? 'text' : 'password'}
                    value={accountPassword}
                    onChange={(e) => setAccountPassword(e.target.value)}
                    className="w-full border border-orange-200 rounded px-3 py-2 pr-10 text-[13px]"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-2 text-orange-500 hover:text-orange-700"
                    onClick={() => setShowAccountPassword((prev) => !prev)}
                  >
                    {showAccountPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <p className="text-[11px] text-gray-500">We re-verify your identity before saving the request.</p>
              </div>
              {verifyError ? <div className="text-[11px] text-red-600">{verifyError}</div> : null}
            </div>
            <div className="px-4 py-3 border-t flex items-center justify-end gap-2">
              <button
                type="button"
                className="px-3 py-1.5 rounded border text-[12px]"
                onClick={closeVerifyModal}
              >
                Review details
              </button>
              <button
                type="button"
                className="px-3 py-1.5 rounded bg-orange-600 text-white text-[12px] disabled:opacity-60"
                onClick={finalizeSubmission}
                disabled={verifying}
              >
                {verifying ? 'Submitting…' : 'Confirm & submit'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      ) : null}
      {/* Confirmation Modal */}
      {confirm ? createPortal(
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-3"
          role="dialog"
          aria-modal
          onClick={closeModal}
        >
          <div
            className="w-full max-w-md rounded-xl bg-white shadow-xl border border-orange-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-4 py-3 border-b bg-orange-50">
              <h3 className="text-[14px] font-bold text-orange-900">Request Submitted</h3>
            </div>
            <div className="p-4 text-[13px] space-y-2">
              <div>
                Your request has been submitted successfully.
              </div>
              <div className="text-sm">
                <span className="text-gray-600">Request Code:</span>{' '}
                <span className="font-semibold text-orange-900">{confirm.code}</span>
              </div>
              <div className="text-xs text-gray-600">Submitted at {confirm.when}</div>
              <div className="pt-2 text-xs text-gray-500">
                You’ll be taken to your Requests list shortly.
              </div>
            </div>
            <div className="px-4 py-3 border-t flex items-center justify-end gap-2">
              <button
                type="button"
                className="px-3 py-1.5 rounded border text-[12px]"
                onClick={closeModal}
                title="Stay on this page"
              >
                Stay here
              </button>
              <button
                type="button"
                className="px-3 py-1.5 rounded bg-orange-600 text-white text-[12px] hover:bg-orange-700"
                onClick={goNow}
                title="Go to Requests now"
              >
                Go to My Requests
              </button>
            </div>
          </div>
        </div>,
        document.body
      ) : null}
    </div>
  );
}
