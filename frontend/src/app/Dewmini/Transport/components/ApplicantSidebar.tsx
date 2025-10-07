// src/app/Akeel/Transport/components/ApplicantSidebar.tsx
'use client';

import React from 'react';
import { Home, PlusCircle, ListChecks, Printer, Search, Car } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';

export default function ApplicantSidebar() {
  const [collapsed, setCollapsed] = React.useState(false);
  const router = useRouter();
  const path = usePathname();
  const go = (p: string) => router.push(p);
  const is = (p: string) => path === p;

  return (
    <aside className={`${collapsed ? 'w-20' : 'w-64'} h-screen bg-orange-100 p-4 transition-all`}>
      <div className="flex items-center gap-2 mb-6">
        <Car className="text-orange-600" />
        {!collapsed && <h1 className="font-bold">SPC Transport</h1>}
      </div>

      <button
        onClick={() => setCollapsed((c) => !c)}
        className="mb-4 w-full bg-orange-200 rounded py-2 text-sm"
      >
        {collapsed ? 'Expand' : 'Collapse'}
      </button>

      <nav className="space-y-1">
        <button
          onClick={() => go('/Akeel/Applicant')}
          className={`w-full px-3 py-2 rounded flex items-center gap-2 ${
            is('/Akeel/Applicant') ? 'bg-orange-600 text-white' : 'hover:bg-orange-200'
          }`}
        >
          <Home size={18} />
          {!collapsed && 'Dashboard'}
        </button>

        <button
          onClick={() => go('/Akeel/Applicant/NewRequest')}
          className={`w-full px-3 py-2 rounded flex items-center gap-2 ${
            is('/Akeel/Applicant/NewRequest') ? 'bg-orange-600 text-white' : 'hover:bg-orange-200'
          }`}
        >
          <PlusCircle size={18} />
          {!collapsed && 'New Request'}
        </button>

        <button
          onClick={() => go('/Akeel/Applicant/MyRequests')}
          className={`w-full px-3 py-2 rounded flex items-center gap-2 ${
            is('/Akeel/Applicant/MyRequests') ? 'bg-orange-600 text-white' : 'hover:bg-orange-200'
          }`}
        >
          <ListChecks size={18} />
          {!collapsed && 'My Requests'}
        </button>

        <button
          onClick={() => go('/Akeel/Applicant/PrintSlip')}
          className={`w-full px-3 py-2 rounded flex items-center gap-2 ${
            is('/Akeel/Applicant/PrintSlip') ? 'bg-orange-600 text-white' : 'hover:bg-orange-200'
          }`}
        >
          <Printer size={18} />
          {!collapsed && 'Print Slip'}
        </button>

        <button
          onClick={() => go('/Akeel/Applicant/Search')}
          className={`w-full px-3 py-2 rounded flex items-center gap-2 ${
            is('/Akeel/Applicant/Search') ? 'bg-orange-600 text-white' : 'hover:bg-orange-200'
          }`}
        >
          <Search size={18} />
          {!collapsed && 'Search Requests'}
        </button>
      </nav>
    </aside>
  );
}
