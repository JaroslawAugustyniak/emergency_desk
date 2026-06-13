'use client';

import { useSetPageTitle } from '@/hooks/useSetPageTitle';
import { useTranslations } from 'next-intl';

export default function ClientsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = useTranslations('clients');
  useSetPageTitle(t('title'));

  return <>{children}</>;
}
