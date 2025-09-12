'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { ChevronDown, ChevronUp, LayoutDashboard, Settings, LogOut, BarChart2, Users } from 'lucide-react';

export default function AdminSidebar() {
  const pathname = usePathname();
  const [openReports, setOpenReports] = useState(true);
  const [openUsers, setOpenUsers] = useState(true);

  // Fixed, full-height, scrollable left rail. Width = 16rem (w-64)
  return (
    <aside className="fixed top-0 left-0 z-40 w-64 h-screen bg-white border-r border-gray-200 overflow-y-auto">
      {/* Header */}
      <div className="h-16 px-4 flex items-center gap-2 border-b">
        <div className="w-8 h-8 rounded-full bg-blue-600 text-white grid place-content-center font-bold">A</div>
        <div>
          <p className="text-sm text-gray-500">Management System</p>
          <h1 className="font-semibold">Admin Panel</h1>
        </div>
      </div>

      {/* Nav */}
      <nav className="p-3 space-y-2">
        <SidebarLink
          href="/Dewmini/Marketing/dashboard"
          icon={<LayoutDashboard className="w-5 h-5" />}
          label="Dashboard"
          active={pathname?.startsWith('/Dewmini/Marketing/dashboard')}
        />

        {/* Reports group */}
        <button
          className="w-full flex items-center justify-between px-3 py-2 text-left rounded-md hover:bg-gray-100"
          onClick={() => setOpenReports((v) => !v)}
        >
          <span className="flex items-center gap-3 text-gray-700">
            <BarChart2 className="w-5 h-5" />
            Reports
          </span>
          {openReports ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        {openReports && (
          <div className="ml-10 space-y-1">
            <MiniLink href="#" label="Bin Card" />
            <MiniLink href="#" label="Stock Valuation" />
            <MiniLink href="#" label="Stock Availability" />
            <MiniLink href="#" label="Verification of Stock" />
            <MiniLink href="#" label="Asset Verification" />
          </div>
        )}

        {/* Users group */}
        <button
          className="w-full flex items-center justify-between px-3 py-2 text-left rounded-md hover:bg-gray-100"
          onClick={() => setOpenUsers((v) => !v)}
        >
          <span className="flex items-center gap-3 text-gray-700">
            <Users className="w-5 h-5" />
            User Management
          </span>
          {openUsers ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        {openUsers && (
          <div className="ml-10 space-y-1">
            <MiniLink href="/Dewmini/Marketing/transcript" label="All Users" />
            <MiniLink href="/Dewmini/Marketing/transcript/register" label="Add New User" />
            <MiniLink href="#" label="Roles & Permissions" />
            <MiniLink href="#" label="User Activity Logs" />
          </div>
        )}

        <div className="pt-4 border-t mt-4 space-y-2">
          <SidebarLink
            href="/Dewmini/Marketing/settings"
            icon={<Settings className="w-5 h-5" />}
            label="Settings"
            active={pathname?.startsWith('/Dewmini/Marketing/settings')}
          />
          <button className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-gray-100 text-red-600">
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </nav>
    </aside>
  );
}

function SidebarLink({
  href,
  icon,
  label,
  active,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-3 py-2 rounded-md ${
        active ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
      }`}
    >
      {icon}
      {label}
    </Link>
  );
}

function MiniLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="block px-2 py-1 text-sm rounded hover:bg-gray-100 text-gray-700">
      {label}
    </Link>
  );
}
