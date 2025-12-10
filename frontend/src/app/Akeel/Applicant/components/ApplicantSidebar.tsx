'use client';

import React from 'react';
import Image from 'next/image';
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
      className={`hod-sidebar__item ${is(to) ? 'is-active' : ''}`}
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
    <aside className="hod-sidebar w-64 min-w-64 shrink-0 h-screen sticky top-0 bg-orange-100 p-4 border-r border-orange-200 flex flex-col">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-2xl border border-orange-200 bg-white/80 flex items-center justify-center shadow-sm">
          <Image
            src="/spclogopic.png"
            alt="State Printing Corporation logo"
            width={36}
            height={36}
            className="object-contain"
            priority
          />
        </div>
        <div className="min-w-0">
          <h1 className="font-bold text-sm text-orange-900 leading-tight truncate">
            State Printing Corporation
          </h1>
          <p className="text-xs text-orange-700/70 truncate">Applicant Workspace</p>
        </div>
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
          className="hod-sidebar__link"
        >
          <UserCircle size={18} />
          <span>Profile</span>
        </button>
        <button
          onClick={() => go('/Akeel/Applicant/Settings')}
          className="hod-sidebar__link"
        >
          <Settings size={18} />
          <span>Settings</span>
        </button>
        <button
          onClick={handleLogout}
          className="hod-sidebar__danger"
        >
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
