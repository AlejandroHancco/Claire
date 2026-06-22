'use client';

import { Toaster } from 'react-hot-toast';

export default function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        style: {
          background: '#1f2937',
          color: '#f9fafb',
          border: '1px solid #374151',
          borderRadius: '10px',
          fontSize: '14px',
        },
        success: {
          iconTheme: { primary: '#818cf8', secondary: '#fff' },
        },
        error: {
          iconTheme: { primary: '#ef4444', secondary: '#fff' },
        },
      }}
    />
  );
}
