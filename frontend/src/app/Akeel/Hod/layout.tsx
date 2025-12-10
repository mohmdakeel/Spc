'use client';

import type { ReactNode } from 'react';
import RequireRole from '../../../../components/guards/RequireRole';
import HODSidebar from './components/HODSidebar';
import HODAppBar from './components/HODAppBar';

const HOD_ROLES: string[] = ['HOD'];

export default function HodLayout({ children }: { readonly children: ReactNode }) {
  return (
    <RequireRole roles={HOD_ROLES}>
      <div className="hod-shell flex min-h-screen bg-orange-50 text-orange-900 transition-colors duration-300">
        <HODSidebar />
        <div className="flex-1 flex flex-col min-h-screen">
          <HODAppBar />
          <main className="hod-main flex-1 overflow-y-auto p-4 md:p-6 space-y-4">{children}</main>
        </div>
      </div>
    </RequireRole>
  );
}
