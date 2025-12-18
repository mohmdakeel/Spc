'use client';

import { Suspense, useEffect, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import DSREditForm from '../../components/DSREditForm'; // ⬅️ adjust path to where you place the component

function EditFormInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const idParam = searchParams.get('id');

  const id = useMemo(() => {
    const n = Number(idParam);
    return Number.isFinite(n) ? n : NaN;
  }, [idParam]);

  useEffect(() => {
    if (!idParam || Number.isNaN(id)) {
      toast.error('Invalid or missing id');
      // change fallback route to your list page route
      router.replace('/Dewmini/Transport/Admin/DriverServiceRequests');
    }
  }, [idParam, id, router]);

  if (!idParam || Number.isNaN(id)) return null;

  return (
    <DSREditForm
      id={id}
      onClose={() => router.back()}
      onUpdated={() => router.back()}
    />
  );
}

export default function EditFormPage() {
  return (
    <Suspense fallback={<div className="p-4 text-sm text-gray-600">Loading request…</div>}>
      <EditFormInner />
    </Suspense>
  );
}
