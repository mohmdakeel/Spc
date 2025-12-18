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
import React, { useState } from 'react';

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
  const [showConfirm, setShowConfirm] = useState(false);

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
    try {
      await logout();
    } finally {
      // hard reload to fully reset app state
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      } else {
        router.push('/login');
      }
    }
  };

  return (
    <>
      <aside
        className={`hod-sidebar w-64 min-w-64 shrink-0 h-screen sticky top-0 bg-orange-100 p-4 border-r border-orange-200 flex flex-col transition-transform duration-300 ${
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
                className={`hod-sidebar__item ${active ? 'is-active' : ''}`}
                aria-current={active ? 'page' : undefined}
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
            className="hod-sidebar__link"
          >
            <UserCircle size={18} />
            <span>Profile</span>
          </Link>
          <Link
            href="/settings"
            onClick={onClose}
            className="hod-sidebar__link"
          >
            <Settings size={18} />
            <span>Settings</span>
          </Link>
          <button
            onClick={() => setShowConfirm(true)}
            className="hod-sidebar__danger"
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {showConfirm && (
        <div
          className="fixed inset-0 bg-black/40 z-50 grid place-items-center p-4"
          onClick={() => setShowConfirm(false)}
        >
          <div
            className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden border border-orange-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 px-4 py-3 border-b bg-orange-50">
              <div className="w-10 h-10 rounded-lg border border-orange-200 bg-white/80 flex items-center justify-center overflow-hidden">
                <Image src="/spclogopic.png" alt="SPC" width={32} height={32} className="object-contain" />
              </div>
              <div>
                <p className="text-sm font-semibold text-orange-900">Logout</p>
                <p className="text-xs text-orange-700/80">Are you sure you want to logout?</p>
              </div>
            </div>
            <div className="px-4 py-3 flex justify-end gap-2 bg-white">
              <button
                className="px-4 py-2 rounded border border-orange-200 text-orange-700 hover:bg-orange-50"
                onClick={() => setShowConfirm(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 rounded bg-orange-600 text-white hover:bg-orange-700"
                onClick={() => {
                  setShowConfirm(false);
                  handleLogout();
                }}
              >
                Yes, logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
