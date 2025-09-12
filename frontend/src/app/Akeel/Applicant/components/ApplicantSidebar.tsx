'use client';

import React from 'react';
import { Home, PlusCircle, ListChecks, Printer, Search, Car } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';

export default function ApplicantSidebar() {
  const [collapsed, setCollapsed] = React.useState(false);
  const router = useRouter();
  const path = usePathname();
  const go = (p: string) => router.push(p);
  const is = (p: string) => path === p || path?.startsWith(p + '/');

  const Item = ({ label, icon, to }: { label: string; icon: React.ReactNode; to: string }) => (
    <button
      onClick={() => go(to)}
      className={`w-full px-3 py-2 rounded flex items-center gap-2 ${
        is(to) ? 'bg-orange-600 text-white' : 'hover:bg-orange-200'
      }`}
    >
      {icon}
      {!collapsed && label}
    </button>
  );

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
        <Item label="Dashboard" icon={<Home size={18} />} to="/Akeel/Applicant" />
        <Item label="New Request" icon={<PlusCircle size={18} />} to="/Akeel/Applicant/NewRequest" />
        <Item label="My Requests" icon={<ListChecks size={18} />} to="/Akeel/Applicant/MyRequests" />
        {/* <Item label="Print Slip" icon={<Printer size={18} />} to="/Akeel/Applicant/PrintSlip" />
        <Item label="Search Requests" icon={<Search size={18} />} to="/Akeel/Applicant/Search" /> */}
      </nav>
    </aside>
  );
}
