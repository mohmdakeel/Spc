'use client';

import * as React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  Home,
  ClipboardCheck,
  CalendarClock,
  MapPin,
  History,
  Users,
  Truck,
  Search
} from 'lucide-react';

type NavItem = {
  to: string;
  label: string;
  icon: React.ReactNode;
};

export default function InchargeSidebar() {
  const [collapsed, setCollapsed] = React.useState(false);
  const router = useRouter();
  const path = usePathname();

  React.useEffect(() => {
    const saved = localStorage.getItem('incharge_sidebar_collapsed');
    if (saved) setCollapsed(saved === '1');
  }, []);
  React.useEffect(() => {
    localStorage.setItem('incharge_sidebar_collapsed', collapsed ? '1' : '0');
  }, [collapsed]);

  const go = (p: string) => router.push(p);
  const isActive = (p: string) => path === p || (path?.startsWith(p + '/') ?? false);

  const items: NavItem[] = [
    { to: '/Akeel/Incharge',                  label: 'Dashboard',           icon: <Home size={18} /> },
    { to: '/Akeel/Incharge/Approved',         label: 'Requests to Assign',  icon: <ClipboardCheck size={18} /> },
    { to: '/Akeel/Incharge/Scheduled',        label: 'Scheduled Trips',     icon: <CalendarClock size={18} /> },
    { to: '/Akeel/Incharge/Active',           label: 'Active Vehicles',     icon: <MapPin size={18} /> },
    { to: '/Akeel/Incharge/History',          label: 'Completed History',   icon: <History size={18} /> },
    { to: '/Akeel/Incharge/AvailableDrivers', label: 'Available Drivers',   icon: <Users size={18} /> },
    { to: '/Akeel/Incharge/AvailableVehicles',label: 'Available Vehicles',  icon: <Truck size={18} /> },
    { to: '/Akeel/Incharge/Track',            label: 'Track by Request ID', icon: <Search size={18} /> },
  ];

  const Item = ({ to, icon, label }: NavItem) => {
    const active = isActive(to);
    return (
      <button
        onClick={() => go(to)}
        title={collapsed ? label : undefined}
        aria-current={active ? 'page' : undefined}
        className={`w-full px-3 py-2 rounded flex items-center gap-2 text-sm transition-colors
          ${active ? 'bg-orange-600 text-white' : 'text-orange-900 hover:bg-orange-200'}`}
      >
        {icon}
        {!collapsed && <span className="truncate">{label}</span>}
      </button>
    );
  };

  return (
    <aside
      className={`${collapsed ? 'w-20' : 'w-64'} h-screen bg-orange-100 p-4 transition-all duration-200 flex flex-col`}
      aria-label="Vehicle In-Charge Navigation"
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <Truck className="text-orange-700" />
        {!collapsed && <h1 className="font-bold text-orange-900 leading-none">Vehicle In-Charge</h1>}
      </div>

      {/* Collapse */}
      <button
        onClick={() => setCollapsed(c => !c)}
        className="mb-4 w-full bg-orange-200 rounded py-2 text-sm text-orange-900 hover:bg-orange-300"
      >
        {collapsed ? 'Expand' : 'Collapse'}
      </button>

      {/* Nav */}
      <nav className="space-y-1 flex-1">
        {items.map(i => (
          <Item key={i.to} {...i} />
        ))}
      </nav>
    </aside>
  );
}
