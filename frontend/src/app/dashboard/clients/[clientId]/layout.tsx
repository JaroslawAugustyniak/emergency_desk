'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useSetPageTitle } from '@/hooks/useSetPageTitle';
import { useTranslations } from 'next-intl';

import { useSessionContext } from '@/app/components/providers/SessionProvider';
import { getClient } from '@/lib/actions/clients';
import { formatClientsNumber } from '@/lib/functions/formatting';

export default function ClientDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const clientId = Array.isArray(params.clientId) ? Number(params.clientId[0]) : Number(params.clientId);
  const [clientName, setClientName] = useState<string>('');
  const { token } = useSessionContext();

  useEffect(() => {
    if (!token || !clientId) return;

    const fetchClient = async () => {
      try {
        const data = await getClient(Number(clientId), token);
        setClientName(data.data.name);
      } catch (error) {
        console.error('Error fetching client:', error);
      }
    };

    fetchClient();
  }, [token, clientId]);

  const t = useTranslations('clients');

  useSetPageTitle(
    clientName ? `${formatClientsNumber(clientId)} - ${clientName}` : ''
  );

  return <>{children}</>;
}
