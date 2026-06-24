'use client';

import { useSetPageTitle } from '@/hooks/useSetPageTitle';
import { useTranslations } from 'next-intl';

export default function LocationsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = useTranslations('locations');
  useSetPageTitle(t('title'));

  return <>{children}</>;
}