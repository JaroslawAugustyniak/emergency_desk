'use client';

import { useSetPageTitle } from '@/hooks/useSetPageTitle';
import { useTranslations } from 'next-intl';

export default function OrdersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = useTranslations('orders');
  useSetPageTitle(t('title'));

  return <>{children}</>;
}
