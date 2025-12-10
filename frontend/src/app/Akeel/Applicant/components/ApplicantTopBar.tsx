'use client';

import { useEffect, useState } from 'react';
import WorkspaceTopbar from '../../../../../components/workspace/WorkspaceTopbar';
import { useAuth } from '../../../../../hooks/useAuth';
import { listMyRequests } from '../../Transport/services/usageService';

interface ApplicantTopBarProps {
  onMenuToggle?: () => void;
}

export default function ApplicantTopBar({ onMenuToggle }: ApplicantTopBarProps) {
  const { user } = useAuth();
  const [notif, setNotif] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!user?.employeeId) return;
      setLoading(true);
      try {
        const res = await listMyRequests(user.employeeId);
        const items: any[] = Array.isArray(res)
          ? res
          : Array.isArray((res as any)?.content)
          ? (res as any).content
          : [];
        const active = items.filter((r) => r.status && r.status !== 'RETURNED');
        setNotif(active.length);
      } catch {
        setNotif(0);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user?.employeeId]);

  return (
    <WorkspaceTopbar
      onMenuToggle={onMenuToggle}
      title="Request Workspace"
      subtitle="Transport Applicant"
      profileHref="/Akeel/Applicant/Profile"
      roleLabel="Applicant"
      notificationHref="/Akeel/Applicant/MyRequests"
      notificationCount={notif}
      notificationLoading={loading}
    />
  );
}
