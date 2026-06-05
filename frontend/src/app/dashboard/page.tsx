'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { useSessionContext } from '@/app/components/providers/SessionProvider';
import { getProfile } from '@/lib/actions/profile';

export default function DashboardPage() {
  const t = useTranslations('dashboard');
  const { token } = useSessionContext();
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    if (!token) {
      return;
    }

    const fetchProfile = async () => {
      try {
        const data = await getProfile(token);
        console.log(data);
        setProfile(data);
      } catch (error) {
        console.error('Failed to fetch profile:', error);
      }
    };

    fetchProfile();
  }, [token]);

  return (
    <div className="">
      <h1 className="text-2xl font-bold md:mb-8">
        {t('welcome', {name: profile?.name || 'Gościu'})}
      </h1>

      <p className="text-slate-600 mb-6">
        {t('summary')}
      </p>

      <div className="flex flex-col md:flex-row lg:flex-row lg:items-start gap-6">
           {/* Stoper */}
        
      </div>

 

 
    </div>
  );
}
