'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import UserDetailActions from '@/app/components/users/UserDetailActions';
import Link from 'next/link';
import { useSessionContext } from '@/app/components/providers/SessionProvider';
import { useRouter } from 'next/navigation';

type User = {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  phone?: string;
  created_at?: string;
  updated_at?: string;
};

export default function UserDetailPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params?.userId as string;

  const t = useTranslations('users');
  const tCommon = useTranslations('common');
  const { token, isLoading } = useSessionContext();

  const [user, setUser] = useState<User | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token || isLoading || !userId) return;

    const fetchUser = async () => {
      try {
        setIsLoadingData(true);
        const res = await fetch(`/api/users/${userId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          throw new Error('Failed to fetch user');
        }

        const data = await res.json();
        setUser(data.data);
      } catch (err) {
        console.error('Error fetching user:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch user');
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchUser();
  }, [token, isLoading, userId]);

  if (isLoading || isLoadingData) {
    return (
      <div className="space-y-6">
        <div>Ładowanie...</div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="space-y-6">
        <div className="text-red-600">{error || 'User not found'}</div>
        <Link
          href="/dashboard/users"
          className="text-blue-600 hover:text-blue-700"
        >
          ← {tCommon('back')}
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with back button */}
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/dashboard/users"
            className="text-blue-600 hover:text-blue-700 text-sm mb-2 inline-block"
          >
            ← {tCommon('back')}
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">
            {user.first_name} {user.last_name}
          </h1>
        </div>
        <UserDetailActions user={user} />
      </div>

      {/* User Details Card */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">{tCommon('details')}</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              {t('emailColumn')}
            </label>
            <p className="text-base text-gray-900">{user.email}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              {t('roleColumn')}
            </label>
            <p className="text-base text-gray-900 uppercase">{user.role}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              {t('firstName')}
            </label>
            <p className="text-base text-gray-900">{user.first_name}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              {t('lastName')}
            </label>
            <p className="text-base text-gray-900">{user.last_name}</p>
          </div>

          {user.phone && (
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                {t('phone')}
              </label>
              <p className="text-base text-gray-900">{user.phone}</p>
            </div>
          )}

          {user.created_at && (
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                {t('createdAt')}
              </label>
              <p className="text-base text-gray-900">
                {new Date(user.created_at).toLocaleDateString()}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
