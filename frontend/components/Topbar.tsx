// components/Topbar.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Settings, Building2, Sun, Moon, UserCircle2, Bell } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from './ThemeProvider';

type UIUser = {
  fullName?: string;
  username?: string;
  name?: string;
  imageUrl?: string;
} | null | undefined;

interface TopbarProps {
  user?: UIUser; // optional: if omitted we'll use useAuth()
}

export default function Topbar({ user: propUser }: TopbarProps) {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const { user: ctxUser } = useAuth();
  const user = propUser ?? ctxUser ?? null;

  const displayName =
    user?.fullName?.trim() ||
    user?.name?.trim() ||
    user?.username?.trim() ||
    'User';

  const usernameLine = user?.username ? `@${user.username}` : '';

  return (
    <header className="hod-app-bar bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md border-b border-orange-400">
      <div className="mx-auto w-full px-4 sm:px-6 lg:px-8 py-3 flex items-center gap-4">
        <div className="flex items-center gap-3 flex-1">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-orange-100 font-semibold">SPC Authservice</p>
              <h1 className="text-lg md:text-xl font-bold leading-tight">Administration Workspace</h1>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-white/20 transition"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <button
            type="button"
            aria-label="Notifications"
            className="p-2 rounded-full hover:bg-white/20 transition"
          >
            <Bell size={18} />
          </button>

          <button
            onClick={() => router.push('/settings')}
            className="p-2 rounded-full hover:bg-white/20 transition"
            aria-label="Settings"
          >
            <Settings size={18} />
          </button>

          <Link
            href="/profile"
            className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full border border-white/20 hover:bg-white/20 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            <span className="relative inline-flex items-center justify-center w-10 h-10 rounded-full border border-white/40 bg-white/10 overflow-hidden">
              {user?.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.imageUrl} alt={displayName} className="w-full h-full object-cover" />
              ) : (
                <UserCircle2 size={26} className="text-white" />
              )}
            </span>
            <div className="hidden sm:block text-xs leading-tight">
              <p className="font-semibold">{displayName}</p>
              {usernameLine ? <p className="text-orange-100">{usernameLine}</p> : null}
              <p className="text-orange-100/80 text-[10px] tracking-wide">Auth Admin</p>
            </div>
          </Link>

        </div>
      </div>
    </header>
  );
}
