'use client';

import { useEffect, useState } from 'react';
import WorkspaceTopbar from '../../../../../components/workspace/WorkspaceTopbar';
import { LogOut } from 'lucide-react';
import { logout } from '../../../../../lib/auth';
import { listByStatus } from '../../Transport/services/usageService';

export default function GateTopbar() {
  const [notif, setNotif] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [scheduled, dispatched] = await Promise.all([
          listByStatus('SCHEDULED' as any).catch(() => []),
          listByStatus('DISPATCHED' as any).catch(() => []),
        ]);
        setNotif((scheduled?.length || 0) + (dispatched?.length || 0));
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
      title="Gate Security"
      subtitle="Vehicle gate control"
      profileHref="/Akeel/Gate/Profile"
      roleLabel="Gate"
      notificationHref="/Akeel/Gate/Scheduled"
      notificationCount={notif}
      notificationLoading={loading}
      actions={
        <button
          type="button"
          onClick={() => logout()}
          className="inline-flex items-center gap-2 rounded-full border border-white/40 px-3 py-1.5 text-xs font-semibold text-white/90 hover:bg-white/15 transition"
        >
          <LogOut size={14} />
          Logout
        </button>
      }
    />
  );
}
