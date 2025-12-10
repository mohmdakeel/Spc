'use client';

import React, { useState } from 'react';
import { X, CheckCircle2, XCircle, MapPin, User2, CalendarDays, FileText, Moon } from 'lucide-react';
import type { UsageRequest } from '../../Transport/services/types';

export default function ManagementReviewModal({
  open, request, onClose, onApprove, onReject,
}: {
  open: boolean;
  request: UsageRequest | null;
  onClose: () => void;
  onApprove: (remarks: string, password: string) => void | Promise<void>;
  onReject: (remarks: string, password: string) => void | Promise<void>;
}) {
  const [remarks, setRemarks] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!open || !request) return null;

  const canSubmit = remarks.trim().length > 0 && password.trim().length > 0 && !busy;

  const submitApprove = async () => {
    if (!canSubmit) {
      setErr('Remarks and password are required.');
      return;
    }
    setErr(null);
    setBusy(true);
    try {
      await Promise.resolve(onApprove(remarks.trim(), password));
    } catch (e: any) {
      setErr(e?.message || 'Approve failed, try again.');
    } finally {
      setBusy(false);
    }
  };
  const submitReject  = async () => {
    if (!canSubmit) {
      setErr('Remarks and password are required.');
      return;
    }
    setErr(null);
    setBusy(true);
    try {
      await Promise.resolve(onReject(remarks.trim(), password));
    } catch (e: any) {
      setErr(e?.message || 'Reject failed, try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 grid place-items-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl overflow-hidden" onClick={(e)=>e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b bg-orange-50">
          <h3 className="font-bold text-orange-900">Management Review • {request.requestCode}</h3>
          <button className="p-2 rounded hover:bg-orange-100" onClick={onClose} aria-label="Close"><X size={18}/></button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="flex gap-2 items-start">
              <User2 className="text-orange-600 mt-0.5" size={18}/>
              <div>
                <div className="text-orange-800 font-semibold">Applicant</div>
                <div className="text-orange-900">{request.applicantName} ({request.employeeId})</div>
                <div className="text-orange-700/80">{request.department}</div>
              </div>
            </div>

            <div className="flex gap-2 items-start">
              <CalendarDays className="text-orange-600 mt-0.5" size={18}/>
              <div>
                <div className="text-orange-800 font-semibold">Date / Time</div>
                <div className="text-orange-900">
                  {request.dateOfTravel} • {request.timeFrom} – {request.timeTo}{' '}
                  {request.overnight ? <span className="inline-flex items-center gap-1 text-xs text-orange-700"><Moon size={12}/>overnight</span> : null}
                </div>
              </div>
            </div>

            <div className="flex gap-2 items-start">
              <MapPin className="text-orange-600 mt-0.5" size={18}/>
              <div>
                <div className="text-orange-800 font-semibold">Route</div>
                <div className="text-orange-900">{request.fromLocation} → {request.toLocation}</div>
              </div>
            </div>

            <div className="flex gap-2 items-start">
              <FileText className="text-orange-600 mt-0.5" size={18}/>
              <div>
                <div className="text-orange-800 font-semibold">Purpose / Goods</div>
                <div className="text-orange-900 break-words">{request.officialDescription || '-'}</div>
                <div className="text-orange-700/80 break-words">{request.goods || '-'}</div>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-orange-800 mb-1">Remarks (required)</label>
            <textarea
              className="w-full border border-orange-200 rounded px-3 py-2"
              rows={3}
              value={remarks}
              onChange={(e)=>setRemarks(e.target.value)}
              placeholder="Short note for your approval/rejection"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-orange-800 mb-1">Account password (required)</label>
            <input
              type="password"
              className="w-full border border-orange-200 rounded px-3 py-2"
              value={password}
              onChange={(e)=>setPassword(e.target.value)}
              placeholder="Re-enter your password to confirm"
            />
            {err ? <div className="text-[12px] text-red-600 mt-1">{err}</div> : null}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t bg-orange-50 flex justify-end gap-2">
          <button className="px-4 py-2 rounded border" onClick={onClose} disabled={busy}>Cancel</button>
          <button
            className="px-4 py-2 rounded bg-red-600 text-white disabled:opacity-60"
            disabled={!canSubmit}
            onClick={submitReject}
          >
            <span className="inline-flex items-center gap-2"><XCircle size={16}/>{busy ? 'Working…' : 'Reject'}</span>
          </button>
          <button
            className="px-4 py-2 rounded bg-green-600 text-white disabled:opacity-60"
            disabled={!canSubmit}
            onClick={submitApprove}
          >
            <span className="inline-flex items-center gap-2"><CheckCircle2 size={16}/>{busy ? 'Working…' : 'Approve'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
