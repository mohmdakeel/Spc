'use client';

import React from 'react';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { Home, ListChecks, CheckCircle2, XCircle, Briefcase, MapPin, UserCircle, Settings, LogOut } from 'lucide-react';
import { logout } from '../../../../../lib/auth';

export default function HODSidebar() {
  const router = useRouter();
  const path = usePathname();
  const go = (p: string) => router.push(p);
  const isActive = (p: string) => path === p || path?.startsWith(p + '/');

  const Item = ({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) => {
    const active = isActive(to);
    return (
      <button
        onClick={() => go(to)}
        className={`hod-sidebar__item ${active ? 'is-active' : ''}`}
        title={label}
        aria-current={active ? 'page' : undefined}
      >
        {icon}
        <span className="truncate">{label}</span>
      </button>
    );
  };

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
        <Item to="/Akeel/Hod"           icon={<Home size={18} />}        label="Dashboard" />
        <Item to="/Akeel/Hod/Pending"   icon={<ListChecks size={18} />}  label="Pending Approvals" />
        <Item to="/Akeel/Hod/Approved"  icon={<CheckCircle2 size={18} />} label="Approved" />
        <Item to="/Akeel/Hod/Rejected"  icon={<XCircle size={18} />}     label="Rejected" />
        <Item to="/Akeel/Hod/Track"     icon={<MapPin size={18} />}      label="Track by Request ID" />
      </nav>

      <div className="pt-4 mt-6 border-t border-orange-200 space-y-2">
        <button
          onClick={() => go('/Akeel/Hod/Profile')}
          className="hod-sidebar__link"
        >
          <UserCircle size={18} />
          <span>Profile</span>
        </button>
        <button
          onClick={() => go('/Akeel/Hod/Settings')}
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
