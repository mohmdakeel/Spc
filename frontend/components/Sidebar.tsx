'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import {
  Home,
  Users,
  User,
  Shield,
  Settings,
  History,
  UserCircle,
  LogOut,
  BarChart3,
} from 'lucide-react';
import { logout } from '../lib/auth';

interface SidebarProps {
  user: {
    roles: string[];
    permissions: string[];
  };
  isOpen: boolean;
  onClose: () => void;
}

const MENU = [
  { text: 'Dashboard', icon: Home, path: '/dashboard', roles: ['ADMIN', 'AUTH_ADMIN', 'HRD', 'HOD', 'GM', 'CHAIRMAN', 'TRANSPORT_ADMIN', 'TRANSPORT', 'VEHICLE_INCHARGE'], perm: 'READ' },
  { text: 'Employees', icon: Users, path: '/employees', roles: ['ADMIN', 'HRD', 'HOD', 'GM', 'TRANSPORT_ADMIN'], perm: 'READ' },
  { text: 'Users', icon: User, path: '/users', roles: ['ADMIN', 'AUTH_ADMIN', 'HRD'], perm: 'READ' },
  { text: 'Roles', icon: Shield, path: '/roles', roles: ['ADMIN'], perm: 'READ' },
  { text: 'Permissions', icon: Settings, path: '/permissions', roles: ['ADMIN'], perm: 'READ' },
  { text: 'History', icon: History, path: '/history', roles: ['ADMIN', 'AUTH_ADMIN', 'HRD', 'HOD', 'GM', 'TRANSPORT_ADMIN'], perm: 'READ' },
  { text: 'Reports', icon: BarChart3, path: '/reports', roles: ['ADMIN', 'HRD', 'HOD', 'GM', 'CHAIRMAN'], perm: 'READ' },
];

export default function Sidebar({ user, isOpen, onClose }: SidebarProps) {
  const pathname = usePathname() || '';
  const router = useRouter();

  const hasRole = (roles?: string[]) => {
    if (!roles || roles.length === 0) return true;
    return roles.some((role) => user.roles?.includes(role));
  };

  const hasPerm = (perm?: string) => {
    if (!perm) return true;
    return user.permissions?.includes(perm);
  };

  const visibleMenu = MENU.filter((item) => hasRole(item.roles) && hasPerm(item.perm));

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <aside
      className={`hod-sidebar w-[260px] shrink-0 h-screen sticky top-0 bg-orange-100 border-r border-orange-200 flex flex-col p-4 transition-transform duration-300 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } md:translate-x-0`}
    >
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
          <h1 className="font-bold text-sm text-orange-900 leading-tight truncate">
            State Printing Corporation
          </h1>
          <p className="text-xs text-orange-700/70 truncate">Auth Service Control</p>
        </div>
      </div>

      <nav className="space-y-1 flex-1">
        {visibleMenu.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          return (
            <Link
              key={item.text}
              href={item.path}
              onClick={onClose}
              className={`w-full px-3 py-2 rounded flex items-center gap-2 text-sm transition ${
                active ? 'bg-orange-600 text-white' : 'text-orange-900 hover:bg-orange-200'
              }`}
            >
              <Icon size={18} />
              <span className="truncate">{item.text}</span>
            </Link>
          );
        })}
      </nav>

      <div className="pt-4 mt-6 border-t border-orange-200 space-y-2">
        <Link
          href="/profile"
          onClick={onClose}
          className="w-full px-3 py-2 rounded flex items-center gap-2 text-sm text-orange-900 hover:bg-orange-200 transition"
        >
          <UserCircle size={18} />
          <span>Profile</span>
        </Link>
        <Link
          href="/settings"
          onClick={onClose}
          className="w-full px-3 py-2 rounded flex items-center gap-2 text-sm text-orange-900 hover:bg-orange-200 transition"
        >
          <Settings size={18} />
          <span>Settings</span>
        </Link>
        <button
          onClick={handleLogout}
          className="w-full px-3 py-2 rounded flex items-center gap-2 text-sm text-red-600 border border-red-100 hover:bg-red-50 transition"
        >
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
