'use client';

import { useEffect, useState } from 'react';
import WorkspaceTopbar from '../../../../../components/workspace/WorkspaceTopbar';
import { useAuth } from '../../../../../hooks/useAuth';
import { listMyRequests } from '../../Transport/services/usageService';
import { readCache, writeCache } from '../../../../../lib/cache';

interface ApplicantTopBarProps {
  onMenuToggle?: () => void;
}

export default function ApplicantTopBar({ onMenuToggle }: ApplicantTopBarProps) {
  const { user } = useAuth();
  const cached = user?.employeeId
    ? readCache<any[]>(`cache:applicant:requests:${user.employeeId}`) || []
    : [];
  const [notif, setNotif] = useState(
    cached.length ? cached.filter((r) => r.status && r.status !== 'RETURNED').length : 0
  );
  const [loading, setLoading] = useState(!cached.length);

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
        writeCache(`cache:applicant:requests:${user.employeeId}`, items);
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
