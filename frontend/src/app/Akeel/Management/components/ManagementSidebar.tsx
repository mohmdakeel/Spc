'use client';

import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { Home, ListChecks, CheckCircle2, XCircle, Search, UserCircle, Settings, LogOut } from 'lucide-react';
import { logout } from '../../../../../lib/auth';

const MENU = [
  { label: 'Dashboard', icon: Home, to: '/Akeel/Management' },
  { label: 'Pending', icon: ListChecks, to: '/Akeel/Management/Pending' },
  { label: 'Approved', icon: CheckCircle2, to: '/Akeel/Management/Approved' },
  { label: 'Rejected', icon: XCircle, to: '/Akeel/Management/Rejected' },
  { label: 'Track Request', icon: Search, to: '/Akeel/Management/Track' },
];

export default function ManagementSidebar() {
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
          <Image src="/spclogopic.png" width={36} height={36} alt="SPC" className="object-contain" priority />
        </div>
        <div className="min-w-0">
          <h1 className="font-bold text-sm text-orange-900 leading-tight truncate">State Printing Corporation</h1>
          <p className="text-xs text-orange-700/70 truncate">Management Workspace</p>
        </div>
      </div>

      <nav className="space-y-1 flex-1">
        {MENU.map(({ label, icon: Icon, to }) => {
          const active = isActive(to);
          return (
            <button
              key={label}
              onClick={() => router.push(to)}
              className={`hod-sidebar__item ${active ? 'is-active' : ''}`}
            >
              <Icon size={18} />
              <span className="truncate">{label}</span>
            </button>
          );
        })}
      </nav>

      <div className="pt-4 mt-6 border-t border-orange-200 space-y-2">
        <button
          onClick={() => router.push('/Akeel/Management/Profile')}
          className="hod-sidebar__link"
        >
          <UserCircle size={18} />
          <span>Profile</span>
        </button>
        <button
          onClick={() => router.push('/Akeel/Management/Settings')}
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
