'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, ClipboardCheck, CalendarClock, MapPin, Users, Truck, Search, UserCircle, Settings, LogOut } from 'lucide-react';
import { logout } from '../../../../../lib/auth';

const MENU = [
  { to: '/Akeel/Incharge', label: 'Dashboard', icon: <Home size={18} /> },
  { to: '/Akeel/Incharge/Approved', label: 'Requests to Assign', icon: <ClipboardCheck size={18} /> },
  { to: '/Akeel/Incharge/Scheduled', label: 'Scheduled Trips', icon: <CalendarClock size={18} /> },
  { to: '/Akeel/Incharge/Active', label: 'Active Vehicles', icon: <MapPin size={18} /> },
  { to: '/Akeel/Incharge/Driver', label: 'Manage Drivers', icon: <Users size={18} /> },
  { to: '/Akeel/Incharge/Vehicle', label: 'Manage Vehicles', icon: <Truck size={18} /> },
  { to: '/Akeel/Incharge/Track', label: 'Track by Request ID', icon: <Search size={18} /> },
];

export default function InchargeSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const warmRoutes = React.useMemo(() => MENU.map(m => m.to).concat(['/Akeel/Incharge/Profile', '/Akeel/Incharge/Settings']), []);

  const isActive = (to: string) => pathname === to || pathname.startsWith(`${to}/`);

  React.useEffect(() => {
    // Warm common routes during idle time to reduce perceived lag; swallow errors if backend is offline.
    const idle = (cb: () => void, timeoutMs: number) => {
      if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
        try { (window as any).requestIdleCallback(cb, { timeout: timeoutMs }); return; } catch {}
      }
      setTimeout(cb, timeoutMs);
    };

    warmRoutes.forEach((p, i) => {
      idle(() => {
        try { router.prefetch?.(p).catch(() => undefined); } catch {}
      }, 120 + 60 * i);
    });
  }, [router, warmRoutes]);

  const handleLogout = async () => {
    // Optimistic, fast redirect; don't wait on network
    router.push('/login');
    router.refresh();
    try {
      await logout();
    } catch (err) {
      console.warn('Logout failed, forcing redirect anyway', err);
    }
  };

  return (
    <aside className="hod-sidebar w-64 min-w-64 shrink-0 h-screen sticky top-0 bg-orange-100 p-4 border-r border-orange-200 flex flex-col">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-2xl border border-orange-200 bg-white/80 flex items-center justify-center shadow-sm">
          <Image src="/spclogopic.png" width={36} height={36} alt="SPC" className="object-contain" priority />
        </div>
        <div className="min-w-0">
          <h1 className="font-bold text-sm text-orange-900 leading-tight truncate">State Printing Corporation</h1>
          <p className="text-xs text-orange-700/70 truncate">Vehicle In-Charge</p>
        </div>
      </div>

      <nav className="space-y-1 flex-1">
        {MENU.map(({ to, label, icon }) => (
          <Link
            key={label}
            href={to}
            prefetch
            className={`hod-sidebar__item ${isActive(to) ? 'is-active' : ''}`}
            aria-current={isActive(to) ? 'page' : undefined}
          >
            {icon}
            <span className="truncate">{label}</span>
          </Link>
        ))}
      </nav>

      <div className="pt-4 mt-6 border-t border-orange-200 space-y-2">
        <Link href="/Akeel/Incharge/Profile" prefetch className="hod-sidebar__link">
          <UserCircle size={18} />
          <span>Profile</span>
        </Link>
        <Link href="/Akeel/Incharge/Settings" prefetch className="hod-sidebar__link">
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
