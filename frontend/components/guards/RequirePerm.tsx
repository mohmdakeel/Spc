// src/components/guards/RequirePerm.tsx
'use client';
import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../hooks/useAuth';

export default function RequirePerm({ perms, children }: { perms: string[]; children: ReactNode }) {
  const { user, loading, can } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) router.replace('/login');
      else if (!can(perms)) router.replace('/403');
    }
  }, [loading, user, perms, router, can]);

  if (loading || !user) return <div className="p-6">Checking access…</div>;
  return <>{can(perms) ? children : null}</>;
}
