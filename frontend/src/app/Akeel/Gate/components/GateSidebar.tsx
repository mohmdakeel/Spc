'use client';

import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { Home, CalendarClock, Gauge, History, Users, Building, UserCircle, Settings, LogOut } from 'lucide-react';
import { logout } from '../../../../../lib/auth';

const MENU = [
  { label: 'Dashboard', icon: Home, to: '/Akeel/Gate' },
  { label: 'Scheduled Vehicles', icon: CalendarClock, to: '/Akeel/Gate/Scheduled' },
  { label: 'Active Vehicles', icon: Gauge, to: '/Akeel/Gate/Active' },
  { label: 'Trips History', icon: History, to: '/Akeel/Gate/History' },
  { label: 'Visitor Vehicles', icon: Users, to: '/Akeel/Gate/Visitors' },
  { label: 'Company Vehicles', icon: Building, to: '/Akeel/Gate/Company' },
];

export default function GateSidebar() {
  const router = useRouter();
  const pathname = usePathname();

  const isActive = (to: string) => pathname === to || pathname.startsWith(`${to}/`);

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
          <h1 className="font-bold text-sm text-orange-900 leading-tight truncate">Gate Security</h1>
          <p className="text-xs text-orange-700/70 truncate">Vehicle entry & exit</p>
        </div>
      </div>

      <nav className="space-y-1 flex-1">
        {MENU.map(({ label, icon: Icon, to }) => (
          <button
            key={label}
            onClick={() => router.push(to)}
            className={`hod-sidebar__item ${isActive(to) ? 'is-active' : ''}`}
          >
            <Icon size={18} />
            <span className="truncate">{label}</span>
          </button>
        ))}
      </nav>

      <div className="pt-4 mt-6 border-t border-orange-200 space-y-2">
        <button
          onClick={() => router.push('/Akeel/Gate/Profile')}
          className="hod-sidebar__link"
        >
          <UserCircle size={18} />
          <span>Profile</span>
        </button>
        <button
          onClick={() => router.push('/Akeel/Gate/Settings')}
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
