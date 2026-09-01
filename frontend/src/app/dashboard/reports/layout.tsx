'use client';

import { useSetPageTitle } from '@/hooks/useSetPageTitle';
import { useTranslations } from 'next-intl';

export default function ReportsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = useTranslations('reports');
  useSetPageTitle(t('title'));

  return <>{children}</>;
}
