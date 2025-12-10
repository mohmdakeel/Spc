'use client';

import type { ReactNode } from 'react';
import RequireRole from '../../../../components/guards/RequireRole';

const GATE_ROLES = ['GATE_SECURITY'] as const;

export default function GateLayout({ children }: { children: ReactNode }) {
  return <RequireRole roles={GATE_ROLES}>{children}</RequireRole>;
}
