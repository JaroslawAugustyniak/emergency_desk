'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useSetPageTitle } from '@/hooks/useSetPageTitle';
import { useTranslations } from 'next-intl';

export default function ClientDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const clientId = Array.isArray(params.clientId) ? params.clientId[0] : params.clientId;
  const [clientName, setClientName] = useState<string>('');

  useEffect(() => {
    if (clientId) {
      fetch(`http://api.starter.localhost/api/clients/${clientId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.data) {
            setClientName(data.data.name);
          }
        })
        .catch(() => {
          // Handle error silently
        });
    }
  }, [clientId]);

  const t = useTranslations('clients');

  useSetPageTitle(t('title'),
    clientName ? `c${clientId} - ${clientName}` : ''
  );

  return <>{children}</>;
}
