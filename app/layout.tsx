import { ReactNode } from 'react';
import type { Metadata, Viewport } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import '@stream-io/video-react-sdk/dist/css/styles.css';
import 'react-datepicker/dist/react-datepicker.css';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { TranslationProvider } from '@/components/TranslationProvider';

// Define metadata for SEO
export const metadata: Metadata = {
  metadataBase: new URL('http://localhost:3000'),
  title: {
    default: 'RoasFlow | Видео конферентна платформа',
    template: '%s | RoasFlow',
  },
  description: 'Сигурна видео конферентна платформа с функции за запис, споделяне на екрана и уебинари',
  keywords: ['видео конференция', 'онлайн срещи', 'уебинари', 'видео разговори', 'RoasFlow'],
  authors: [{ name: 'RoasFlow Team', url: 'https://roasflow.com/about' }],
  creator: 'RoasFlow',
  publisher: 'RoasFlow',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'bg_BG',
    alternateLocale: 'en_US',
    title: 'RoasFlow | Видео конферентна платформа',
    description: 'Сигурна видео конферентна платформа с функции за запис, споделяне на екрана и уебинари',
    siteName: 'RoasFlow',
    images: [
      {
        url: '/images/og-image.png',
        width: 1200,
        height: 630,
        alt: 'RoasFlow Video Conferencing Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'RoasFlow | Видео конферентна платформа',
    description: 'Сигурна видео конферентна платформа с функции за запис, споделяне на екрана и уебинари',
    images: ['/images/twitter-image.png'],
    creator: '@roasflow',
  },
  icons: {
    icon: [
      { url: '/icons/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/icons/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icons/favicon.ico', sizes: 'any' },
    ],
    apple: [
      { url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      {
        rel: 'mask-icon',
        url: '/icons/safari-pinned-tab.svg',
        color: '#0E78F9',
      },
    ],
  },
  manifest: '/manifest.json',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-video-preview': -1,
      'max-snippet': -1,
    },
  },
};

// Define viewport settings
export const viewport: Viewport = {
  themeColor: '#0E78F9',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="bg">
      <head>
        <meta name="application-name" content="RoasFlow" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="RoasFlow" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-TileColor" content="#0E78F9" />
        <meta name="msapplication-tap-highlight" content="no" />
        <meta name="theme-color" content="#0E78F9" />
        
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/apple-touch-icon-152x152.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-touch-icon-180x180.png" />
        <link rel="apple-touch-icon" sizes="167x167" href="/icons/apple-touch-icon-167x167.png" />

        <link rel="icon" type="image/png" sizes="32x32" href="/icons/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icons/favicon-16x16.png" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="mask-icon" href="/icons/safari-pinned-tab.svg" color="#0E78F9" />
        <link rel="shortcut icon" href="/icons/favicon.ico" />
      </head>
      <ClerkProvider
        signInFallbackRedirectUrl="/sign-in"
        signUpFallbackRedirectUrl="/sign-up"
        appearance={{
          layout: {
            socialButtonsVariant: 'iconButton',
            logoImageUrl: '/icons/roasflow-logo.svg',
          },
          variables: {
            colorText: '#fff',
            colorPrimary: '#0E78F9',
            colorBackground: '#1C1F2E',
            colorInputBackground: '#252A41',
            colorInputText: '#fff',
          },
        }}
      >
        <TranslationProvider>
          <body className="bg-dark-2" style={{ fontFamily: 'SF Pro Display' }}>
            <Toaster />
            {children}
          </body>
        </TranslationProvider>
      </ClerkProvider>
    </html>
  );
}
