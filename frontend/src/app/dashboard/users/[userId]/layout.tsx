'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useSetPageTitle } from '@/hooks/useSetPageTitle';
import { useTranslations } from 'next-intl';

export default function UserDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const userId = params.userId as string;
  const [userName, setUserName] = useState<string>('');

  useEffect(() => {
    if (userId) {
      fetch(`http://api.starter.localhost/api/users/${userId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.data) {
            setUserName(`${data.data.first_name} ${data.data.last_name}`);
          }
        })
        .catch(() => {
          // Handle error silently
        });
    }
  }, [userId]);

  const t = useTranslations('users');

  useSetPageTitle(t('title'),
    userName ? `${userName}` : ''
  );

  return <>{children}</>;
}