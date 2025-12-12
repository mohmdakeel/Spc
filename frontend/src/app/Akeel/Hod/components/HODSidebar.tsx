'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, ListChecks, CheckCircle2, XCircle, MapPin, UserCircle, Settings, LogOut } from 'lucide-react';
import { logout } from '../../../../../lib/auth';

const NAV_ITEMS = [
  { to: '/Akeel/Hod', label: 'Dashboard', icon: <Home size={18} /> },
  { to: '/Akeel/Hod/Pending', label: 'Pending Approvals', icon: <ListChecks size={18} /> },
  { to: '/Akeel/Hod/Approved', label: 'Approved', icon: <CheckCircle2 size={18} /> },
  { to: '/Akeel/Hod/Rejected', label: 'Rejected', icon: <XCircle size={18} /> },
  { to: '/Akeel/Hod/Track', label: 'Track by Request ID', icon: <MapPin size={18} /> },
];

export default function HODSidebar() {
  const router = useRouter();
  const path = usePathname();
  const isActive = (p: string) => path === p || path?.startsWith(p + '/');

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.warn('Logout failed, forcing client redirect anyway', err);
    } finally {
      router.push('/login');
      router.refresh();
    }
  };

  return (
    <aside className="hod-sidebar w-64 min-w-[16rem] shrink-0 h-screen sticky top-0 p-4 transition-all flex flex-col overflow-y-auto">
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
          <h1 className="font-bold text-sm text-orange-900 leading-tight truncate">State Printing Corporation</h1>
          <p className="text-xs text-orange-700/70 truncate">HOD Workspace</p>
        </div>
      </div>

      <nav className="space-y-1 flex-1">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.to);
          return (
            <Link
              key={item.to}
              href={item.to}
              prefetch={false}
              className={`hod-sidebar__item ${active ? 'is-active' : ''}`}
              aria-current={active ? 'page' : undefined}
            >
              {item.icon}
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="pt-4 mt-6 border-t border-orange-200 space-y-2">
        <Link href="/Akeel/Hod/Profile" prefetch={false} className="hod-sidebar__link">
          <UserCircle size={18} />
          <span>Profile</span>
        </Link>
        <Link href="/Akeel/Hod/Settings" prefetch={false} className="hod-sidebar__link">
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
