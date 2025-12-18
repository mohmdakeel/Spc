'use client';

import React, { useMemo, useState } from 'react';
import {
  X, CheckCircle2, XCircle, MapPin, User2, CalendarDays, FileText, Moon, CarFront, Phone, BadgeCheck,
} from 'lucide-react';
import type { UsageRequest } from '../../Transport/services/types';

/* -------- helpers (now null-safe) -------- */
const fmtDT = (s?: string | null) => (s ? new Date(s).toLocaleString() : '-');

const appliedLabel = (r?: Partial<UsageRequest> | null) => {
  if (!r) return '-';
  const d: any = (r as any).appliedDate ?? (r as any).applied_on ?? (r as any).appliedOn;
  const t: any = (r as any).appliedTime ?? (r as any).applied_time;
  if (d && t) return `${d} ${t}`;
  if (d && r.createdAt) {
    const tt = new Date(r.createdAt as any).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return `${d} ${tt}`;
  }
  if (r.createdAt) return fmtDT(r.createdAt);
  return '-';
};

function extractOfficer(r?: Partial<UsageRequest> | null): { withOfficer: boolean; name?: string; id?: string; phone?: string } {
  if (!r) return { withOfficer: false };
  const withExplicit =
    !!((r as any).travelWithOfficer || (r as any).officerName || (r as any).officerId || (r as any).officerPhone);
  if (withExplicit) {
    return {
      withOfficer: true,
      name: (r as any).officerName || undefined,
      id: (r as any).officerId || undefined,
      phone: (r as any).officerPhone || undefined,
    };
  }
  // Fallback: parse from description/remarks line if present
  const text = `${(r as any)?.officialDescription ?? ''}\n${(r as any)?.remarks ?? ''}`;
  const m = /Travelling Officer:\s*([^\(\n,]+)?(?:\s*\(Employee ID:\s*([^)]+)\))?(?:,\s*Phone:\s*([^\s,]+))?/i.exec(text);
  if (m) return { withOfficer: true, name: m[1]?.trim(), id: m[2]?.trim(), phone: m[3]?.trim() };
  return { withOfficer: false };
}

const chip = (s: string) => (
  <span className="inline-block text-[11px] px-1.5 py-[2px] rounded bg-orange-100 text-orange-800 leading-none">
    {s}
  </span>
);

/* -------- component -------- */
export default function ReviewModal({
  open,
  request,
  onClose,
  onApprove,
  onReject,
}: {
  open: boolean;
  request: UsageRequest | null;
  onClose: () => void;
  onApprove: (remarks: string, password: string) => void | Promise<void>;
  onReject: (remarks: string, password: string) => void | Promise<void>;
}) {
  const [remarks, setRemarks] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // SAFE: extractOfficer handles null
  const off = useMemo(() => extractOfficer(request), [request]);

  if (!open || !request) return null;

  const canSubmit = remarks.trim().length > 0 && password.trim().length > 0 && !busy;

  const doApprove = async () => {
    if (!canSubmit) {
      setErr('Add remarks and your account password.');
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      await Promise.resolve(onApprove(remarks.trim(), password));
    } finally {
      setBusy(false);
    }
  };
  const doReject = async () => {
    if (!canSubmit) {
      setErr('Add remarks and your account password.');
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      await Promise.resolve(onReject(remarks.trim(), password));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 grid place-items-center z-50 p-4"
      onClick={onClose}
      onKeyDown={(e) => { if (e.key === 'Escape') onClose(); }}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-4xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b bg-orange-50">
          <h3 className="font-bold text-orange-900 flex items-center gap-2">
            Review Request • {request.requestCode}
            <span className="ml-2">{chip(request.status)}</span>
          </h3>
          <button className="p-2 rounded hover:bg-orange-100" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 text-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Applicant */}
            <div className="flex gap-2 items-start">
              <User2 className="text-orange-600 mt-0.5" size={18} />
              <div>
                <div className="text-orange-800 font-semibold">Applicant</div>
                <div className="text-orange-900">{request.applicantName} ({request.employeeId})</div>
                <div className="text-orange-700/80">{request.department || '-'}</div>
              </div>
            </div>

            {/* Applied */}
            <div className="flex gap-2 items-start">
              <BadgeCheck className="text-orange-600 mt-0.5" size={18} />
              <div>
                <div className="text-orange-800 font-semibold">Applied</div>
                <div className="text-orange-900">{appliedLabel(request)}</div>
              </div>
            </div>

            {/* Officer */}
            <div className="flex gap-2 items-start">
              <User2 className="text-orange-600 mt-0.5" size={18} />
              <div>
                <div className="text-orange-800 font-semibold">Travelling Officer</div>
                {off.withOfficer ? (
                  <div className="text-orange-900">
                    {off.name || '-'} {off.id ? <span className="text-orange-700/80">({off.id})</span> : null}
                    {off.phone ? (
                      <span className="inline-flex items-center gap-1 ml-2 text-orange-700/80">
                        <Phone size={14} />{off.phone}
                      </span>
                    ) : null}
                  </div>
                ) : (
                  <div className="text-orange-700/80">—</div>
                )}
              </div>
            </div>

            {/* Date / Time */}
            <div className="flex gap-2 items-start">
              <CalendarDays className="text-orange-600 mt-0.5" size={18} />
              <div>
                <div className="text-orange-800 font-semibold">Date / Time</div>
                <div className="text-orange-900">
                  {request.dateOfTravel} • {request.timeFrom} – {request.timeTo}{' '}
                  {request.overnight ? (
                    <span className="inline-flex items-center gap-1 text-[12px] text-orange-700">
                      <Moon size={12} />overnight
                    </span>
                  ) : null}
                </div>
              </div>
            </div>

            {/* Route */}
            <div className="flex gap-2 items-start">
              <MapPin className="text-orange-600 mt-0.5" size={18} />
              <div>
                <div className="text-orange-800 font-semibold">Route</div>
                <div className="text-orange-900">{request.fromLocation} → {request.toLocation}</div>
              </div>
            </div>

            {/* Assignment */}
            <div className="flex gap-2 items-start">
              <CarFront className="text-orange-600 mt-0.5" size={18} />
              <div>
                <div className="text-orange-800 font-semibold">Assignment</div>
                <div className="text-orange-900">
                  {request.assignedVehicleNumber || '—'}
                  {request.assignedDriverName ? (
                    <span className="text-orange-700/80">
                      {' '}• {request.assignedDriverName}{request.assignedDriverPhone ? ` (${request.assignedDriverPhone})` : ''}
                    </span>
                  ) : null}
                </div>
              </div>
            </div>

            {/* Purpose / Goods */}
            <div className="md:col-span-2 flex gap-2 items-start">
              <FileText className="text-orange-600 mt-0.5" size={18} />
              <div className="w-full">
                <div className="text-orange-800 font-semibold">Purpose / Goods</div>
                <div className="text-orange-900 whitespace-pre-wrap">{request.officialDescription || '-'}</div>
                <div className="text-orange-700/80">{request.goods || '-'}</div>
              </div>
            </div>
          </div>

          {/* Remarks */}
          <div>
            <label className="block text-sm font-medium text-orange-800 mb-1">Remarks (required)</label>
            <textarea
              className="w-full border border-orange-200 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-orange-300"
              rows={3}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Short note for your approval/rejection"
              autoFocus
            />
            {!remarks.trim() && (
              <div className="text-[12px] text-red-600 mt-1">Please enter a short remark.</div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-orange-800 mb-1">Account password (required)</label>
            <input
              type="password"
              className="w-full border border-orange-200 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-orange-300"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Re-enter your password"
            />
            {!password.trim() && (
              <div className="text-[12px] text-red-600 mt-1">Password is required to continue.</div>
            )}
            {err ? <div className="text-[12px] text-red-600 mt-1">{err}</div> : null}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t bg-orange-50 flex justify-end gap-2">
          <button className="px-4 py-2 rounded border" onClick={onClose} disabled={busy}>Cancel</button>
          <button
            className="px-4 py-2 rounded bg-red-600 text-white disabled:opacity-60"
            disabled={!canSubmit}
            onClick={doReject}
          >
            <span className="inline-flex items-center gap-2"><XCircle size={16}/>Reject</span>
          </button>
          <button
            className="px-4 py-2 rounded bg-green-600 text-white disabled:opacity-60"
            disabled={!canSubmit}
            onClick={doApprove}
          >
            <span className="inline-flex items-center gap-2"><CheckCircle2 size={16}/>Approve</span>
          </button>
        </div>
      </div>
    </div>
  );
}
