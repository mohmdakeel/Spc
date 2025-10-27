// hooks/useAuth.tsx - Enhanced version
'use client';
import { useEffect, useRef, useState } from 'react';
import { me } from '../lib/auth';
import { User } from '../types';
import { usePathname, useRouter } from 'next/navigation';

const PUBLIC_ROUTES = ['/login', '/_error'];

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    setError(null);

    // Skip auth check for public routes
    if (PUBLIC_ROUTES.some(route => pathname?.startsWith(route))) {
      setLoading(false);
      return () => { mounted.current = false; };
    }

    (async () => {
      try {
        const data = await me();
        if (mounted.current) {
          setUser(data);
          setError(null);
        }
      } catch (err: any) {
        console.error('Auth check failed:', err);
        if (mounted.current) {
          setError(err.response?.data?.message || 'Authentication failed');
          setUser(null);
          
          // Only redirect if not already on login page
          if (!pathname?.startsWith('/login')) {
            const returnUrl = encodeURIComponent(pathname || '/');
            router.replace(`/login?next=${returnUrl}`);
          }
        }
      } finally {
        if (mounted.current) setLoading(false);
      }
    })();

    return () => { mounted.current = false; };
  }, [pathname, router]);

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await me();
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

  const hasRole = (roles: string | string[]) => {
    if (!user?.roles) return false;
    const arr = Array.isArray(roles) ? roles : [roles];
    return user.roles.some(r => arr.includes(r));
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