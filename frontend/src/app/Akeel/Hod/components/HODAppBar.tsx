'use client';

import WorkspaceTopbar from '../../../../../components/workspace/WorkspaceTopbar';

interface HODAppBarProps {
  onMenuToggle?: () => void;
}

export default function HODAppBar({ onMenuToggle }: HODAppBarProps) {
  return (
    <WorkspaceTopbar
      onMenuToggle={onMenuToggle}
      title="Transport Approval Workspace"
      subtitle="Head of Department"
      profileHref="/Akeel/Hod/Profile"
      roleLabel="HOD"
    />
  );
}
