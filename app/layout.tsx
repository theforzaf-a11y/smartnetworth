import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'SmartNetWorth',
  description: 'Kelola kekayaan bersih Anda',
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
      </body>
    </html>
  );
}
