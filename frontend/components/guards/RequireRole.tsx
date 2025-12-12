// src/components/guards/RequireRole.tsx
'use client';
import { ReactNode, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '../../hooks/useAuth';

interface RequireRoleProps {
  roles: string | string[];
  children: ReactNode;
  fallback?: ReactNode;
}

export default function RequireRole({ roles, children, fallback }: RequireRoleProps) {
  const { user, loading, hasRole } = useAuth();
  const router = useRouter();
  const pathname = usePathname() || '/';

  useEffect(() => {
    if (loading) return;

    // Not logged in → go to login (no nested next params)
    if (!user) {
      router.replace('/login');
      return;
    }

    // Wait for roles to be present before deciding
    if (!user.roles || user.roles.length === 0) return;

    // Logged in but wrong role → show access denied screen
    if (!hasRole(roles)) {
      router.replace('/403');
    }
  }, [loading, user, roles, router, hasRole, pathname]);

  if (loading || !user || !user.roles || user.roles.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Checking permissions...</p>
        </div>
      </div>
    );
  }

  if (!hasRole(roles)) {
    return null;
  }

  return <>{children}</>;
}
