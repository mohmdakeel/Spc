'use client';

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  Home,
  CalendarClock,
  Users,
  Building,
  Shield,
  Gauge,
  History
} from 'lucide-react';

export default function GateSidebar() {
  const [collapsed, setCollapsed] = React.useState(false);
  const router = useRouter();
  const path = usePathname();

  const go = (p: string) => router.push(p);
  const isActive = (p: string) => path === p || path?.startsWith(p + '/');

  const Item = ({
    to,
    icon,
    label
  }: {
    to: string;
    icon: React.ReactNode;
    label: string;
  }) => {
    const active = isActive(to);
    return (
      <button
        onClick={() => go(to)}
        title={collapsed ? label : undefined}
        aria-current={active ? 'page' : undefined}
        className={[
          'w-full px-3 py-2 rounded flex items-center gap-2 text-sm transition-colors',
          active
            ? 'bg-orange-600 text-white'
            : 'text-orange-900 hover:bg-orange-200'
        ].join(' ')}
      >
        {icon}
        {!collapsed && <span className="truncate">{label}</span>}
      </button>
    );
  };

  return (
    <aside
      className={[
        collapsed ? 'w-20' : 'w-64',
        'h-screen bg-orange-100 p-4 transition-all sticky top-0'
      ].join(' ')}
    >
      <div className="flex items-center gap-2 mb-6">
        <Shield className="text-orange-600" />
        {!collapsed && <h1 className="font-bold text-orange-900">Gate Security</h1>}
      </div>

      <button
        onClick={() => setCollapsed(c => !c)}
        className="mb-4 w-full bg-orange-200 hover:bg-orange-300 rounded py-2 text-xs font-medium text-orange-900"
        aria-pressed={collapsed}
      >
        {collapsed ? 'Expand' : 'Collapse'}
      </button>

      <nav className="space-y-1">
        <Item to="/Akeel/Gate"            icon={<Home size={18} />}          label="Dashboard" />
        <Item to="/Akeel/Gate/Scheduled"   icon={<CalendarClock size={18} />} label="Scheduled Vehicles" />
        <Item to="/Akeel/Gate/Active"      icon={<Gauge size={18} />}         label="Active Vehicles" />
        <Item to="/Akeel/Gate/History"     icon={<History size={18} />}       label="Trips History" />
        <Item to="/Akeel/Gate/Visitors"    icon={<Users size={18} />}         label="Visitor Vehicles" />
        <Item to="/Akeel/Gate/Company"     icon={<Building size={18} />}      label="Company Vehicles" />
      </nav>
    </aside>
  );
}
