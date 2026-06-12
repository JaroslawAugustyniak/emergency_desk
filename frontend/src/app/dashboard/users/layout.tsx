'use client';

import { useSetPageTitle } from '@/hooks/useSetPageTitle';
import { useTranslations } from 'next-intl';

export default function UsersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = useTranslations('users');
  useSetPageTitle(t('title'));

  return <>{children}</>;
}