'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useSetPageTitle } from '@/hooks/useSetPageTitle';
import { useTranslations } from 'next-intl';
import { useSessionContext } from '@/app/components/providers/SessionProvider';

export default function UserDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const userId = params.userId as string;
  const [userName, setUserName] = useState<string>('');
  
  const { token, isLoading } = useSessionContext();
  useEffect(() => {

    if (!token || !userId) return;

    const fetchUser = async () => {
      try {

        const res = await fetch(`/api/users/${userId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        

        if (!res.ok) {
          console.log(res);
          throw new Error('Failed to fetch user');
        }

        const data = await res.json();
        
        const userName = data.data ? data.data.first_name+'  '+data.data.last_name : '';
        const clientId = data.data.client_id ? `c${data.data.client_id}/` : '';

        setUserName(`${clientId}u${data.data.id} - ${userName}`);
        
      } catch (error) {
        console.error('Error fetching user:', error);
      } finally {
      }
    };

  fetchUser();
  }, [token, isLoading, userId]);

  const t = useTranslations('users');

  useSetPageTitle(
    userName ? `${userName}` : ''
  );

  return <>{children}</>;
}