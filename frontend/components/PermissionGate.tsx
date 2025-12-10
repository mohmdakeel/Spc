'use client';

import { ReactNode } from 'react';
import { useAuth } from '../hooks/useAuth';

type PermissionGateProps = {
  require?: string | string[];
  fallback?: ReactNode;
  children: ReactNode;
};

export function PermissionGate({ require, fallback = null, children }: PermissionGateProps) {
  const { can } = useAuth();

  if (!require || can(require)) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
}
