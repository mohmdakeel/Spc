'use client';

import { ReactNode, useEffect, useMemo, useState } from 'react';
import { LogOut } from 'lucide-react';
import WorkspaceTopbar from '../../../../../components/workspace/WorkspaceTopbar';
import { logout } from '../../../../../lib/auth';
import { listByStatus } from '../../Transport/services/usageService';

interface ManagementAppBarProps {
  onMenuToggle?: () => void;
}

export default function ManagementAppBar({ onMenuToggle }: ManagementAppBarProps) {
  const actions: ReactNode = useMemo(
    () => (
      <button
        type="button"
        onClick={() => logout()}
        className="inline-flex items-center gap-2 rounded-full border border-white/40 px-3 py-1.5 text-xs font-semibold text-white/90 hover:bg-white/15 transition"
      >
        <LogOut size={14} />
        Logout
      </button>
    ),
    []
  );

  const [notif, setNotif] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const rows = await listByStatus('PENDING_MANAGEMENT' as any);
        setNotif(Array.isArray(rows) ? rows.length : 0);
      } catch {
        setNotif(0);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <WorkspaceTopbar
      onMenuToggle={onMenuToggle}
      title="Management Queue"
      subtitle="Transport Oversight"
      profileHref="/Akeel/Management/Profile"
      roleLabel="Management"
      actions={actions}
      notificationHref="/Akeel/Management/Pending"
      notificationCount={notif}
      notificationLoading={loading}
    />
  );
}
