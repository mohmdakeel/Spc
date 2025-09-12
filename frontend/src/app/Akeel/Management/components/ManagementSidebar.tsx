'use client';

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Home, ListChecks, CheckCircle2, XCircle, Briefcase } from 'lucide-react';

export default function ManagementSidebar() {
  const [collapsed, setCollapsed] = React.useState(false);
  const router = useRouter();
  const path = usePathname();
  const go = (p: string) => router.push(p);
  const isActive = (p: string) => path === p || path?.startsWith(p + '/');

  const Item = ({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) => (
    <button
      onClick={() => go(to)}
      className={`w-full px-3 py-2 rounded flex items-center gap-2 ${
        isActive(to) ? 'bg-orange-600 text-white' : 'hover:bg-orange-200'
      }`}
    >
      {icon}
      {!collapsed && label}
    </button>
  );

  return (
    <aside className={`${collapsed ? 'w-20' : 'w-64'} h-screen bg-orange-100 p-4 transition-all`}>
      <div className="flex items-center gap-2 mb-6">
        <Briefcase className="text-orange-600" />
        {!collapsed && <h1 className="font-bold">Management</h1>}
      </div>

      <button
        onClick={() => setCollapsed((c) => !c)}
        className="mb-4 w-full bg-orange-200 rounded py-2 text-sm"
      >
        {collapsed ? 'Expand' : 'Collapse'}
      </button>

      <nav className="space-y-1">
        <Item to="/Akeel/Management"           icon={<Home size={18} />}         label="Dashboard" />
        <Item to="/Akeel/Management/Pending"   icon={<ListChecks size={18} />}   label="Pending Approvals" />
        <Item to="/Akeel/Management/Approved"  icon={<CheckCircle2 size={18} />} label="Approved" />
        <Item to="/Akeel/Management/Rejected"  icon={<XCircle size={18} />}      label="Rejected" />
      </nav>
    </aside>
  );
}
