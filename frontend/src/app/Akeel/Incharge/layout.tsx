'use client';

import RequireRole from '../../../../components/guards/RequireRole';
import InchargeSidebar from './components/InchargeSidebar';
import InchargeTopbar from './components/InchargeTopbar';

export default function InchargeLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireRole roles={['VEHICLE_INCHARGE']}>
      <div className="hod-shell flex min-h-screen bg-orange-50 text-orange-900 transition-colors duration-300">
        <InchargeSidebar />
        <div className="flex-1 flex flex-col min-h-screen">
          <InchargeTopbar />
          <main className="hod-main flex-1 overflow-y-auto p-4 md:p-6 space-y-4">{children}</main>
        </div>
      </div>
    </RequireRole>
  );
}
