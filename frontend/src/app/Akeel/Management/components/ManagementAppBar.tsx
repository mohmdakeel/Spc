'use client';

import { ReactNode, useMemo } from 'react';
import Link from 'next/link';
import { FileText, LogOut } from 'lucide-react';
import WorkspaceTopbar from '../../../../../components/workspace/WorkspaceTopbar';
import { logout } from '../../../../../lib/auth';

interface ManagementAppBarProps {
  onMenuToggle?: () => void;
}

export default function ManagementAppBar({ onMenuToggle }: ManagementAppBarProps) {
  const actions: ReactNode = useMemo(
    () => (
      <>
        <Link
          href="/reports"
          className="inline-flex items-center gap-2 rounded-full border border-white/40 px-3 py-1.5 text-xs font-semibold text-white/90 hover:bg-white/15 transition"
        >
          <FileText size={14} />
          Reports
        </Link>
        <button
          type="button"
          onClick={() => logout()}
          className="inline-flex items-center gap-2 rounded-full border border-white/40 px-3 py-1.5 text-xs font-semibold text-white/90 hover:bg-white/15 transition"
        >
          <LogOut size={14} />
          Logout
        </button>
      </>
    ),
    []
  );

  return (
    <WorkspaceTopbar
      onMenuToggle={onMenuToggle}
      title="Management Queue"
      subtitle="Transport Oversight"
      profileHref="/Akeel/Management/Profile"
      roleLabel="Management"
      actions={actions}
    />
  );
}

