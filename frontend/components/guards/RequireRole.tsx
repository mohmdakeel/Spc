// src/components/guards/RequireRole.tsx
'use client';
import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../hooks/useAuth';

export default function RequireRole({ roles, children }: { roles: string[]; children: ReactNode }) {
  const { user, loading, hasRole } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) router.replace('/login');
      else if (!hasRole(roles)) router.replace('/403');
    }
  }, [loading, user, roles, router, hasRole]);

  if (loading || !user) return <div className="p-6">Checking access…</div>;
  return <>{hasRole(roles) ? children : null}</>;
}
