'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Home, PlusCircle, ListChecks, MapPin, BarChart3, UserCircle, Settings, LogOut } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { logout } from '../../../../../lib/auth';

const NAV_ITEMS = [
  { label: 'Dashboard',     icon: <Home size={18} />,       to: '/Akeel/Applicant' },
  { label: 'New Request',   icon: <PlusCircle size={18} />, to: '/Akeel/Applicant/NewRequest' },
  { label: 'Requests',      icon: <ListChecks size={18} />, to: '/Akeel/Applicant/MyRequests' },
  { label: 'Track Request', icon: <MapPin size={18} />,     to: '/Akeel/Applicant/Track' },
  { label: 'Reports',       icon: <BarChart3 size={18} />,  to: '/Akeel/Applicant/Reports' },
];

export default function ApplicantSidebar() {
  const router = useRouter();
  const path = usePathname();
  const is = (p: string) => path === p || path?.startsWith(p + '/');

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
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.to}
            href={item.to}
            prefetch={false}
            className={`hod-sidebar__item ${is(item.to) ? 'is-active' : ''}`}
            aria-current={is(item.to) ? 'page' : undefined}
          >
            {item.icon}
            <span className="truncate">{item.label}</span>
          </Link>
        ))}
      </nav>

      <div className="pt-4 mt-6 border-t border-orange-200 space-y-2">
        <Link href="/Akeel/Applicant/Profile" prefetch={false} className="hod-sidebar__link">
          <UserCircle size={18} />
          <span>Profile</span>
        </Link>
        <Link href="/Akeel/Applicant/Settings" prefetch={false} className="hod-sidebar__link">
          <Settings size={18} />
          <span>Settings</span>
        </Link>
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
