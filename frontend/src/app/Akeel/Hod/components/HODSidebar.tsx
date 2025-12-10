'use client';

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Home, ListChecks, CheckCircle2, XCircle, Briefcase, MapPin, UserCircle, Settings, LogOut } from 'lucide-react';
import { logout } from '../../../../../lib/auth';

export default function HODSidebar() {
  const [collapsed, setCollapsed] = React.useState(false);
  const router = useRouter();
  const path = usePathname();
  const go = (p: string) => router.push(p);
  const isActive = (p: string) => path === p || path?.startsWith(p + '/');

  const Item = ({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) => {
    const active = isActive(to);
    return (
      <button
        onClick={() => go(to)}
        className={`hod-sidebar__item ${collapsed ? 'justify-center' : ''} ${active ? 'is-active' : ''}`}
        title={label}
        aria-current={active ? 'page' : undefined}
      >
        {icon}
        {!collapsed && <span className="truncate">{label}</span>}
      </button>
    );
  };

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <aside className={`hod-sidebar ${collapsed ? 'w-20' : 'w-64'} h-screen p-4 transition-all flex flex-col`}>
      <div className="flex items-center gap-2 mb-6">
        <Briefcase className="text-orange-600" />
        {!collapsed && <h1 className="font-bold">HOD Panel</h1>}
      </div>

      <button
        onClick={() => setCollapsed((c) => !c)}
        className="mb-4 w-full rounded py-2 text-sm hod-sidebar__toggle"
      >
        {collapsed ? 'Expand' : 'Collapse'}
      </button>

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
          className={`hod-sidebar__link ${collapsed ? 'justify-center' : ''}`}
        >
          <UserCircle size={18} />
          {!collapsed && <span>Profile</span>}
        </button>
        <button
          onClick={() => go('/Akeel/Hod/Settings')}
          className={`hod-sidebar__link ${collapsed ? 'justify-center' : ''}`}
        >
          <Settings size={18} />
          {!collapsed && <span>Settings</span>}
        </button>
        <button
          onClick={handleLogout}
          className={`hod-sidebar__danger ${collapsed ? 'justify-center' : ''}`}
        >
          <LogOut size={18} />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}
