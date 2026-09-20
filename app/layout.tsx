import React from 'react';

export const metadata = {
  title: 'SmartNetWorth',
  description: 'SmartNetWorth App',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
