'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useSetPageTitle } from '@/hooks/useSetPageTitle';
import { useTranslations } from 'next-intl';

import { useSessionContext } from '@/app/components/providers/SessionProvider';

export default function LocationDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const locationId = params.locationId as string;

  const { token } = useSessionContext();
  const [locationName, setLocationName] = useState<string>('');

  useEffect(() => {
    if (!token || !locationId) return;

    const fetchLocation = async () => {
      try {
        const res = await fetch(`/api/locations/${locationId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          throw new Error('Failed to fetch location');
        }

        const data = await res.json();
        
        setLocationName(`c${data.data.client_id}p${data.data.id} - ${data.data.name}`);

      } catch (error) {
        console.error('Error fetching location:', error);
        
      } 
    };

    fetchLocation();
  }, [token, locationId]);

  const t = useTranslations('locations');

  useSetPageTitle( 
    locationName ? `${locationName}` : ''
  );

  return <>{children}</>;
}