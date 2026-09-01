'use client';

import { useSetPageTitle } from '@/hooks/useSetPageTitle';
import { useTranslations } from 'next-intl';

export default function TechnicianRevenueLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = useTranslations('reports');
  useSetPageTitle(t('technicianRevenueReport'));

  return <>{children}</>;
}
