// components/Topbar.tsx
'use client';

import React from 'react';
import { LogOut, User as UserIcon, Settings } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { logout } from '../lib/auth';
import { useAuth } from '../hooks/useAuth';

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

  // fall back to context (guarded)
  let ctxUser: UIUser = null;
  try {
    ({ user: ctxUser } = useAuth());
  } catch {
    ctxUser = null;
  }
  const user = propUser ?? ctxUser ?? null;

  const displayName =
    user?.fullName?.trim() ||
    user?.name?.trim() ||
    user?.username?.trim() ||
    'User';

  const usernameLine = user?.username ? `@${user.username}` : '';

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      router.push('/login');
      router.refresh();
    }
  };

  return (
    <nav className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-4 flex justify-between items-center shadow-lg border-b border-orange-400">
      {/* Left: Brand */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
            <span className="text-lg font-bold text-white">🚗</span>
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">State Printing Corporation ERP Sytem</h1>
            <p className="text-orange-100 text-sm">Welcome back, {displayName}</p>
          </div>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => router.push('/settings')}
          className="p-2 hover:bg-white/20 rounded-lg transition-all duration-200 group"
          title="Settings"
        >
          <Settings className="w-5 h-5 group-hover:scale-110 transition-transform" />
        </button>

        <div className="flex items-center space-x-3 bg-white/10 rounded-lg px-3 py-2">
          <button
            onClick={() => router.push('/profile')}
            className="flex items-center space-x-3 hover:bg-white/20 rounded-lg transition-all duration-200 p-1"
          >
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center overflow-hidden border-2 border-white/30">
              {user?.imageUrl ? (
                <img
                  src={user.imageUrl}
                  alt={displayName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <UserIcon className="w-4 h-4 text-white" />
              )}
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold leading-none">{displayName}</p>
              {usernameLine && (
                <p className="text-xs text-orange-100 leading-none mt-1">{usernameLine}</p>
              )}
            </div>
          </button>
        </div>

        <button
          onClick={handleLogout}
          className="bg-white/20 hover:bg-white hover:text-orange-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-all duration-200 font-medium border border-white/30 hover:border-white group"
        >
          <LogOut className="w-4 h-4 group-hover:scale-110 transition-transform" />
          <span>Logout</span>
        </button>
      </div>
    </nav>
  );
}