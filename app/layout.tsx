import type { Metadata } from 'next';
import { DM_Sans } from 'next/font/google';
import '../styles/tokens.css';
import '../styles/globals.css';

const dmSans = DM_Sans({
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Spotter',
    template: '%s | Spotter',
  },
  description: 'Official gym member portal',
  icons: {
    icon: '/icon.svg',
  },
};

/**
 * Runs before first paint so the correct theme is applied without a flash.
 * An explicit member choice wins; otherwise the OS preference is used.
 * Falls back silently if storage is unavailable.
 */
const themeInitScript = `
(function () {
  try {
    var stored = localStorage.getItem('spotter-theme');
    var theme = stored === 'dark' || stored === 'light'
      ? stored
      : (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.style.colorScheme = theme;
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={dmSans.className} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <meta name="theme-color" content="#f6fef9" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#161d1a" media="(prefers-color-scheme: dark)" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="shortcut icon" href="/icon.svg" />
        <link rel="apple-touch-icon" href="/icon.svg" />
      </head>
      <body>{children}</body>
    </html>
  );
}
