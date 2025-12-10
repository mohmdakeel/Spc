'use client';

import React from 'react';
import { Home, PlusCircle, ListChecks, MapPin, BarChart3, Car, UserCircle, Settings, LogOut } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { logout } from '../../../../../lib/auth';

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

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <aside
      className="
        w-[280px] min-w-[280px] shrink-0
        h-screen sticky top-0
        bg-orange-100 p-4
        border-r border-orange-200
        flex flex-col
      "
    >
      <div className="flex items-center gap-2 mb-6">
        <Car className="text-orange-600" />
        <h1 className="font-bold text-base text-orange-900">SPC Transport</h1>
      </div>

      <nav className="space-y-1 flex-1">
        <Item label="Dashboard"     icon={<Home size={18} />}       to="/Akeel/Applicant" />
        <Item label="New Request"   icon={<PlusCircle size={18} />} to="/Akeel/Applicant/NewRequest" />
        <Item label="Requests"      icon={<ListChecks size={18} />} to="/Akeel/Applicant/MyRequests" />
        <Item label="Track Request" icon={<MapPin size={18} />}     to="/Akeel/Applicant/Track" />
        <Item label="Reports"       icon={<BarChart3 size={18} />}  to="/Akeel/Applicant/Reports" />
      </nav>

      <div className="pt-4 mt-6 border-t border-orange-200 space-y-2">
        <button
          onClick={() => go('/Akeel/Applicant/Profile')}
          className="w-full px-3 py-2 rounded flex items-center gap-2 text-sm text-orange-900 hover:bg-orange-200"
        >
          <UserCircle size={18} />
          <span>Profile</span>
        </button>
        <button
          onClick={() => go('/Akeel/Applicant/Settings')}
          className="w-full px-3 py-2 rounded flex items-center gap-2 text-sm text-orange-900 hover:bg-orange-200"
        >
          <Settings size={18} />
          <span>Settings</span>
        </button>
        <button
          onClick={handleLogout}
          className="w-full px-3 py-2 rounded flex items-center gap-2 text-sm text-red-600 hover:bg-red-50 border border-red-100"
        >
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
