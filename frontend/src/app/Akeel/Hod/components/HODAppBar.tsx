'use client';

import { useEffect, useState } from 'react';
import WorkspaceTopbar from '../../../../../components/workspace/WorkspaceTopbar';
import { listByStatus } from '../../Transport/services/usageService';

interface HODAppBarProps {
  onMenuToggle?: () => void;
}

export default function HODAppBar({ onMenuToggle }: HODAppBarProps) {
  const [notif, setNotif] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const rows = await listByStatus('PENDING_HOD' as any);
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
      title="Transport Approval Workspace"
      subtitle="Head of Department"
      profileHref="/Akeel/Hod/Profile"
      roleLabel="HOD"
      notificationHref="/Akeel/Hod/Pending"
      notificationCount={notif}
      notificationLoading={loading}
    />
  );
}
