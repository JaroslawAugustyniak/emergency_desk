import "./globals.css";
import { getLocale, getMessages } from 'next-intl/server';
import type { Metadata, Viewport } from 'next';
import { Providers } from '@/app/components/providers'; // dostosuj ścieżkę

export const metadata: Metadata = {
  title: 'Emergency Desk',
  description: 'Desk for emergency jobs',
  icons: {
    icon: '/images/favicon.png',
    shortcut: '/images/favicon.png',
    apple: '/images/favicon.png',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <link rel="icon" type="image/png" href="/images/favicon.png" />
      </head>
      <body>
        <Providers messages={messages} locale={locale}>
          {children}
        </Providers>
      </body>
    </html>
  );
}