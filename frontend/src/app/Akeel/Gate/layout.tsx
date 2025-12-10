'use client';

import type { ReactNode } from 'react';
import RequireRole from '../../../../components/guards/RequireRole';
import GateSidebar from './components/GateSidebar';
import GateTopbar from './components/GateTopbar';

const GATE_ROLES = ['GATE_SECURITY'] as const;

export default function GateLayout({ children }: { children: ReactNode }) {
  return (
    <RequireRole roles={GATE_ROLES}>
      <div className="flex min-h-screen bg-orange-50 text-orange-900">
        <GateSidebar />
        <div className="flex-1 flex flex-col min-h-screen">
          <GateTopbar />
          <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">{children}</main>
        </div>
      </div>
    </RequireRole>
  );
}
