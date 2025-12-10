'use client';

import dynamic from 'next/dynamic';

// Reuse the Applicant profile UI for Incharge to keep parity
const ApplicantProfilePage = dynamic(() => import('../../Applicant/Profile/page'), { ssr: false });

export default function InchargeProfilePage() {
  return <ApplicantProfilePage />;
}
