'use client';

import { useEffect, useState } from 'react';
import WorkspaceTopbar from '../../../../../components/workspace/WorkspaceTopbar';
import { LogOut } from 'lucide-react';
import { logout } from '../../../../../lib/auth';
import { listByStatus } from '../../Transport/services/usageService';

export default function InchargeTopbar() {
  const [notif, setNotif] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const rows = await listByStatus('SCHEDULED' as any);
        setNotif(Array.isArray(rows) ? rows.length : 0);
      } catch (err) {
        console.warn('Failed to load scheduled count', err);
        setNotif(0);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <WorkspaceTopbar
      title="Vehicle In-Charge"
      subtitle="Transport operations"
      profileHref="/profile"
      roleLabel="In-Charge"
      notificationHref="/Akeel/Incharge/Scheduled"
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
