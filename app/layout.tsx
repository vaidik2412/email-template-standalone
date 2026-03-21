import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Email Template Standalone',
  description: 'Standalone email template dashboard modeled after Lydia',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en'>
      <body>{children}</body>
    </html>
  );
}
