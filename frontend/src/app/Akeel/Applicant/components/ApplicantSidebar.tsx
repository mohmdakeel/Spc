'use client';

import React from 'react';
import { Home, PlusCircle, ListChecks, MapPin, Car } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';

export default function ApplicantSidebar() {
  const router = useRouter();
  const path = usePathname();
  const go = (p: string) => router.push(p);
  const is = (p: string) => path === p || path?.startsWith(p + '/');

  const Item = ({ label, icon, to }: { label: string; icon: React.ReactNode; to: string }) => (
    <button
      onClick={() => go(to)}
      className={`w-full px-3 py-2 rounded flex items-center gap-2 text-sm ${
        is(to) ? 'bg-orange-600 text-white' : 'hover:bg-orange-200 text-orange-900'
      }`}
    >
      {icon}
      <span className="truncate">{label}</span>
    </button>
  );

  return (
    <aside
      className="
        w-[280px] min-w-[280px] shrink-0
        h-screen sticky top-0
        bg-orange-100 p-4
        border-r border-orange-200
      "
    >
      <div className="flex items-center gap-2 mb-6">
        <Car className="text-orange-600" />
        <h1 className="font-bold text-base text-orange-900">SPC Transport</h1>
      </div>

      <nav className="space-y-1">
        <Item label="Dashboard"     icon={<Home size={18} />}       to="/Akeel/Applicant" />
        <Item label="New Request"   icon={<PlusCircle size={18} />} to="/Akeel/Applicant/NewRequest" />
        <Item label="Requests"      icon={<ListChecks size={18} />} to="/Akeel/Applicant/MyRequests" />
        <Item label="Track Request" icon={<MapPin size={18} />}     to="/Akeel/Applicant/Track" />
      </nav>
    </aside>
  );
}
