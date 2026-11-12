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
    // Browser chrome follows the same decision as the page.
    var color = theme === 'dark' ? '#161d1a' : '#ffffff';
    var metas = document.querySelectorAll('meta[name="theme-color"]');
    for (var i = 0; i < metas.length; i++) metas[i].setAttribute('content', color);
  } catch (e) {}
})();
`;

/**
 * Temporary diagnostics: a stamp that changes whenever the server compiles,
 * so a stale browser tab can be told apart from a stale build.
 * Remove once the profile work is confirmed on the member's own screen.
 */
const BUILD_STAMP = `profile-v2 ${new Date().toISOString().slice(0, 16).replace('T', ' ')}Z`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={dmSans.className}
      data-build={BUILD_STAMP}
      suppressHydrationWarning
    >
      <head>
        <meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#161d1a" media="(prefers-color-scheme: dark)" />
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="shortcut icon" href="/icon.svg" />
        <link rel="apple-touch-icon" href="/icon.svg" />
      </head>
      <body>
        {children}
        {process.env.NODE_ENV !== 'production' ? (
          <div
            data-build-chip={BUILD_STAMP}
            style={{
              position: 'fixed',
              left: 8,
              bottom: 8,
              zIndex: 2147483647,
              padding: '2px 6px',
              borderRadius: 4,
              background: 'rgba(0,0,0,0.75)',
              color: '#fff',
              font: '11px/1.4 ui-monospace, monospace',
              pointerEvents: 'none',
            }}
          >
            {BUILD_STAMP}
          </div>
        ) : null}
      </body>
    </html>
  );
}
