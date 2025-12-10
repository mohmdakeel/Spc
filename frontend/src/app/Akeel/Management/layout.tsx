'use client';

import type { ReactNode } from 'react';
import RequireRole from '../../../../components/guards/RequireRole';
import ManagementSidebar from './components/ManagementSidebar';
import ManagementAppBar from './components/ManagementAppBar';

const MANAGEMENT_ROLES = ['HR', 'HRD', 'HRM', 'GM', 'GENERAL_MANAGER', 'CHAIRMAN', 'MANAGEMENT'] as const;

export default function ManagementLayout({ children }: { children: ReactNode }) {
  return (
    <RequireRole roles={MANAGEMENT_ROLES}>
      <div className="hod-shell flex min-h-screen bg-orange-50 text-orange-900 transition-colors duration-300">
        <ManagementSidebar />
        <div className="flex-1 flex flex-col min-h-screen">
          <ManagementAppBar />
          <main className="hod-main flex-1 overflow-y-auto p-4 md:p-6 space-y-4">{children}</main>
        </div>
      </div>
    </RequireRole>
  );
}
