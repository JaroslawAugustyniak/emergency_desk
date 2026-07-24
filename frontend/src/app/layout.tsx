import "./globals.css";
import { getLocale, getMessages } from 'next-intl/server';
import type { Metadata, Viewport } from 'next';
import { Providers } from '@/app/components/providers'; // dostosuj ścieżkę

export const metadata: Metadata = {
  title: 'Emergency Desk',
  description: 'Professional repair job management system for technicians',
  icons: {
    icon: '/images/favicon.png',
    shortcut: '/images/favicon.png',
    apple: '/images/favicon.png',
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Emergency Desk',
  },
  formatDetection: {
    telephone: true,
    email: true,
    address: true,
  },
  themeColor: '#347ab8',
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
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/images/favicon.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Emergency Desk" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body>
        <Providers messages={messages} locale={locale}>
          {children}
        </Providers>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                navigator.serviceWorker.register('/sw.js').then(registration => {
                  console.log('Service Worker registered:', registration);
                }).catch(error => {
                  console.log('Service Worker registration failed:', error);
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}