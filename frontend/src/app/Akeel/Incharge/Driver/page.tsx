'use client';

import dynamic from 'next/dynamic';
import { useAuth } from '../../../../../hooks/useAuth';

// Reuse the Transport driver management page inside the Incharge workspace
const DriverPage = dynamic(() => import('../../Transport/Driver/page'), { ssr: false });

export default function InchargeDriverPage() {
  const { user } = useAuth();
  const isAdmin = user?.roles?.includes('ADMIN');
  const isIncharge = user?.roles?.includes('VEHICLE_INCHARGE');

  if (!isAdmin && !isIncharge) {
    return (
      <div className="p-6 bg-white border border-orange-200 rounded-xl text-sm text-red-700">
        You do not have permission to manage drivers. Please contact an administrator.
      </div>
    );
  }

  return <DriverPage />;
}
