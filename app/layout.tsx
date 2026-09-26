import type { Metadata } from 'next';
import { ServiceWorkerRegister } from '@/components/sw-register';

export const metadata: Metadata = {
  title: 'SmartNetWorth',
  description: 'Kelola kekayaan bersih Anda',
  manifest: '/manifest.json',
  themeColor: '#4338ca',
  icons: {
    icon: [
      { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <head>
        {/* Panggilan Tailwind CSSCDN agar tampilan langsung rapi */}
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body className="bg-slate-50 text-slate-800 antialiased">
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
