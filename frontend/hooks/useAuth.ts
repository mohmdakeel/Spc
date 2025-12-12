// hooks/useAuth.tsx - Enhanced version
'use client';
import { useEffect, useRef, useState } from 'react';
import { clearAuthCaches, me } from '../lib/auth';
import { User } from '../types';
import { usePathname, useRouter } from 'next/navigation';

const PUBLIC_ROUTES = ['/login', '/_error', '/403'];
const CACHE_KEY = 'auth:user-cache';
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

const readCachedUser = (): User | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { user: User; ts: number };
    if (!parsed?.user || !parsed?.ts) return null;
    if (Date.now() - parsed.ts > CACHE_TTL_MS) return null;
    return parsed.user;
  } catch {
    return null;
  }
};

const writeCachedUser = (user: User | null) => {
  if (typeof window === 'undefined') return;
  try {
    if (user) {
      window.sessionStorage.setItem(CACHE_KEY, JSON.stringify({ user, ts: Date.now() }));
    } else {
      window.sessionStorage.removeItem(CACHE_KEY);
    }
  } catch {
    /* ignore cache failures */
  }
};

export const useAuth = () => {
  const initialUser = typeof window !== 'undefined' ? readCachedUser() : null;
  const [user, setUserState] = useState<User | null>(initialUser);
  const [loading, setLoading] = useState(!initialUser);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const mounted = useRef(false);

  const setUser = (u: User | null) => {
    if (!mounted.current) return;
    setUserState(u);
    writeCachedUser(u);
  };

  useEffect(() => {
    mounted.current = true;
    let cancelled = false;

    const isPublic = PUBLIC_ROUTES.some(route => pathname?.startsWith(route));
    const redirectToLogin = () => {
      if (pathname?.startsWith('/login')) return;
      router.replace('/login');
    };

    // Skip auth check for public routes but keep any cached user
    if (isPublic) {
      setLoading(false);
      setError(null);
      return () => { mounted.current = false; cancelled = true; };
    }

    const run = async () => {
      setError(null);

      // Show cache immediately; only block UI if we truly have no session
      const cachedUser = readCachedUser();
      if (cachedUser) setUser(cachedUser);
      const blockWhileFetching = !cachedUser;
      if (blockWhileFetching) setLoading(true);

      try {
        const data = await me();
        if (cancelled || !mounted.current) return;

        if (!data) {
          setUser(null);
          setError(null);
          writeCachedUser(null);
          clearAuthCaches();
          redirectToLogin();
          return;
        }

        setUser(data);
        setError(null);
        clearAuthCaches();
      } catch (err: any) {
        console.error('Auth check failed:', err);
        if (cancelled || !mounted.current) return;
        setError(err?.response?.data?.message || err?.message || 'Authentication failed');
        setUser(null);
        writeCachedUser(null);
        clearAuthCaches();
        redirectToLogin();
      } finally {
        if (!cancelled && mounted.current && blockWhileFetching) {
          setLoading(false);
        }
      }
    };

    run();

    return () => {
      cancelled = true;
      mounted.current = false;
    };
  }, [pathname, router]);

  const refresh = async () => {
    if (!mounted.current) return null;
    setLoading(true);
    setError(null);
    try {
      const data = await me();
      if (!mounted.current) return null;
      if (!data) {
        setUser(null);
        setError('Session expired. Please sign in again.');
        clearAuthCaches();
        if (!pathname?.startsWith('/login')) {
          router.replace('/login');
        }
        return null;
      }

      clearAuthCaches();
      setUser(data);
      setError(null);
      return data;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to refresh user data');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Keep username handy for other modules (e.g., audit headers)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (user?.username) {
      window.localStorage.setItem('username', user.username);
    } else {
      window.localStorage.removeItem('username');
    }
  }, [user?.username]);

  const hasRole = (roles: string | string[]) => {
    if (!user?.roles) return false;
    const arr = Array.isArray(roles) ? roles : [roles];
    const userRoles = user.roles.map(r => r.toUpperCase());
    return arr.some(r => userRoles.includes(r.toUpperCase()));
  };

  const can = (perms: string | string[]) => {
    if (!user?.permissions) return false;
    const arr = Array.isArray(perms) ? perms : [perms];
    return user.permissions.some(p => arr.includes(p));
  };

  const hasAnyRole = () => {
    return !!(user?.roles && user.roles.length > 0);
  };

  return { 
    user, 
    setUser, 
    loading, 
    error,
    refresh, 
    hasRole, 
    can,
    hasAnyRole
  };
};
