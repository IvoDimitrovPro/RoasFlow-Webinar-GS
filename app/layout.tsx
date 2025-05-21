import { ReactNode } from 'react';
import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import '@stream-io/video-react-sdk/dist/css/styles.css';
import 'react-datepicker/dist/react-datepicker.css';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';

export const metadata: Metadata = {
  title: 'RoasFlow',
  description: 'Video calling App',
  icons: {
    icon: '/icons/logo.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="bg">
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
        <body className="bg-dark-2" style={{ fontFamily: 'SF Pro Display' }}>
          <Toaster />
          {children}
        </body>
      </ClerkProvider>
    </html>
  );
}
