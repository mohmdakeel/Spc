'use client';

import WorkspaceTopbar from '../../../../../components/workspace/WorkspaceTopbar';

interface ApplicantTopBarProps {
  onMenuToggle?: () => void;
}

export default function ApplicantTopBar({ onMenuToggle }: ApplicantTopBarProps) {
  return (
    <WorkspaceTopbar
      onMenuToggle={onMenuToggle}
      title="Request Workspace"
      subtitle="Transport Applicant"
      profileHref="/Akeel/Applicant/Profile"
      roleLabel="Applicant"
    />
  );
}
