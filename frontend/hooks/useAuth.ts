// hooks/useAuth.tsx
'use client';
import { useEffect, useRef, useState } from 'react';
import { me } from '../lib/auth';
import { User } from '../types';
import { usePathname, useRouter } from 'next/navigation';

const PUBLIC_ROUTES = ['/login'];

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;

    if (PUBLIC_ROUTES.includes(pathname)) {
      setLoading(false);
      return () => { mounted.current = false; };
    }

    (async () => {
      try {
        const data = await me(); // GET /api/auth/me
        if (mounted.current) setUser(data);
      } catch {
        router.replace('/login');
      } finally {
        if (mounted.current) setLoading(false);
      }
    })();

    return () => { mounted.current = false; };
  }, [pathname, router]);

  const refresh = async () => {
    setLoading(true);
    try {
      const data = await me();
      setUser(data);
    } finally {
      setLoading(false);
    }
  };

  const hasRole = (roles: string | string[]) => {
    const arr = Array.isArray(roles) ? roles : [roles];
    return !!user?.roles?.some(r => arr.includes(r));
  };

  const can = (perms: string | string[]) => {
    const arr = Array.isArray(perms) ? perms : [perms];
    return !!user?.permissions?.some(p => arr.includes(p));
  };

  return { user, setUser, loading, refresh, hasRole, can };
};
