'use client';

import { CheckCircle, XCircle } from 'lucide-react';

export default function PermRow({
  label,
  ok,
}: {
  label: string;
  ok: boolean;
}) {
  return (
    <div
      className={`p-3 rounded-lg border ${
        ok ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        {ok ? (
          <CheckCircle className="w-4 h-4 text-green-600" />
        ) : (
          <XCircle className="w-4 h-4 text-gray-400" />
        )}
      </div>
    </div>
  );
}
