'use client';

import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { Home, ClipboardCheck, CalendarClock, MapPin, Users, Truck, Search, UserCircle, Settings, LogOut } from 'lucide-react';
import { logout } from '../../../../../lib/auth';

const MENU = [
  { to: '/Akeel/Incharge', label: 'Dashboard', icon: Home },
  { to: '/Akeel/Incharge/Approved', label: 'Requests to Assign', icon: ClipboardCheck },
  { to: '/Akeel/Incharge/Scheduled', label: 'Scheduled Trips', icon: CalendarClock },
  { to: '/Akeel/Incharge/Active', label: 'Active Vehicles', icon: MapPin },
  { to: '/Akeel/Incharge/Driver', label: 'Manage Drivers', icon: Users },
  { to: '/Akeel/Incharge/Vehicle', label: 'Manage Vehicles', icon: Truck },
  { to: '/Akeel/Incharge/AvailableDrivers', label: 'Available Drivers', icon: Users },
  { to: '/Akeel/Incharge/AvailableVehicles', label: 'Available Vehicles', icon: Truck },
  { to: '/Akeel/Incharge/Track', label: 'Track by Request ID', icon: Search },
];

export default function InchargeSidebar() {
  const router = useRouter();
  const pathname = usePathname();

  const isActive = (to: string) => pathname === to || pathname.startsWith(`${to}/`);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.warn('Logout failed, forcing redirect anyway', err);
    } finally {
      router.push('/login');
      router.refresh();
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
        {MENU.map(({ to, label, icon: Icon }) => (
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
          onClick={() => router.push('/Akeel/Incharge/Profile')}
          className="hod-sidebar__link"
        >
          <UserCircle size={18} />
          <span>Profile</span>
        </button>
        <button
          onClick={() => router.push('/Akeel/Incharge/Settings')}
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
