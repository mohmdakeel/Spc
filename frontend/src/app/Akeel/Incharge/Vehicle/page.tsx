'use client';

import dynamic from 'next/dynamic';
import { useAuth } from '../../../../../hooks/useAuth';

// Reuse the Transport vehicle management page inside the Incharge workspace
const VehiclePage = dynamic(() => import('../../Transport/Vehicle/page'), { ssr: false });

export default function InchargeVehiclePage() {
  const { user } = useAuth();
  const isAdmin = user?.roles?.includes('ADMIN');
  const isIncharge = user?.roles?.includes('VEHICLE_INCHARGE');

  if (!isAdmin && !isIncharge) {
    return (
      <div className="p-6 bg-white border border-orange-200 rounded-xl text-sm text-red-700">
        You do not have permission to manage vehicles. Please contact an administrator.
      </div>
    );
  }

  return <VehiclePage />;
}
