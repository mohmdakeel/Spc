'use client';

import React from 'react';
import { X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { createUsageRequest } from '../services/usageService';

type FormData = {
  applicantName: string;
  employeeId: string;
  department: string;
  dateOfTravel: string;
  timeFrom: string;
  timeTo: string;
  fromLocation: string;
  toLocation: string;
  officialDescription?: string;
  goods?: string;
};

export default function UsageRequestFormModal({
  open, onClose, onCreated,
}: { open: boolean; onClose: () => void; onCreated?: () => void; }) {
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    defaultValues: {
      applicantName: '', employeeId: '', department: '',
      dateOfTravel: '', timeFrom: '', timeTo: '',
      fromLocation: '', toLocation: '', officialDescription: '', goods: '',
    }
  });

  if (!open) return null;

  const submit = async (data: FormData) => {
    await createUsageRequest(data as any);
    reset();
    onClose();
    onCreated?.();
  };

  const L = (s:string)=> <label className="block text-[13px] font-medium text-orange-800 mb-1">{s}</label>;

  return (
    <div className="fixed inset-0 bg-black/40 grid place-items-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl overflow-hidden" onClick={e=>e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-3 border-b bg-orange-50">
          <h3 className="font-bold text-orange-900">New Staff Vehicle Request</h3>
          <button className="p-2 rounded hover:bg-orange-100" onClick={onClose} aria-label="Close"><X size={18}/></button>
        </div>

        <form className="p-5 space-y-4" onSubmit={handleSubmit(submit)}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>{L('Applicant Name *')}
              <input className={`w-full border rounded px-3 py-2 ${errors.applicantName?'border-red-500':'border-orange-200'}`}
                     {...register('applicantName', { required: 'Required' })}/>
            </div>
            <div>{L('Employee ID *')}
              <input className={`w-full border rounded px-3 py-2 ${errors.employeeId?'border-red-500':'border-orange-200'}`}
                     {...register('employeeId', { required: 'Required' })}/>
            </div>
            <div>{L('Department *')}
              <input className={`w-full border rounded px-3 py-2 ${errors.department?'border-red-500':'border-orange-200'}`}
                     {...register('department', { required: 'Required' })}/>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>{L('Date of Travel *')}
              <input type="date" className={`w-full border rounded px-3 py-2 ${errors.dateOfTravel?'border-red-500':'border-orange-200'}`}
                     {...register('dateOfTravel', { required: 'Required' })}/>
            </div>
            <div>{L('Time From *')}
              <input type="time" className={`w-full border rounded px-3 py-2 ${errors.timeFrom?'border-red-500':'border-orange-200'}`}
                     {...register('timeFrom', { required: 'Required' })}/>
            </div>
            <div>{L('Time To *')}
              <input type="time" className={`w-full border rounded px-3 py-2 ${errors.timeTo?'border-red-500':'border-orange-200'}`}
                     {...register('timeTo', { required: 'Required' })}/>
            </div>
            <div className="flex items-end text-xs text-orange-700">
              <div className="bg-orange-50 border border-orange-200 rounded px-2 py-2 w-full">Example: 05:00 — 18:00</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>{L('From Location *')}
              <input className={`w-full border rounded px-3 py-2 ${errors.fromLocation?'border-red-500':'border-orange-200'}`}
                     {...register('fromLocation', { required: 'Required' })}/>
            </div>
            <div>{L('To Location *')}
              <input className={`w-full border rounded px-3 py-2 ${errors.toLocation?'border-red-500':'border-orange-200'}`}
                     {...register('toLocation', { required: 'Required' })}/>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>{L('Official Trip Description')}
              <textarea rows={3} className="w-full border border-orange-200 rounded px-3 py-2"
                        {...register('officialDescription')}/>
            </div>
            <div>{L('Goods being transported (if any)')}
              <textarea rows={3} className="w-full border border-orange-200 rounded px-3 py-2"
                        {...register('goods')}/>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="px-4 py-2 rounded border" onClick={onClose}>Cancel</button>
            <button type="submit" disabled={isSubmitting}
                    className="px-4 py-2 rounded bg-orange-600 text-white disabled:opacity-60">
              {isSubmitting ? 'Saving…' : 'Submit Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
