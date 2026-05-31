'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

export default function DashboardPage() {
  const router = useRouter();
  const t = useTranslations('dashboard');
  const [userName, setUserName] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('access_token');

    if (!token) {
      router.push('/login');
      return;
    }

    // Fetch user profile to get name
    const fetchUserProfile = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://api.starter.localhost'}/api/auth/profile`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          throw new Error('Failed to fetch profile');
        }

        const data = await res.json();
        setUserName(data.data?.name || '');
      } catch (error) {
        console.error('Error fetching profile:', error);
        localStorage.removeItem('access_token');
        router.push('/login');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserProfile();
  }, [router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="md:-mt-18">
      <h1 className="text-2xl font-bold md:mb-8">
        {t('welcome', { name: userName })}
      </h1>

      <p className="text-slate-600 mb-6">
        {t('summary')}
      </p>

      <div className="bg-white p-8 rounded shadow-sm">
        <p className="text-slate-700">
          Witaj w aplikacji. Tutaj pojawi się zawartość dashboardu.
        </p>
      </div>
    </div>
  );
}