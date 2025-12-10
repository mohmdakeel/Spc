'use client';

import Link from 'next/link';
import { Moon, Sun, Bell, Menu, UserCircle2 } from 'lucide-react';
import { ReactNode } from 'react';
import { useTheme } from '../ThemeProvider';
import { useAuth } from '../../hooks/useAuth';

interface WorkspaceTopbarProps {
  title: string;
  subtitle: string;
  profileHref: string;
  roleLabel?: string;
  onMenuToggle?: () => void;
  actions?: ReactNode;
}

export default function WorkspaceTopbar({
  title,
  subtitle,
  profileHref,
  roleLabel = 'Workspace',
  onMenuToggle,
  actions,
}: WorkspaceTopbarProps) {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const displayName =
    user?.fullName?.trim() ||
    user?.username?.trim() ||
    user?.name?.trim() ||
    'User';

  const dept = user?.department?.trim() || '';

  return (
    <header className="hod-app-bar bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md border-b border-orange-400">
      <div className="mx-auto w-full px-4 sm:px-6 lg:px-8 py-3 flex items-center gap-4">
        {onMenuToggle ? (
          <button
            type="button"
            onClick={onMenuToggle}
            className="md:hidden p-2 rounded-lg hover:bg-white/20 transition"
            aria-label="Toggle menu"
          >
            <Menu size={20} />
          </button>
        ) : null}

        <div className="flex-1">
          <p className="text-xs uppercase tracking-wide text-orange-100 font-semibold">
            {subtitle}
          </p>
          <h1 className="text-lg md:text-xl font-bold leading-tight">{title}</h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-white/20 transition"
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <button
            type="button"
            className="p-2 rounded-full hover:bg-white/20 transition"
            aria-label="Notifications"
          >
            <Bell size={18} />
          </button>

          {actions ? (
            <div className="hidden sm:flex items-center gap-2">{actions}</div>
          ) : null}

          <Link
            href={profileHref}
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
              {dept ? <p className="text-orange-100 capitalize">{dept}</p> : null}
              <p className="text-orange-100/80 text-[10px] tracking-wide">{roleLabel}</p>
            </div>
          </Link>
        </div>
      </div>
    </header>
  );
}

