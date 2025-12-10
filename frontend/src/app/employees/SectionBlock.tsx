'use client';

import React from 'react';

export default function SectionBlock({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <div className="bg-orange-50 border-b border-gray-200 px-4 py-2 flex items-center gap-2">
        {icon}
        <h4 className="text-sm font-semibold text-gray-900">{title}</h4>
      </div>
      <div className="divide-y divide-gray-100">{children}</div>
    </div>
  );
}
