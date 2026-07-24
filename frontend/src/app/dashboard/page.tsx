'use client';

import { useTranslations } from 'next-intl';
import { useSessionContext } from '@/app/components/providers/SessionProvider';

export default function DashboardPage() {
  const t = useTranslations('dashboard');
  const { user } = useSessionContext();

  return (
    <div className="">
      <h1 className="text-2xl font-bold md:mb-8">
        {t('welcome', {name: user?.first_name+' '+user?.last_name || 'Gościu'})}
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
