'use client';

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Home, CheckCircle2, CalendarClock, Car } from 'lucide-react'; // ⬅️ replaced SteeringWheel with Car

export default function InchargeSidebar() {
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
        <Car className="text-orange-600" />  {/* ⬅️ replaced SteeringWheel */}
        {!collapsed && <h1 className="font-bold">Vehicle In-Charge</h1>}
      </div>

      <button
        onClick={() => setCollapsed((c) => !c)}
        className="mb-4 w-full bg-orange-200 rounded py-2 text-sm"
      >
        {collapsed ? 'Expand' : 'Collapse'}
      </button>

      <nav className="space-y-1">
        <Item to="/Akeel/Incharge"           icon={<Home size={18} />}          label="Dashboard" />
        <Item to="/Akeel/Incharge/Approved"  icon={<CheckCircle2 size={18} />}  label="Approved (Assign)" />
        <Item to="/Akeel/Incharge/Scheduled" icon={<CalendarClock size={18} />} label="Scheduled" />
      </nav>
    </aside>
  );
}
