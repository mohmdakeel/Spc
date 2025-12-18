'use client';

import React from 'react';

export default function InfoRow({
  label,
  value,
  icon,
}: {
  label: string;
  value?: string;
  icon?: React.ReactNode;
}) {
  const showValue = value && value.trim() !== '' ? value : 'N/A';
  return (
    <div className="flex items-center justify-between py-2 px-4 text-sm">
      <span className="text-gray-600 flex items-center gap-2">
        {icon}
        {label}
      </span>
      <span className="text-gray-900 break-all text-right">{showValue}</span>
    </div>
  );
}
