'use client';

import RequireRole from '../../../../components/guards/RequireRole';
import ApplicantSidebar from './components/ApplicantSidebar';
import ApplicantTopBar from './components/ApplicantTopBar';

export default function ApplicantLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireRole roles={['STAFF']}>
      <div className="hod-shell flex min-h-screen bg-orange-50 text-orange-900 transition-colors duration-300">
        <ApplicantSidebar />
        <div className="flex-1 flex flex-col min-h-screen">
          <ApplicantTopBar />
          <main className="hod-main flex-1 overflow-y-auto p-4 md:p-6 space-y-4">{children}</main>
        </div>
      </div>
    </RequireRole>
  );
}
