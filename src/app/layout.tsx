import type { Metadata, Viewport } from 'next';
import ToastProvider from '@/components/ToastProvider';
import './globals.css';

export const metadata: Metadata = {
  title: 'Claire — Control Financiero',
  description: 'Seguimiento privado de ingresos y egresos',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="antialiased">
        {children}
        <ToastProvider />
      </body>
    </html>
  );
}
