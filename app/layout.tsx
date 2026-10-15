import type { Metadata } from 'next';
import { DM_Sans } from 'next/font/google';
import '../styles/tokens.css';
import '../styles/globals.css';

const dmSans = DM_Sans({
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Spotter',
  description: 'Member facing web app for gym check-in, records, and answers.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={dmSans.className}>
      <body>{children}</body>
    </html>
  );
}

