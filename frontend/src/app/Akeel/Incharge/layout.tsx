'use client';

import RequireRole from '../../../components/guards/RequireRole';

export default function InchargeLayout({ children }: { children: React.ReactNode }) {
  return <RequireRole roles={['VEHICLE_INCHARGE']}>{children}</RequireRole>;
}
