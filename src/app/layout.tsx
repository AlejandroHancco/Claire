import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans, Inter } from 'next/font/google';
import { cookies } from 'next/headers';
import ToastProvider from '@/components/ToastProvider';
import './globals.css';

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '600', '700'],
  variable: '--font-display',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  variable: '--font-body',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Claire — Control Financiero',
  description: 'Seguimiento privado de ingresos y egresos',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Claire',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#0A0A0F',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = cookies();
  const theme = cookieStore.get('claire-theme')?.value === 'pink' ? 'pink' : 'dark';

  return (
    <html
      lang="es"
      className={`${theme} ${plusJakartaSans.variable} ${inter.variable}`}
      suppressHydrationWarning
    >
      <body className="antialiased">
        {children}
        <ToastProvider />
      </body>
    </html>
  );
}
