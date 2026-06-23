'use client';

import { LanguageProvider } from '@/contexts/LanguageContext';
import ToastProvider from '@/components/ToastProvider';

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      {children}
      <ToastProvider />
    </LanguageProvider>
  );
}
