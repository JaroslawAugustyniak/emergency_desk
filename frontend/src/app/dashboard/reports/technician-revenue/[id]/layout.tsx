'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useSetPageTitle } from '@/hooks/useSetPageTitle';
import { useTranslations } from 'next-intl';
import { useSessionContext } from '@/app/components/providers/SessionProvider';

export default function TechnicianDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = useTranslations('reports');
  const params = useParams();
  const { token } = useSessionContext();
  const [technicianName, setTechnicianName] = useState<string>('');
  const technicianId = params.id as string;

  useEffect(() => {
    if (!token || !technicianId) return;

    const fetchTechnician = async () => {
      try {
        const response = await fetch(`/api/users/${technicianId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
        
          const userName = data.data ? data.data.first_name+'  '+data.data.last_name : '';
        
          setTechnicianName(userName);
        }
      } catch (err) {
        console.error('Error fetching technician:', err);
      }
    };

    fetchTechnician();
  }, [token, technicianId]);

  const title = technicianName
    ? `${t('technicianRevenueReport')} - ${technicianName}`
    : t('technicianRevenueReport');

  useSetPageTitle(title);

  return <>{children}</>;
}
