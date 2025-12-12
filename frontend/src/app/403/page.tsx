// app/403/page.tsx
'use client';
import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function AccessDenied() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/login');
  }, [router]);

  return null;
}
