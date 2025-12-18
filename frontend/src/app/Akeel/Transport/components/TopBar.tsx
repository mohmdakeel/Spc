// frontend/components/Topbar.tsx
'use client';

import React from 'react';
import Image from 'next/image';
import { LogOut, User as UserIcon, Settings } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { logout } from '../../../../../lib/auth';
import { useAuth } from '../../../../../hooks/useAuth';

type UIUser = {
  fullName?: string;
  username?: string;
  name?: string;
  imageUrl?: string;
} | null | undefined;

interface TopbarProps {
  /** Optional: if not provided, we fall back to useAuth() */
  user?: UIUser;
}

export default function Topbar({ user: propUser }: TopbarProps) {
  const router = useRouter();
  const { user: ctxUser } = useAuth();
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
    } catch (e) {
      console.error('Logout failed:', e);
    } finally {
      router.push('/login');
      router.refresh();
    }
  };

  return (
    <nav className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 flex justify-between items-center shadow-lg border-b border-blue-500">
      {/* Left: Brand */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
            <span className="text-lg font-bold text-white">🚗</span>
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">SPC Transport System</h1>
            <p className="text-blue-100 text-sm">Welcome back, {displayName}</p>
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
                <Image
                  src={user.imageUrl}
                  alt={displayName}
                  width={32}
                  height={32}
                  className="w-full h-full object-cover"
                  unoptimized
                />
              ) : (
                <UserIcon className="w-4 h-4 text-white" />
              )}
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold leading-none">{displayName}</p>
              {usernameLine && (
                <p className="text-xs text-blue-100 leading-none mt-1">{usernameLine}</p>
              )}
            </div>
          </button>
        </div>

        <button
          onClick={handleLogout}
          className="bg-white/20 hover:bg-white hover:text-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-all duration-200 font-medium border border-white/30 hover:border-white group"
        >
          <LogOut className="w-4 h-4 group-hover:scale-110 transition-transform" />
          <span>Logout</span>
        </button>
      </div>
    </nav>
  );
}
