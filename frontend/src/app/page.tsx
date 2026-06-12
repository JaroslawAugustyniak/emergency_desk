'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSessionContext } from '@/app/components/providers/SessionProvider';

export default function HomePage() {
  const router = useRouter();
  const { token, isLoading } = useSessionContext();

  useEffect(() => {
    if (isLoading) return;

    if (token) {
      router.push('/dashboard');
    } else {
      router.push('/login');
    }
  }, [token, isLoading, router]);

  return null;
}
