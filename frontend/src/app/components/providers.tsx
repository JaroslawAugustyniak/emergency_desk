'use client';

import { ThemeProvider } from 'next-themes';
import { NextIntlClientProvider } from 'next-intl';
import SessionProvider from '@/app/components/providers/SessionProvider';

export function Providers({
  children,
  messages,
  locale
}: {
  children: React.ReactNode;
  messages: any;
  locale: string;
}) {
  return (
    <SessionProvider>
      <NextIntlClientProvider messages={messages} locale={locale}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          {children}
        </ThemeProvider>
      </NextIntlClientProvider>
    </SessionProvider>
  );
}